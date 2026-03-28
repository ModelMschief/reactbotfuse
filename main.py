print("Starting ttest.py")
import os
import requests
import logging
import time
import jwt
import random
import threading
import uuid
import re
import asyncio
import json
from datetime import datetime, timedelta, timezone
from flask import Flask, request, jsonify, g, make_response, send_file
from flask_cors import CORS
from waitress import serve
from concurrent.futures import ThreadPoolExecutor, as_completed
import io

# --- MongoDB Setup ---
from pymongo import MongoClient
from pymongo.errors import PyMongoError, DuplicateKeyError

# Create a persistent session for the ML Server
# Create a persistent session for the ML Server
ml_session = requests.Session()
tg_session = requests.Session()

# Configure the connection pool to handle high concurrency
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry # <-- Add this import

# Configure automatic retries for dropped connections
retries = Retry(
    total=3,                # Try 3 times before giving up
    backoff_factor=0.5,     # Wait 0.5s, 1s, 2s between retries
    status_forcelist=[500, 502, 503, 504],
    allowed_methods=["POST", "GET"] # explicitly allow retries on POST
)

# Attach the retry logic to the adapter
adapter = HTTPAdapter(pool_connections=15, pool_maxsize=15, max_retries=retries)
ml_session.mount('https://', adapter)
tg_session.mount('https://', adapter)

# ---- In-memory rate limiter (key-based) ----
_RATE_BUCKET = {}  # connection_key -> [timestamps]

# ---- NEW: IP-BASED RATE LIMITER (DoS Protection) ----
_IP_RATE_BUCKET = {} # IP -> [timestamps]

_GLOBAL_RATE_BUCKET = []  # Tracks ALL requests (Global)

def is_global_rate_limited(limit=50, window=1):
    """
    Checks if the TOTAL traffic to the server is too high.
    Default: Max 50 requests per second (Total from everyone).
    """
    global _GLOBAL_RATE_BUCKET
    now = time.time()
    
    # 1. Clean up old timestamps (older than 1 second)
    _GLOBAL_RATE_BUCKET = [t for t in _GLOBAL_RATE_BUCKET if now - t < window]
    
    # 2. Check Global Limit
    if len(_GLOBAL_RATE_BUCKET) >= limit:
        return True # PANIC MODE: Server is full
    
    # 3. Add current request
    _GLOBAL_RATE_BUCKET.append(now)
    return False
    
def get_client_ip():
    """
    Gets the real IP by checking Cloudflare/Render headers first.
    """
    # 1. Cloudflare/Render "True" IP (Most reliable based on your logs)
    if request.headers.get('True-Client-Ip'):
        return request.headers.get('True-Client-Ip')
    
    # 2. Cloudflare Connection IP (Backup)
    if request.headers.get('Cf-Connecting-Ip'):
        return request.headers.get('Cf-Connecting-Ip')
        
    # 3. Standard Forwarded (For other proxies)
    if request.headers.get('X-Forwarded-For'):
        # Sometimes this is a list like "103.x.x.x, 127.0.0.1"
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
        
    # 4. Fallback to direct connection (Localhost)
    return request.remote_addr

def is_ip_blocked(ip_address, limit=5, window=1):
    """
    Blocks IP if they send more than 'limit' requests in 'window' seconds.
    Default: 5 requests per 1 second.
    """
    now = time.time()
    
    # Get existing timestamps for this IP
    bucket = _IP_RATE_BUCKET.setdefault(ip_address, [])
    
    # Clean up old timestamps (older than 1 second)
    _IP_RATE_BUCKET[ip_address] = [t for t in bucket if now - t < window]
    
    # Check if they exceeded the limit
    if len(_IP_RATE_BUCKET[ip_address]) >= limit:
        return True # BLOCKED
    
    # Add new timestamp
    _IP_RATE_BUCKET[ip_address].append(now)
    return False # SAFE
    
# --- Configuration ---
MONGO_URI = os.getenv("MONGO_URI", "").strip()

try:
    mongo_client = MongoClient(MONGO_URI)
    # Check connection
    mongo_client.admin.command('ping')
    print("Connected to MongoDB successfully.")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    # We don't exit here to allow the app to try connecting later or fail gracefully on requests
    
mongo_db = mongo_client['telegram_broadcast_db']

AUTH_BOT_TOKEN = os.getenv("AUTH_BOT_TOKEN", "").strip()
JWT_SECRET = os.getenv("JWT_SECRET", "").strip()
ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID", "1928631932")
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "ADMIN_SECRET_KEY")

BROADCAST_EXECUTOR = ThreadPoolExecutor(max_workers=2)

# --- RAM Storage for files (Temporary) ---
file_ram_storage = {} # task_id -> { "filename": "...", "content": b"..." }

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Flask App Setup ---
app = Flask(__name__)
app.config['LOGGER_NAME'] = 'ttest'  
CORS(app)

import secrets

def generate_connection_key():
    return "acct_" + secrets.token_hex(8)

def rate_limit_ok(key: str, limit: int = 20, window: int = 1) -> bool:
    """
    Allow `limit` requests per `window` seconds per key
    """
    now = time.time()
    bucket = _RATE_BUCKET.setdefault(key, [])

    # keep only timestamps inside window
    bucket[:] = [t for t in bucket if now - t < window]

    if len(bucket) >= limit:
        return False

    bucket.append(now)
    return True


def get_account_by_connection_key(conn_key: str):
    """
    Returns user document if key is valid, else None
    """
    return mongo_db.users.find_one(
        {"connection_key": conn_key},
        {"_id": 1}
    )


def bot_belongs_to_account(user_id, bot_username: str) -> bool:
    """
    Checks whether the bot belongs to the account.
    Converts user_id to string to match UUID storage.
    """
    # Ensure user_id is a string because UUIDs are stored as strings
    search_id = str(user_id)
    
    # Normalize username
    if not bot_username.startswith("@"):
        bot_username = "@" + bot_username

    # Search for the document where _id matches AND the list contains the username
    bot_doc = mongo_db.bots.find_one(
        {
            "_id": search_id,
            "list.username": bot_username
        },
        {"_id": 1}
    )
    
    return bot_doc is not None


def add_user_id_to_bot(user_id, bot_username: str, telegram_user_id: int) -> bool:
    """
    Adds user_id to bot using $addToSet.
    Returns True if a new ID was added, False if it was already there.
    """
    result = mongo_db.bots.update_one(
        {
            "_id": str(user_id), # Make sure this is a string to match your DB!
            "list.username": bot_username
        },
        {
            "$addToSet": {
                "list.$.user_ids": telegram_user_id
            }
        }
    )
    
    # If MongoDB actually changed the document, modified_count will be > 0
    return result.modified_count > 0


# --- Telegram Helpers (using Requests) ---

def pin_telegram_message_requests(bot_token, chat_id, message_id):
    """
    Pins a message in a chat. Fails silently - does not affect broadcast success.
    """
    url = f"https://api.telegram.org/bot{bot_token}/pinChatMessage"
    try:
        response = tg_session.post(url, json={
            "chat_id": chat_id,
            "message_id": message_id,
            "disable_notification": True
        }, timeout=10)
        return response.json()
    except Exception as e:
        logger.warning(f"Failed to pin message: {e}")
        return None

def send_with_retries(url, data=None, json_payload=None, files=None, timeout=10, retries=3):
    """
    Helper function to send requests with retries and backoff for 429.
    Returns: Tuple[str, Optional[dict]] - (status, response_data)
    - "blocked": User blocked bot (403)
    - "failed": Request failed
    - "sent": Request succeeded (includes response JSON)
    """
    for attempt in range(retries):
        try:
            if json_payload:
                response = tg_session.post(url, json=json_payload, timeout=timeout)
            else:
                response = tg_session.post(url, data=data, files=files, timeout=timeout)
            
            if response.status_code == 429:
                # Rate limit hit
                retry_after = int(response.headers.get("Retry-After", 5))
                logger.warning(f"Rate limit hit (429). Sleeping for {retry_after}s.")
                time.sleep(retry_after)
                continue # Retry immediately
            
            # --- Handle 403 (Blocked) Separately ---
            if response.status_code == 403:
                return ("blocked", None)
            
            # --- Do not retry for specific client errors ---
            if response.status_code in [400, 404]:
                logger.warning(f"Request failed with status {response.status_code}. No retry.")
                return ("failed", None)
            
            response.raise_for_status()
            return ("sent", response.json())
            
        except requests.exceptions.RequestException as e:
            logger.warning(f"Request failed (Attempt {attempt+1}/{retries}): {e}")
            if attempt < retries - 1:
                time.sleep(1 * (attempt + 1)) # Simple backoff
            
    logger.error(f"Failed to send after {retries} retries.")
    return ("failed", None)

def send_telegram_message_requests(bot_token, chat_id, text, buttons=None, parse_mode='HTML', should_pin=False):
    """Uses the requests library to synchronously send a Telegram message."""
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text}
    if parse_mode:
        payload['parse_mode'] = parse_mode
    if buttons:
        payload['reply_markup'] = json.dumps({"inline_keyboard": [buttons]})
        
    status, data = send_with_retries(url, json_payload=payload)
    
    # Pin message if requested and send was successful
    if should_pin and status == "sent" and data:
        message_id = data.get("result", {}).get("message_id")
        if message_id:
            pin_telegram_message_requests(bot_token, chat_id, message_id)
            time.sleep(0.2)  # Avoid rate limits
    
    return (status, data)

def send_telegram_photo_requests(bot_token, chat_id, photo_content, caption=None, buttons=None, parse_mode='HTML', should_pin=False):
    """Uses the requests library to synchronously send a photo."""
    url = f"https://api.telegram.org/bot{bot_token}/sendPhoto"
    
    # Files must be re-opened or reset for retries if we were reading from a file object,
    # but here photo_content is bytes, so it's fine to reuse.
    files = {'photo': photo_content}
    data = {'chat_id': chat_id}
    if caption:
        data['caption'] = caption
        if parse_mode:
            data['parse_mode'] = parse_mode
    if buttons:
        data['reply_markup'] = json.dumps({"inline_keyboard": [buttons]})
        
    status, response_data = send_with_retries(url, data=data, files=files, timeout=20)
    
    # Pin message if requested and send was successful
    if should_pin and status == "sent" and response_data:
        message_id = response_data.get("result", {}).get("message_id")
        if message_id:
            pin_telegram_message_requests(bot_token, chat_id, message_id)
            time.sleep(0.2)  # Avoid rate limits
    
    return (status, response_data)

def send_telegram_video_requests(bot_token, chat_id, video_content, caption=None, buttons=None, parse_mode='HTML', should_pin=False):
    """Uses the requests library to synchronously send a video."""
    url = f"https://api.telegram.org/bot{bot_token}/sendVideo"
    files = {'video': video_content}
    data = {'chat_id': chat_id}
    if caption:
        data['caption'] = caption
        if parse_mode:
            data['parse_mode'] = parse_mode
    if buttons:
        data['reply_markup'] = json.dumps({"inline_keyboard": [buttons]})
        
    status, response_data = send_with_retries(url, data=data, files=files, timeout=40)
    
    # Pin message if requested and send was successful
    if should_pin and status == "sent" and response_data:
        message_id = response_data.get("result", {}).get("message_id")
        if message_id:
            pin_telegram_message_requests(bot_token, chat_id, message_id)
            time.sleep(0.2)  # Avoid rate limits
    
    return (status, response_data)

def get_bot_username_requests(bot_token):
    """Uses the requests library to synchronously validate a token."""
    url = f"https://api.telegram.org/bot{bot_token}/getMe"
    try:
        response = tg_session.get(url, timeout=5) # 5-second timeout
        response.raise_for_status()
        data = response.json()
        if data.get("ok"):
            return data.get("result", {}).get("username")
        return None
    except Exception as e:
        logger.error(f"Failed to get bot username: {e}")
        return None

def check_limit(user_id, limit_type, current_count=0):
    """
    Checks if a user can proceed based on their plan limits.
    limit_type: 'bots' or 'users_per_bot'
    Returns: (True, None) or (False, "Error message")
    """
    user = mongo_db.users.find_one({"_id": user_id})
    if not user:
        return False, "User not found"

    # Check Plan & Expiry
    plan = user.get('plan', 'free')
    expiry = user.get('plan_expiry')

    if plan == 'premium' and expiry:
        if datetime.now(timezone.utc) > datetime.fromisoformat(expiry):
            plan = 'free' # Expired

    if plan == 'premium':
        return True, None # Unlimited

    # Free Limits
    if limit_type == 'bots':
        if current_count >= 10:
            return False, "Free plan limit reached: Max 10 bots. Upgrade to Premium."
    elif limit_type == 'users_per_bot':
        if current_count >= 2000:
            return False, "Free plan limit reached: Max 2000 users per bot. Upgrade to Premium."

    return True, None

# --- Security & Auth ---
def create_jwt(user_id):
    """Generates a new JWT token for a user."""
    payload = {
        'sub': user_id,
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(days=1)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def decode_jwt(token):
    """Decodes and validates a JWT token. Returns user_id or None."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload['sub']  # 'sub' is the user_id
    except jwt.ExpiredSignatureError:
        logger.warning("JWT expired")
        return None
    except jwt.InvalidTokenError:
        logger.warning("Invalid JWT")
        return None

# --- CORS Preflight Helper ---
def _build_cors_preflight_response():
    """Builds an OPTIONS response for CORS preflight."""
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response

# --- Auth Middleware ---
@app.before_request
def auth_middleware():
    """
    Checks for JWT on protected routes.
    The user_id is attached to Flask's global `g` object.
    """
    # This will show us exactly what Render sends to your Python app
    
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()

    # A. GLOBAL FLOOD PROTECTION (DDoS)
    # If we get more than 50 requests/sec total, lock the door.
    if is_global_rate_limited(limit=50, window=1):
        logger.warning(f"GLOBAL LIMIT HIT! Blocking request from {client_ip}")
        return jsonify({"error": "Server is under high load. Try again later."}), 503
    # 2. GLOBAL RATE LIMIT (The Defense)
    # This runs BEFORE authentication. Hackers get blocked here    
    client_ip = get_client_ip()
    if is_ip_blocked(client_ip, limit=5, window=1):
        logger.warning(f"DoS Attack blocked from IP: {client_ip}")
        return jsonify({
            "error": "Too many requests. Please slow down.", 
            "retry_after": 1
        }), 429   
    
    g.user_id = None
    if request.path in ['/', '/premium', '/login', '/signup', '/verify-otp', '/health', '/autoup','/request-password-reset', '/reset-password', '/score_user','/genqr']:
        return  # Skip auth for these routes

    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "Authorization header missing"}), 401

    try:
        token_type, token = auth_header.split(' ')
        if token_type.lower() != 'bearer':
            return jsonify({"error": "Invalid token type"}), 401
        
        user_id = decode_jwt(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
            
        g.user_id = user_id
        
    except ValueError:
        return jsonify({"error": "Invalid Authorization header format"}), 401
    except Exception as e:
        logger.error(f"Auth middleware error: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred"}), 500

# --- Flask Routes ---

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/premium')
def premium_page():
    return send_file('premium.html')

@app.route('/health')
def health_check():
    """Public health check endpoint for hosting platforms."""
    # Simple check if DB is responsive
    try:
        mongo_client.admin.command('ping')
        return jsonify({"status": "healthy", "db": "connected"}), 200
    except:
        return jsonify({"status": "unhealthy", "db": "disconnected"}), 500

@app.route('/signup', methods=['POST'])
def signup():
    """
    Handles user signup.
    Stores user info temporarily and sends an OTP via Telegram.
    """
    data = request.json
    email = data.get('email')
    password = data.get('password') # PLAIN TEXT
    telegram_id = data.get('telegram_id')

    if not all([email, password, telegram_id]):
        return jsonify({"error": "Missing email, password, or Telegram ID"}), 400

    # Check if email or telegram_id is already in use
    if mongo_db.users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409
    if mongo_db.users.find_one({"telegram_id": telegram_id}):
        return jsonify({"error": "Telegram ID already registered"}), 409

    # Generate OTP
    otp = str(random.randint(100000, 999999))
    expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    
    otp_message = f"Your verification code is: {otp}"
    
    status, _ = send_telegram_message_requests(AUTH_BOT_TOKEN, telegram_id, otp_message, parse_mode=None) 
    
    if status == "failed" or status == "blocked":
        logger.error(f"Failed to send OTP to {telegram_id}")
        return jsonify({"error": "Failed to send OTP. Check Telegram ID and ensure the bot is not blocked."}), 400
    
    logger.info(f"OTP sent to {telegram_id}")

    # Upsert into pending_users (email is key)
    mongo_db.pending_users.update_one(
        {"_id": email},
        {"$set": {
            "password": password,
            "telegram_id": telegram_id,
            "otp": otp,
            "expires": expires
        }},
        upsert=True
    )
    
    return jsonify({"message": f"OTP sent to Telegram account linked to {email}"}), 200

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verifies the OTP and moves user to the main users list."""
    data = request.json
    email = data.get('email')
    otp = data.get('otp')

    if not all([email, otp]):
        return jsonify({"error": "Missing email or OTP"}), 400
    
    pending_user = mongo_db.pending_users.find_one({"_id": email})
    
    if not pending_user:
        return jsonify({"error": "Invalid email or user"}), 404
        
    expires = datetime.fromisoformat(pending_user['expires'])
    if datetime.now(timezone.utc) > expires:
        mongo_db.pending_users.delete_one({"_id": email})
        return jsonify({"error": "OTP expired"}), 410
        
    if pending_user['otp'] != otp:
        return jsonify({"error": "Invalid OTP"}), 400
        
    user_id = str(uuid.uuid4())
    new_user = {
        "_id": user_id,
        "email": email,
        "password": pending_user['password'],
        "telegram_id": pending_user['telegram_id'],
        "plan": "free"
    }
    
    try:
        mongo_db.users.insert_one(new_user)
        # Initialize empty bots list for user
        mongo_db.bots.insert_one({"_id": user_id, "list": []})
        
        # Cleanup pending
        mongo_db.pending_users.delete_one({"_id": email})
        
        token = create_jwt(user_id)
        return jsonify({"message": "Account verified successfully!", "token": token}), 200
        
    except DuplicateKeyError:
         return jsonify({"error": "User already exists"}), 409
    except Exception as e:
        logger.error(f"Verify OTP error: {e}")
        return jsonify({"error": "Internal error"}), 500

@app.route('/login', methods=['POST'])
def login():
    """Logs in a user with plain text password."""
    data = request.json
    email = data.get('email')
    password = data.get('password')
    print(f"Login attempt for email: {email}")

    if not all([email, password]):
        return jsonify({"error": "Missing email or password"}), 400
        
    user = mongo_db.users.find_one({"email": email})
            
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401
        
    if user['password'] != password:
        return jsonify({"error": "Invalid email or password"}), 401
        
    token = create_jwt(user['_id'])
    return jsonify({"message": "Login successful", "token": token}), 200

# --- Password Reset Routes ---

@app.route('/request-password-reset', methods=['POST'])
def request_password_reset():
    """
    Two-Factor Verification: Requires BOTH email AND telegram_id to match.
    Sends reset link via Telegram with inline button.
    """
    data = request.json
    email = data.get('email')
    telegram_id = data.get('telegram_id')
    
    if not all([email, telegram_id]):
        return jsonify({"error": "Email and Telegram ID are required"}), 400
    
    # Two-Factor Verification: BOTH must match
    user = mongo_db.users.find_one({"email": email, "telegram_id": telegram_id})
    
    # Security: Always return same message to prevent user enumeration
    success_message = "If these details match an account, a reset link has been sent to your Telegram."
    
    if not user:
        # Don't reveal that user doesn't exist
        logger.info(f"Password reset attempted for non-matching email/telegram: {email}")
        return jsonify({"message": success_message}), 200
    
    # Generate secure token (256-bit entropy)
    reset_token = secrets.token_urlsafe(32)
    expires = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
    
    # Store token in database
    mongo_db.password_reset_tokens.insert_one({
        "token": reset_token,
        "user_id": user['_id'],
        "email": email,
        "expires": expires,
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Build reset URL (frontend route)
    # Using relative path that works with HashRouter
    frontend_url = os.getenv("FRONTEND_URL", "https://bot-fusion.wuaze.com")
    reset_url = f"{frontend_url}/#/reset-password?token={reset_token}"
    
    # Send Telegram message with inline button
    reset_message = (
        "🔐 <b>Password Reset Request</b>\n\n"
        "Click the button below to reset your password.\n"
        "⚠️ This link expires in <b>5 minutes</b>."
    )
    
    buttons = [{"text": "🔑 Reset Password", "url": reset_url ,"style":"success"}]
    
    status, _ = send_telegram_message_requests(AUTH_BOT_TOKEN, telegram_id, reset_message, buttons=buttons)
    
    if status == "failed" or status == "blocked":
        logger.error(f"Failed to send reset link to {telegram_id}")
        # Still return success to prevent enumeration
        return jsonify({"message": success_message}), 200
    
    logger.info(f"Password reset link sent to {telegram_id} for user {email}")
    return jsonify({"message": success_message}), 200


@app.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Validates reset token and updates user password.
    Token must be valid, not expired, and not already used.
    """
    data = request.json
    token = data.get('token')
    new_password = data.get('new_password')
    
    if not all([token, new_password]):
        return jsonify({"error": "Token and new password are required"}), 400
    
    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    
    # Find token
    token_doc = mongo_db.password_reset_tokens.find_one({"token": token})
    
    if not token_doc:
        return jsonify({"error": "Invalid or expired reset link"}), 400
    
    # Check if already used
    if token_doc.get('used', False):
        return jsonify({"error": "This reset link has already been used"}), 400
    
    # Check expiry
    expires = datetime.fromisoformat(token_doc['expires'])
    if datetime.now(timezone.utc) > expires:
        return jsonify({"error": "Reset link has expired. Please request a new one."}), 410
    
    # Update password
    result = mongo_db.users.update_one(
        {"_id": token_doc['user_id']},
        {"$set": {"password": new_password}}
    )
    
    if result.modified_count == 0:
        return jsonify({"error": "Failed to update password"}), 500
    
    # Mark token as used
    mongo_db.password_reset_tokens.update_one(
        {"token": token},
        {"$set": {"used": True}}
    )
    
    logger.info(f"Password reset successful for user {token_doc['email']}")
    return jsonify({"message": "Password reset successful! You can now login with your new password."}), 200

# --- Premium Routes ---

@app.route('/request-premium', methods=['POST'])
def request_premium():
    user_id = g.user_id
    data = request.json
    package = data.get('package') # '1_month', '3_months', '1_year'

    if not package:
        return jsonify({"error": "Package not selected"}), 400

    user = mongo_db.users.find_one({"_id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Generate Redeem Code
    code = f"PREM-{uuid.uuid4().hex[:8].upper()}"
    
    # Determine duration
    duration_map = {
        'Starter (1 Month)': 30,
        'Standard (3 Months)': 90,
        'Pro (1 Year)': 365,
        '1m': 30,
        '3m': 90,
        '1y': 365
    }
    duration_days = duration_map.get(package, 30) # Default to 30 if unknown
    telegram_id = user.get("telegram_id", "Not Linked")

    # Store Code
    mongo_db.redeem_codes.insert_one({
        "_id": code,
        "package": package,
        "duration_days": duration_days,
        "status": "active",
        "created_for": user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    admin_message = (
        f"<b>Premium Request</b>\n"
        f"User: {user['email']}\n"
        f"ID: <code>{user_id}</code>\n"
        f'Telegram ID: <a href="tg://user?id={telegram_id}">{telegram_id}</a>\n'
        f"Package: {package}\n"
        f"-------------------\n"
        f"<b>Generated Code:</b>\n"
        f"<code>{code}</code>\n"
        f"-------------------\n"
        f"Action: Verify payment then send code to user."
    )
    
    # Send to Admin
    send_telegram_message_requests(AUTH_BOT_TOKEN, ADMIN_CHAT_ID, admin_message)
    
    req_id = str(uuid.uuid4())
    mongo_db.premium_requests.insert_one({
        "_id": req_id,
        "user_id": user_id,
        "email": user['email'],
        "package": package,
        "generated_code": code,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return jsonify({"message": "Request sent! Please wait for admin approval."}), 200

@app.route('/redeem-code', methods=['POST'])
def redeem_code():
    user_id = g.user_id
    code = request.json.get('code')

    if not code:
        return jsonify({"error": "Code required"}), 400

    redeem_entry = mongo_db.redeem_codes.find_one({"_id": code})
    
    if not redeem_entry:
            return jsonify({"error": "Invalid code"}), 400
            
    if redeem_entry['status'] != 'active':
            return jsonify({"error": "Code already used or inactive"}), 400
            
    # Apply Premium
    duration = redeem_entry.get('duration_days', 30)
    user = mongo_db.users.find_one({"_id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Calculate new expiry
    current_expiry = user.get('plan_expiry')
    now = datetime.now(timezone.utc)
    
    if current_expiry and datetime.fromisoformat(current_expiry) > now:
        # Extend existing
        new_expiry = datetime.fromisoformat(current_expiry) + timedelta(days=duration)
    else:
        # Start new
        new_expiry = now + timedelta(days=duration)
        
    mongo_db.users.update_one(
        {"_id": user_id},
        {"$set": {
            "plan": "premium",
            "plan_expiry": new_expiry.isoformat()
        }}
    )
    
    # Mark code used
    mongo_db.redeem_codes.update_one(
        {"_id": code},
        {"$set": {
            "status": "used",
            "used_by": user_id,
            "used_at": now.isoformat()
        }}
    )

    return jsonify({"message": f"Premium activated! Valid until {new_expiry.strftime('%Y-%m-%d')}"}), 200

# --- Protected Routes (Require JWT) ---

@app.route('/generate-connection-key', methods=['POST'])
def generate_or_revoke_connection_key():
    user_id = g.user_id

    new_key = generate_connection_key()

    mongo_db.users.update_one(
        {"_id": user_id},
        {"$set": {"connection_key": new_key}}
    )

    return jsonify({
        "connection_key": new_key
    }), 200

@app.route('/integration-info', methods=['GET'])
def integration_info():
    user_id = g.user_id

    user = mongo_db.users.find_one(
        {"_id": user_id},
        {"connection_key": 1}
    )

    bots_doc = mongo_db.bots.find_one({"_id": user_id})
    bots = []

    if bots_doc:
        bots = [b["username"] for b in bots_doc.get("list", [])]

    return jsonify({
        "connection_key": user.get("connection_key"),
        "bots": bots
    }), 200

@app.route('/score_user', methods=['POST'])
def score_user():
    # 1. Header validation
    conn_key = request.headers.get("X-CONNECTION-KEY")
    if not conn_key:
        return jsonify({"error": "Missing connection key"}), 401

    # 2. Rate limiting (shares the limit bucket with /autoup)
    if not rate_limit_ok(conn_key, limit=20, window=1):
        return jsonify({"error": "Rate limit exceeded"}), 429

    # 3. Resolve account (verifies the key is real)
    account = get_account_by_connection_key(conn_key)
    if not account:
        return jsonify({"error": "Invalid connection key"}), 403

    # 4. Extract the payload
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "Invalid JSON body"}), 400

    # 5. Forward to the Render ML Server
    ml_url = "https://anomalyendpoint.onrender.com/score_user"
    try:
        # Added a 15s timeout in case the free Render instance is waking up
        ml_response = ml_session.post(ml_url, json=data, timeout=20)
        
        # Parse and return the exact response from the ML server
        try:
            return jsonify(ml_response.json()), ml_response.status_code
        except ValueError:
            logger.error(f"ML server returned non-JSON. Status: {ml_response.status_code}")
            return jsonify({"error": "Invalid response from ML server"}), 502
            
    except requests.exceptions.Timeout:
        return jsonify({"error": "ML server timeout (might be waking up). Try again."}), 504
    except requests.exceptions.RequestException as e:
        logger.error(f"Error communicating with ML server: {e}")
        return jsonify({"error": "Failed to connect to ML server."}), 502
    
@app.route('/genqr', methods=['POST'])
def generate_qr_proxy():
    # 1. Header validation
    conn_key = request.headers.get("X-CONNECTION-KEY")
    if not conn_key:
        return jsonify({"error": "Missing connection key"}), 401

    # 2. Rate limiting
    if not rate_limit_ok(conn_key, limit=20, window=1):
        return jsonify({"error": "Rate limit exceeded"}), 429

    # 3. Resolve account
    account = get_account_by_connection_key(conn_key)
    if not account:
        return jsonify({"error": "Invalid connection key"}), 403

    qr_engine_url = "https://anomalyendpoint.onrender.com/generate_qr"
    
    try:
        files_to_forward = {}
        data_to_forward = {}
        is_multipart = False
        telegram_url = None

        # 4. PARSE INCOMING REQUEST
        if request.files or request.form:
            is_multipart = True
            # A. Extract any direct file uploads
            if request.files:
                for key, file_storage in request.files.items():
                    file_content = file_storage.read()
                    if len(file_content) > 10 * 1024 * 1024:
                        return jsonify({"error": "File size exceeds 10 MB limit"}), 400
                    files_to_forward[key] = (file_storage.filename, file_content, file_storage.content_type)
            
            # B. Extract form data and look for telegram_url
            data_to_forward = request.form.to_dict()
            telegram_url = data_to_forward.pop("telegram_url", None)
            
        else:
            # C. Parse standard JSON
            try:
                payload = request.get_json(force=True)
                if payload is None: payload = {}
            except Exception:
                return jsonify({"error": "Invalid JSON body"}), 400

            telegram_url = payload.pop("telegram_url", None)
            
            # If a telegram_url is in the JSON, we MUST convert this request to multipart
            # so the sub-server can receive the downloaded file properly.
            if telegram_url:
                is_multipart = True
                if "data" in payload:
                    data_to_forward["data"] = payload.pop("data")
                # The remaining JSON becomes the stringified "config" expected by the sub-server
                data_to_forward["config"] = json.dumps(payload)
            else:
                data_to_forward = payload # Standard pass-through

        # 5. RESOLVE TELEGRAM URL (If provided and no direct file was uploaded)
        if telegram_url and "logo" not in files_to_forward:
            try:
                tg_resp = tg_session.get(telegram_url, timeout=15)
                if tg_resp.status_code != 200:
                    return jsonify({"error": f"Failed to fetch image from Telegram (HTTP {tg_resp.status_code})"}), 400
                
                tg_content = tg_resp.content
                if len(tg_content) > 10 * 1024 * 1024:
                    return jsonify({"error": "Telegram image exceeds 10 MB limit"}), 400
                
                # --- ROBUST EXTENSION MAPPING ---
                content_type = tg_resp.headers.get('Content-Type', '').lower()
                
                # Map Telegram's raw types (like octet-stream) to engine-approved extensions
                ext_map = {
                    'image/jpeg': 'jpg',
                    'image/jpg': 'jpg',
                    'image/png': 'png',
                    'image/webp': 'webp',
                    'application/octet-stream': 'jpg' 
                }
                
                ext = ext_map.get(content_type)
                if not ext:
                    ext = content_type.split('/')[-1] if '/' in content_type else 'jpg'
                
                # Final safety check for Engine compatibility
                if ext not in ['jpg', 'jpeg', 'png', 'webp']:
                    ext = 'jpg'
                
                # Pack the fetched image as if it were a direct file upload
                files_to_forward["logo"] = (f"tg_logo.{ext}", tg_content, content_type)
                is_multipart = True 
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Error fetching Telegram URL: {e}")
                return jsonify({"error": "Failed to connect to Telegram API to fetch image."}), 400

        # 6. FORWARD TO RENDER ENGINE
        if is_multipart:
            qr_response = ml_session.post(
                qr_engine_url, 
                data=data_to_forward, 
                files=files_to_forward if files_to_forward else None, 
                timeout=45 
            )
        else:
            # Strictly raw JSON bodies (No files, no telegram urls)
            qr_response = ml_session.post(qr_engine_url, json=data_to_forward, timeout=30)

        # 7. RESPONSE HANDLING
        if qr_response.headers.get('Content-Type') == 'image/png':
            return send_file(
                io.BytesIO(qr_response.content),
                mimetype='image/png',
                as_attachment=True,
                download_name='botfusion_qr.png'
            )
        else:
            try:
                return jsonify(qr_response.json()), qr_response.status_code
            except ValueError:
                return jsonify({"error": "Invalid response from QR Engine"}), 502
                
    except requests.exceptions.Timeout:
        return jsonify({"error": "QR Engine timeout. Try again."}), 504
    except requests.exceptions.RequestException as e:
        logger.error(f"Error communicating with QR Engine: {e}")
        return jsonify({"error": "Failed to connect to QR Engine."}), 502

@app.route('/autoup', methods=['POST'])
def autoup():
    # ---- Header validation ----
    conn_key = request.headers.get("X-CONNECTION-KEY")
    if not conn_key:
        return jsonify({"error": "Missing connection key"}), 401

    # ---- Rate limiting ----
    if not rate_limit_ok(conn_key, limit=20, window=1):
        return jsonify({"error": "Rate limit exceeded"}), 429

    # ---- Payload validation ----
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "Invalid JSON body"}), 400

    bot_username = data.get("bot_username")
    telegram_user_id = data.get("user_id")

    if not bot_username or not isinstance(bot_username, str):
        return jsonify({"error": "Invalid bot_username"}), 400

    if not telegram_user_id:
        return jsonify({"error": "Invalid user_id"}), 400
    
    bot_username = bot_username.lower()
    telegram_user_id = str(telegram_user_id).strip() # Ensure it's a string for consistent storage

    if not telegram_user_id.isdigit():
        return jsonify({"error": "user_id must contain only numbers"}), 400
    # normalize username
    if not bot_username.startswith("@"):
        bot_username = "@" + bot_username

    # ---- Resolve account ----
    account = get_account_by_connection_key(conn_key)
    if not account:
        return jsonify({"error": "Invalid connection key"}), 403

    owner_id = account["_id"]

    # ---- Verify bot ownership ----
    if not bot_belongs_to_account(owner_id, bot_username):
        return jsonify({"error": "Bot does not belong to this account"}), 404

    # ---- Insert user ID (idempotent) ----
    try:
        is_new_user = add_user_id_to_bot(owner_id, bot_username, telegram_user_id)
    except Exception as e:
        # DB failure should not crash bot apps
        return jsonify({"error": "Database error"}), 500

    # ---- Success ----
    if is_new_user:
        return jsonify({
            "status": "ok",
            "message": "User added successfully",
            "bot": bot_username,
            "user_id": telegram_user_id
        }), 200
    else:
        return jsonify({
            "status": "ok",
            "message": "User ID already exists",
            "bot": bot_username,
            "user_id": telegram_user_id
        }), 200


@app.route('/dashboard', methods=['GET'])
def get_dashboard():
    """Fetches all bot and task data for the logged-in user."""
    user_id = g.user_id
    
    bots_doc = mongo_db.bots.find_one({"_id": user_id})
    user_bots = bots_doc.get("list", []) if bots_doc else []
    
    user_tasks = list(mongo_db.tasks.find({"user_id": user_id}))
    # Convert Mongo _id if needed, but we used str _id so it's fine
    
    user = mongo_db.users.find_one({"_id": user_id})
    plan = user.get('plan', 'free')
    # Check expiry logic for display
    if plan == 'premium' and user.get('plan_expiry'):
         if datetime.now(timezone.utc) > datetime.fromisoformat(user['plan_expiry']):
             plan = 'free (expired)'

    bots_summary = []
    for bot in user_bots:
        bots_summary.append({
            "token": bot['token'],
            "username": bot['username'],
            "user_count": len(bot.get('user_ids', []))
        })
        
    return jsonify({
        "bots": bots_summary, 
        "tasks": user_tasks,
        "plan": {
            "type": plan,
            "expiry": user.get('plan_expiry')
        }
    }), 200

@app.route('/add-bot', methods=['POST'])
def add_bot():
    """Adds a new bot for the user."""
    user_id = g.user_id
    data = request.json
    bot_token = data.get('bot_token')
    
    if not bot_token:
        return jsonify({"error": "Bot token is required"}), 400
        
    username = get_bot_username_requests(bot_token)
    
    if not username:
        return jsonify({"error": "Invalid bot token"}), 400
    
    username = username.lower()
        
    logger.info(f"Adding bot @{username} for user {user_id}")
        
    bots_doc = mongo_db.bots.find_one({"_id": user_id})
    user_bots = bots_doc.get("list", []) if bots_doc else []
    
    # Check Limits
    allowed, msg = check_limit(user_id, 'bots', len(user_bots))
    if not allowed:
        return jsonify({"error": msg}), 403

    if any(b['token'] == bot_token for b in user_bots):
        return jsonify({"error": "This bot is already added"}), 409
        
    new_bot = {
        "token": bot_token,
        "username": f"@{username}",
        "user_ids": []
    }
    
    # Atomically push if possible, but we're re-writing the whole list structure 
    # based on legacy design. For Mongo, $push is better.
    mongo_db.bots.update_one(
        {"_id": user_id},
        {"$push": {"list": new_bot}},
        upsert=True
    )
            
    return jsonify({
        "message": f"Bot @{username} added!",
        "token": bot_token,
        "username": f"@{username}",
        "user_count": 0
    }), 201

@app.route('/delete-bot', methods=['POST'])
def delete_bot():
    """Deletes a bot for the user."""
    user_id = g.user_id
    data = request.json
    bot_token = data.get('bot_token')
    
    if not bot_token:
        return jsonify({"error": "Bot token is required"}), 400
        
    result = mongo_db.bots.update_one(
        {"_id": user_id},
        {"$pull": {"list": {"token": bot_token}}}
    )
    
    if result.modified_count == 0:
        return jsonify({"error": "Bot not found"}), 404
            
    return jsonify({"message": "Bot deleted successfully"}), 200

# --- Background Task Routes ---

def task_run_file_parse(task_id, file_content, bot_token, user_id):
    """
    Background worker function for parsing a user list file.
    """
    logger.info(f"[Task {task_id}] Starting file parse...")
    try:
        found_ids = set(re.findall(r'\b\d{9,11}\b', file_content))
        
        if not found_ids:
            raise ValueError("No valid Telegram IDs found in the file.")
            
        logger.info(f"[Task {task_id}] Found {len(found_ids)} potential IDs.")
        
        # We need to fetch the current bot to check limits and update it
        # Since 'bots' stores a list, we have to find the document and filter the array
        bots_doc = mongo_db.bots.find_one({"_id": user_id})
        if not bots_doc:
            raise ValueError("User bots record not found.")
            
        user_bots = bots_doc.get("list", [])
        bot_to_update = next((b for b in user_bots if b['token'] == bot_token), None)
        
        if not bot_to_update:
            raise ValueError("Bot not found during task update.")
            
        current_ids = set(bot_to_update.get('user_ids', []))
        original_count = len(current_ids)
        
        # Check Limits
        potential_count = len(current_ids.union(found_ids))
        
        allowed, msg = check_limit(user_id, 'users_per_bot', potential_count)
        if not allowed:
            raise ValueError(msg)

        current_ids.update(found_ids) 
        new_list = list(current_ids)
        new_count = len(new_list)
        added_count = new_count - original_count
        
        # Update the specific bot in the list
        # We can use positional operator $ if we queried for it, but here we just update the whole list or pull/push?
        # Replacing the whole bot object in the list is tricky with atomic operators if we don't know the index.
        # But we can use arrayFilters.
        
        mongo_db.bots.update_one(
            {"_id": user_id, "list.token": bot_token},
            {"$set": {"list.$.user_ids": new_list}}
        )
        
        mongo_db.tasks.update_one(
            {"_id": task_id},
            {"$set": {
                "status": "complete",
                "progress": {
                    "found": len(found_ids),
                    "added": added_count,
                    "total_users": new_count
                },
                "updated_bot_info": {
                    "token": bot_token,
                    "username": bot_to_update['username'],
                    "user_count": new_count
                }
            }}
        )
        
        logger.info(f"[Task {task_id}] File parse complete. Added {added_count} new users.")

    except Exception as e:
        logger.error(f"[Task {task_id}] File parse FAILED: {e}", exc_info=True)
        mongo_db.tasks.update_one(
            {"_id": task_id},
            {"$set": {
                "status": "failed",
                "error": str(e)
            }}
        )

@app.route('/upload-users', methods=['POST'])
def upload_users():
    """Handles file upload and starts a background parsing task."""
    user_id = g.user_id
    
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    bot_token = request.form.get('bot_token')
    
    if file.filename == '' or not bot_token:
        return jsonify({"error": "No selected file or bot token"}), 400
        
    try:
        file_content = file.read().decode('utf-8')
    except Exception as e:
        return jsonify({"error": f"Failed to read file: {e}"}), 400

    task_id = str(uuid.uuid4())
    new_task = {
        "_id": task_id,
        "id": task_id, # Keep "id" field for frontend compatibility
        "user_id": user_id,
        "type": "file_parse",
        "status": "pending",
        "related_bot_token": bot_token,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "progress": {},
        "error": None
    }
    
    mongo_db.tasks.insert_one(new_task)
    
    threading.Thread(target=task_run_file_parse, args=(task_id, file_content, bot_token, user_id)).start()
    
    return jsonify({"message": "File upload successful, parsing started.", "task_id": task_id}), 202

def task_run_broadcast(task_id, bot_tokens_map, all_user_ids, user_id):
    """
    Broadcast worker.
    Supports stopping, periodic progress updates, and auto-removal of blocked users (403).
    """
    task = mongo_db.tasks.find_one({"_id": task_id})
    if not task:
        logger.error(f"[Task {task_id}] Broadcast FAILED: Task not found in DB.")
        return

    content_type = task['content_type']
    message = task['message']
    buttons = task['buttons']
    should_pin = task.get('pin_message', False)  # Pin message feature

    # Flatten the target list: (bot_token, user_id)
    broadcast_targets = []
    for token, info in bot_tokens_map.items():
        for uid in info["user_ids"]:
            broadcast_targets.append((token, uid))

    total_recipients = len(broadcast_targets)
    logger.info(f"[Task {task_id}] Starting broadcast to {total_recipients} targets.")

    mongo_db.tasks.update_one(
        {"_id": task_id},
        {"$set": {
            "status": "running",
            "progress.total": total_recipients,
            "progress.sent": 0,
            "progress.failed": 0
        }}
    )

    sent_count = 0
    failed_count = 0
    
    # --- NEW: Store blocked users to remove later ---
    # Structure: { "bot_token": [user_id_1, user_id_2] }
    blocked_users_map = {} 

    BATCH_SIZE = 10
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        for i in range(0, total_recipients, BATCH_SIZE):
            # Check for STOP signal from DB
            current_task_state = mongo_db.tasks.find_one({"_id": task_id}, {"status": 1})
            if current_task_state and current_task_state.get("status") == "stopped":
                logger.info(f"[Task {task_id}] Broadcast STOPPED by user.")
                break
                
            batch = broadcast_targets[i : i + BATCH_SIZE]
            
            # We map futures to their info so we know WHICH user failed
            future_to_info = {}
            
            for bot_token, user_id_str in batch:
                future = None
                if content_type == 'text':
                    future = executor.submit(send_telegram_message_requests, bot_token, user_id_str, message, buttons=buttons, should_pin=should_pin)
                elif content_type == 'image':
                    photo_content = file_ram_storage[task_id]['content']
                    future = executor.submit(send_telegram_photo_requests, bot_token, user_id_str, photo_content, caption=message, buttons=buttons, should_pin=should_pin)
                elif content_type == 'video':
                    video_content = file_ram_storage[task_id]['content']
                    future = executor.submit(send_telegram_video_requests, bot_token, user_id_str, video_content, caption=message, buttons=buttons, should_pin=should_pin)
                
                if future:
                    future_to_info[future] = (bot_token, user_id_str)

            # Wait for batch completion and process results
            for f in as_completed(future_to_info):
                token_used, target_uid = future_to_info[f]
                try:
                    status, _ = f.result()  # Unpack tuple (status, data)
                    if status == "sent":
                        sent_count += 1
                    elif status == "blocked":
                        # User blocked the bot -> Count as failed AND add to removal list
                        failed_count += 1
                        if token_used not in blocked_users_map:
                            blocked_users_map[token_used] = []
                        blocked_users_map[token_used].append(target_uid)
                    else:
                        # Standard failure
                        failed_count += 1
                except:
                    failed_count += 1
            
            # Update Progress in Mongo
            mongo_db.tasks.update_one(
                {"_id": task_id},
                {"$set": {
                    "progress.sent": sent_count,
                    "progress.failed": failed_count
                }}
            )
            time.sleep(0.4)

    # --- CLEANUP: Remove blocked users from DB ---
    if blocked_users_map:
        logger.info(f"[Task {task_id}] Removing blocked users (403)...")
        for b_token, b_uids in blocked_users_map.items():
            if b_uids:
                try:
                    # Remove all collected IDs for this specific bot
                    mongo_db.bots.update_one(
                        {"_id": user_id, "list.token": b_token},
                        {"$pull": {"list.$.user_ids": {"$in": b_uids}}}
                    )
                    logger.info(f"Removed {len(b_uids)} blocked users for bot token ending in ...{b_token[-5:]}")
                except Exception as e:
                    logger.error(f"Failed to remove blocked users: {e}")
    # ---------------------------------------------

    # Final Status Check
    current_task_state = mongo_db.tasks.find_one({"_id": task_id}, {"status": 1})
    final_status = "complete"
    if current_task_state and current_task_state.get("status") == "stopped":
        final_status = "stopped"
    
    mongo_db.tasks.update_one(
        {"_id": task_id},
        {"$set": {
            "status": final_status,
            "progress.sent": sent_count,
            "progress.failed": failed_count
        }}
    )

    logger.info(f"[Task {task_id}] Broadcast finished. Status: {final_status}. Sent: {sent_count}, Failed: {failed_count}")
    
    # Cleanup RAM
    if task_id in file_ram_storage:
        del file_ram_storage[task_id]
        logger.info(f"[Task {task_id}] Removed file from RAM.")
       

@app.route('/start-broadcast', methods=['POST'])
def start_broadcast():
    """Handles multipart form data to start a broadcast."""
    user_id = g.user_id
    
    content_type = request.form.get('content_type', 'text')
    message = request.form.get('message', '')
    buttons_json = request.form.get('buttons', '[]')
    excluded_bot_tokens_json = request.form.get('excluded_bot_tokens', '[]')
    pin_message = request.form.get('pin_message', 'false').lower() == 'true'  # Pin message feature
    
    if content_type in ['image', 'video'] and 'file' not in request.files:
        return jsonify({"error": "File is required for image or video broadcasts"}), 400

    if content_type == 'text' and not message:
        return jsonify({"error": "Message is required for text broadcasts"}), 400

    task_id = str(uuid.uuid4())
    
    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "File is required for image or video broadcasts"}), 400
        
        file_content = file.read()
        
        if len(file_content) > 10 * 1024 * 1024:
            return jsonify({"error": "File size exceeds 10 MB limit"}), 400
            
        file_ram_storage[task_id] = {
            "filename": file.filename,
            "content": file_content
        }

    bots_doc = mongo_db.bots.find_one({"_id": user_id})
    user_bots = bots_doc.get("list", []) if bots_doc else []
    
    excluded_bot_tokens = json.loads(excluded_bot_tokens_json)
    
    bots_to_send = [
        bot for bot in user_bots 
        if bot['token'] not in excluded_bot_tokens
    ]
    
    if not bots_to_send:
        return jsonify({"error": "No bots selected for broadcast"}), 400
        
    bot_token_map = {} 
    total_targets = 0

    for bot in bots_to_send:
        user_ids_set = set(bot.get('user_ids', []))
        bot_token_map[bot['token']] = {"user_ids": list(user_ids_set)}
        total_targets += len(user_ids_set)
        
    if total_targets == 0:
        return jsonify({"error": "No users found for the selected bots"}), 400
        
    new_task = {
        "_id": task_id,
        "id": task_id,
        "user_id": user_id,
        "type": "broadcast",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "content_type": content_type,
        "message": message,
        "buttons": json.loads(buttons_json),
        "pin_message": pin_message,  # Pin message feature
        "progress": { "total": total_targets, "sent": 0, "failed": 0 },
        "error": None
    }
    
    mongo_db.tasks.insert_one(new_task)
    
    BROADCAST_EXECUTOR.submit(task_run_broadcast, task_id, bot_token_map, None, user_id)
    
    return jsonify({"message": "Broadcast started!", "task_id": task_id}), 202

@app.route('/stop-broadcast/<task_id>', methods=['POST'])
def stop_broadcast(task_id):
    """Stops a running broadcast."""
    user_id = g.user_id
    
    task = mongo_db.tasks.find_one({"_id": task_id, "user_id": user_id})
    if not task:
        return jsonify({"error": "Task not found"}), 404
        
    if task['status'] not in ['pending', 'running']:
        return jsonify({"message": f"Task is already {task['status']}"}), 200
        
    mongo_db.tasks.update_one(
        {"_id": task_id},
        {"$set": {"status": "stopped"}}
    )
    
    return jsonify({"message": "Broadcast stop signal sent."}), 200

@app.route('/task-status/<task_id>', methods=['GET'])
def get_task_status(task_id):
    task = mongo_db.tasks.find_one({"_id": task_id})
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    return jsonify(task), 200

# --- Main Entry Point ---
if __name__ == '__main__':
    logger.info("Starting services...")
    logger.info(f"Starting Flask web server on http://0.0.0.0:8080")
    serve(app, host='0.0.0.0', port=8080, threads=15)
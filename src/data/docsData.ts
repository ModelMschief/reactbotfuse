import { DocCategory, RateLimitRule, StatusCodeInfo } from '../types/docs';

export const RATE_LIMIT_RULES: RateLimitRule[] = [
  {
    scope: 'Global Flood Blocker',
    limit: '50 req/sec',
    window: '1 second rolling window',
    action: 'HTTP 503 Server Under High Load',
    description: 'Protects the entire BotFusion cluster from flood traffic and volumetric spikes.'
  },
  {
    scope: 'IP-Based DoS Blocker',
    limit: '5 req/sec',
    window: '1 second per client IP',
    action: 'HTTP 429 Too Many Requests',
    description: 'Inspects True-Client-Ip, Cf-Connecting-Ip, X-Forwarded-For, and remote socket address.'
  },
  {
    scope: 'Connection Key Limiter',
    limit: '20 req/sec',
    window: '1 second per X-CONNECTION-KEY',
    action: 'HTTP 429 Key Rate Limit Exceeded',
    description: 'Enforced across all public microservices (/autoup, /score_user, /genqr, /gen_link, /profanity_check).'
  },
  {
    scope: 'BotFusion Pay Gateway Limiter',
    limit: '1 req/sec (Free), 2 req/sec (Premium)',
    window: 'Redis sliding window per API Key',
    action: 'HTTP 429 Gateway Rate Limit Exceeded',
    description: 'Applies to /bfpay/* proxy routes using Redis Cloud sliding window counters.'
  },
  {
    scope: 'Broadcast Delivery Engine',
    limit: '15 msg/sec',
    window: 'Telegram Bot API safety cap',
    action: 'Auto-throttled queue with worker pool',
    description: 'Batched broadcast dispatch to prevent Telegram Bot API 429 Flood Wait rate limits.'
  }
];

export const STATUS_CODES: StatusCodeInfo[] = [
  {
    code: 200,
    status: 'OK',
    description: 'Request completed successfully.',
    meaningInBotFusion: 'Standard success response containing requested resources or confirmation.'
  },
  {
    code: 201,
    status: 'Created',
    description: 'Resource created successfully.',
    meaningInBotFusion: 'Returned when registering bots, provisioning crypto accounts, or generating invoices.'
  },
  {
    code: 400,
    status: 'Bad Request',
    description: 'Malformed request syntax or missing required fields.',
    meaningInBotFusion: 'Request body failed JSON parsing or missing required parameter like bot_token, email, etc.'
  },
  {
    code: 401,
    status: 'Unauthorized',
    description: 'Missing, invalid, or expired authentication token.',
    meaningInBotFusion: 'Invalid Bearer JWT, session version mismatch (revoked token), or invalid API key.'
  },
  {
    code: 403,
    status: 'Forbidden',
    description: 'Access denied or quota limit reached.',
    meaningInBotFusion: 'Attempted to perform action unauthorized for tier (e.g. Free tier bot limit reached) or invalid secret.'
  },
  {
    code: 404,
    status: 'Not Found',
    description: 'Target resource does not exist.',
    meaningInBotFusion: 'User, bot, broadcast task, or invoice ID not found in MongoDB.'
  },
  {
    code: 409,
    status: 'Conflict',
    description: 'Duplicate resource conflict.',
    meaningInBotFusion: 'Email or Telegram ID is already registered, or bot token is already bound to another account.'
  },
  {
    code: 429,
    status: 'Too Many Requests',
    description: 'Rate limit exceeded.',
    meaningInBotFusion: 'IP rate limit (5 req/s), Connection Key rate limit (20 req/s), or Gateway limit exceeded.'
  },
  {
    code: 500,
    status: 'Internal Server Error',
    description: 'Unexpected server-side error.',
    meaningInBotFusion: 'Downstream microservice or database connection temporary failure.'
  },
  {
    code: 503,
    status: 'Service Unavailable',
    description: 'Server under high load.',
    meaningInBotFusion: 'Global flood rate limiter triggered when aggregate cluster requests exceed 50 req/s.'
  }
];

export const DOC_CATEGORIES: DocCategory[] = [
  {
    id: 'auth',
    name: 'Authentication & Identity',
    description: 'User registration, Telegram OTP 2FA, JWT session management, Google OAuth 2.0, and instant session revocation.',
    iconName: 'Shield',
    badge: 'Core Auth',
    endpoints: [
      {
        id: 'auth-signup',
        category: 'auth',
        method: 'POST',
        path: '/signup',
        title: 'User Registration with Telegram OTP',
        summary: 'Initiate user account registration and dispatch 6-digit OTP via Telegram bot.',
        description: 'Validates that the email and Telegram ID are not already taken. Generates a cryptographically secure 6-digit OTP, sends it directly to the user via @authentcastbot, and stages the registration in pending_users for 10 minutes.',
        auth: 'None',
        rateLimit: '5 req/sec (IP Rate Limit)',
        parameters: [
          {
            name: 'email',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Valid user email address.',
            example: 'developer@example.com'
          },
          {
            name: 'password',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Account password (minimum 6 characters).',
            example: 'P@ssw0rdSecure!'
          },
          {
            name: 'telegram_id',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Numeric Telegram User ID to receive OTP.',
            example: '1928631932'
          }
        ],
        requestBodyExample: {
          email: 'developer@example.com',
          password: 'P@ssw0rdSecure!',
          telegram_id: '1928631932'
        },
        responses: [
          {
            status: 200,
            description: 'OTP dispatched successfully.',
            body: JSON.stringify({
              status: 'otp_sent',
              message: 'OTP sent to your Telegram account. Please verify within 10 minutes.'
            }, null, 2)
          },
          {
            status: 409,
            description: 'Email or Telegram ID already exists.',
            body: JSON.stringify({
              error: 'Email or Telegram ID is already registered.'
            }, null, 2)
          }
        ],
        notes: [
          'The user must have started a chat with @authentcastbot on Telegram to receive the OTP message.',
          'OTP codes expire strictly after 600 seconds (10 minutes).'
        ],
        tags: ['Signup', 'OTP', '2FA']
      },
      {
        id: 'auth-verify-otp',
        category: 'auth',
        method: 'POST',
        path: '/verify-otp',
        title: 'Verify Signup OTP & Issue JWT',
        summary: 'Submit the 6-digit OTP received via Telegram to finalize account creation and obtain a JWT.',
        description: 'Validates the submitted OTP against pending_users. On success, creates user record in MongoDB users collection, initializes empty bot inventory, and returns a signed HS256 JWT containing user_id and jwt_version (valid for 5 days).',
        auth: 'None',
        rateLimit: '5 req/sec (IP Rate Limit)',
        parameters: [
          {
            name: 'email',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Registered email address.',
            example: 'developer@example.com'
          },
          {
            name: 'otp',
            type: 'string',
            location: 'body',
            required: true,
            description: '6-digit OTP code received from @authentcastbot.',
            example: '839201'
          }
        ],
        requestBodyExample: {
          email: 'developer@example.com',
          otp: '839201'
        },
        responses: [
          {
            status: 200,
            description: 'Account verified and session JWT created.',
            body: JSON.stringify({
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              user: {
                id: 'c7a6e13e-d9b8-4d57-891a-7b3b9b4f7e21',
                email: 'developer@example.com',
                telegram_id: '1928631932',
                plan: 'free'
              }
            }, null, 2)
          },
          {
            status: 400,
            description: 'Invalid or expired OTP.',
            body: JSON.stringify({
              error: 'Invalid OTP or registration session expired.'
            }, null, 2)
          }
        ],
        tags: ['OTP', 'JWT', 'Verification']
      },
      {
        id: 'auth-login',
        category: 'auth',
        method: 'POST',
        path: '/login',
        title: 'User Login & Security Alert Dispatch',
        summary: 'Authenticate with Email and Password; triggers Telegram 2FA security alert.',
        description: 'Verifies credentials against MongoDB users. Immediately sends an interactive Telegram security alert with "Yes, it\'s me" and "No, it\'s not me" callback action buttons. Returns JWT for authorized session.',
        auth: 'None',
        rateLimit: '5 req/sec (IP Rate Limit)',
        parameters: [
          {
            name: 'email',
            type: 'string',
            location: 'body',
            required: true,
            description: 'User email address.',
            example: 'developer@example.com'
          },
          {
            name: 'password',
            type: 'string',
            location: 'body',
            required: true,
            description: 'User password.',
            example: 'P@ssw0rdSecure!'
          }
        ],
        requestBodyExample: {
          email: 'developer@example.com',
          password: 'P@ssw0rdSecure!'
        },
        responses: [
          {
            status: 200,
            description: 'Authentication successful.',
            body: JSON.stringify({
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              user: {
                id: 'c7a6e13e-d9b8-4d57-891a-7b3b9b4f7e21',
                email: 'developer@example.com',
                telegram_id: '1928631932',
                plan: 'free',
                is_premium: false
              }
            }, null, 2)
          },
          {
            status: 401,
            description: 'Invalid credentials.',
            body: JSON.stringify({
              error: 'Invalid email or password.'
            }, null, 2)
          }
        ],
        notes: [
          'Clicking "No, it\'s not me" on the Telegram security alert immediately triggers /revoke-sessions and terminates all active tokens.'
        ],
        tags: ['Login', '2FA', 'Security Alert']
      },
      {
        id: 'auth-google-init',
        category: 'auth',
        method: 'GET',
        path: '/api/auth/google',
        title: 'Initiate Google OAuth 2.0 Redirect',
        summary: 'Redirect user to Google OAuth 2.0 authorization screen.',
        description: 'Constructs the Google OAuth 2.0 authorization URL with openid, email, profile scopes and CSRF state token. Redirects user to accounts.google.com.',
        auth: 'None',
        rateLimit: '5 req/sec',
        parameters: [
          {
            name: 'redirect_to',
            type: 'string',
            location: 'query',
            required: false,
            description: 'Optional frontend target URL to return after authentication.',
            example: 'https://botfusion.kesug.com/#/dashboard'
          }
        ],
        responses: [
          {
            status: 302,
            description: 'Redirect to Google OAuth consent screen.',
            body: 'HTTP 302 Redirect to https://accounts.google.com/o/oauth2/v2/auth?...'
          }
        ],
        tags: ['Google OAuth', 'SSO']
      },
      {
        id: 'auth-google-callback',
        category: 'auth',
        method: 'GET',
        path: '/api/auth/google/callback',
        title: 'Google OAuth Callback Exchange',
        summary: 'Server-side authorization code exchange for Google ID token and profile.',
        description: 'Exchanges authorization code for Google access token, queries user info, creates or links account in MongoDB, and redirects to frontend with JWT and complete_profile flag.',
        auth: 'None',
        rateLimit: '5 req/sec',
        parameters: [
          {
            name: 'code',
            type: 'string',
            location: 'query',
            required: true,
            description: 'Authorization code returned by Google OAuth.',
            example: '4/0AVMBsJ...'
          },
          {
            name: 'state',
            type: 'string',
            location: 'query',
            required: true,
            description: 'CSRF state token validation.',
            example: 'csrf_signed_state_...'
          }
        ],
        responses: [
          {
            status: 302,
            description: 'Redirect to frontend with token parameter.',
            body: 'HTTP 302 Redirect to https://botfusion.kesug.com/#/login-success?token=JWT&complete_profile=true'
          }
        ],
        tags: ['Google OAuth', 'Callback']
      },
      {
        id: 'auth-google-verify-token',
        category: 'auth',
        method: 'POST',
        path: '/api/auth/google/verify-token',
        title: 'Google Direct Token Verification (Popup/One-Tap)',
        summary: 'Verify Google Credential ID Token directly from frontend popup or One-Tap button.',
        description: 'Validates Google ID Token server-side using Google tokeninfo API. Links with existing account by email or creates new user, returning BotFusion JWT and profile completion status.',
        auth: 'None',
        rateLimit: '5 req/sec',
        parameters: [
          {
            name: 'id_token',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Google credential JWT token from Google Identity Services.',
            example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...'
          }
        ],
        requestBodyExample: {
          id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...'
        },
        responses: [
          {
            status: 200,
            description: 'Google token verified successfully.',
            body: JSON.stringify({
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              user: {
                id: 'c7a6e13e-d9b8-4d57-891a-7b3b9b4f7e21',
                email: 'developer@gmail.com',
                auth_providers: ['google'],
                telegram_verified: false
              },
              complete_profile: true
            }, null, 2)
          }
        ],
        tags: ['Google OAuth', 'Popup', 'One-Tap']
      },
      {
        id: 'auth-link-telegram',
        category: 'auth',
        method: 'POST',
        path: '/api/auth/link-telegram',
        title: 'Link Telegram Account (Send OTP)',
        summary: 'Send Telegram OTP verification to link Telegram ID to an existing account.',
        description: 'Used during profile completion or settings to connect Telegram ID for broadcast alerts and 2FA. Generates OTP and sends via @authentcastbot.',
        auth: 'Bearer JWT',
        rateLimit: '5 req/sec',
        parameters: [
          {
            name: 'telegram_id',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Numeric Telegram User ID to link.',
            example: '1928631932'
          }
        ],
        requestBodyExample: {
          telegram_id: '1928631932'
        },
        responses: [
          {
            status: 200,
            description: 'OTP sent to Telegram account.',
            body: JSON.stringify({
              status: 'otp_sent',
              message: 'Verification OTP sent via Telegram bot'
            }, null, 2)
          },
          {
            status: 409,
            description: 'Telegram ID already bound to another account.',
            body: JSON.stringify({
              error: 'Telegram ID already registered to another user.'
            }, null, 2)
          }
        ],
        tags: ['Account Linking', 'Telegram']
      },
      {
        id: 'auth-verify-telegram-otp',
        category: 'auth',
        method: 'POST',
        path: '/api/auth/verify-telegram-otp',
        title: 'Verify Telegram Link OTP',
        summary: 'Finalize Telegram account linking with the 6-digit OTP.',
        description: 'Validates OTP and updates user document setting telegram_id and telegram_verified: true.',
        auth: 'Bearer JWT',
        rateLimit: '5 req/sec',
        parameters: [
          {
            name: 'telegram_id',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Telegram User ID being verified.',
            example: '1928631932'
          },
          {
            name: 'otp',
            type: 'string',
            location: 'body',
            required: true,
            description: '6-digit OTP code.',
            example: '492810'
          }
        ],
        requestBodyExample: {
          telegram_id: '1928631932',
          otp: '492810'
        },
        responses: [
          {
            status: 200,
            description: 'Telegram account verified and linked.',
            body: JSON.stringify({
              status: 'verified',
              user: {
                telegram_id: '1928631932',
                telegram_verified: true
              }
            }, null, 2)
          }
        ],
        tags: ['Account Linking', 'Telegram']
      },
      {
        id: 'auth-request-password-reset',
        category: 'auth',
        method: 'POST',
        path: '/request-password-reset',
        title: 'Request 2FA Password Reset Link',
        summary: 'Initiate password reset requiring matching Email and Telegram ID.',
        description: 'Verifies that both email and telegram_id match an existing user. Generates a temporary reset token (5-minute expiry) and dispatches a secure reset link via Telegram.',
        auth: 'None',
        rateLimit: '5 req/sec',
        parameters: [
          {
            name: 'email',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Account email.',
            example: 'developer@example.com'
          },
          {
            name: 'telegram_id',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Bound Telegram User ID.',
            example: '1928631932'
          }
        ],
        requestBodyExample: {
          email: 'developer@example.com',
          telegram_id: '1928631932'
        },
        responses: [
          {
            status: 200,
            description: 'Reset link dispatched via Telegram.',
            body: JSON.stringify({
              status: 'reset_sent',
              message: 'Password reset link sent to your Telegram account. Valid for 5 minutes.'
            }, null, 2)
          }
        ],
        tags: ['Password Reset', '2FA']
      },
      {
        id: 'auth-reset-password',
        category: 'auth',
        method: 'POST',
        path: '/reset-password',
        title: 'Complete Password Reset',
        summary: 'Submit new password with verified reset token.',
        description: 'Validates reset token from password_reset_tokens. Updates user password, deletes token, and increments jwt_version (revoking all existing active sessions).',
        auth: 'None',
        rateLimit: '5 req/sec',
        parameters: [
          {
            name: 'token',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Password reset token from Telegram link.',
            example: 'rst_98fa201b4c3e...'
          },
          {
            name: 'new_password',
            type: 'string',
            location: 'body',
            required: true,
            description: 'New password (min 6 characters).',
            example: 'N3wS3cur3P@ssword'
          }
        ],
        requestBodyExample: {
          token: 'rst_98fa201b4c3e...',
          new_password: 'N3wS3cur3P@ssword'
        },
        responses: [
          {
            status: 200,
            description: 'Password reset completed.',
            body: JSON.stringify({
              status: 'success',
              message: 'Password has been updated. Please log in with your new credentials.'
            }, null, 2)
          }
        ],
        tags: ['Password Reset', 'Security']
      },
      {
        id: 'auth-revoke-sessions',
        category: 'auth',
        method: 'POST',
        path: '/revoke-sessions',
        title: 'Instant Session Invalidation',
        summary: 'Emergency session revocation endpoint triggered via Telegram security alert callback.',
        description: 'Increments user jwt_version in MongoDB. Any request carrying an old JWT version will instantly receive HTTP 401 Session Expired or Revoked.',
        auth: 'BOT_SECRET_KEY',
        rateLimit: '5 req/sec',
        parameters: [
          {
            name: 'tg_id',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Telegram ID of user to invalidate.',
            example: '1928631932'
          },
          {
            name: 'secret',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Internal bot secret key (BOT_SECRET_KEY).',
            example: 'no_bot_can_kick_me'
          }
        ],
        requestBodyExample: {
          tg_id: '1928631932',
          secret: 'no_bot_can_kick_me'
        },
        responses: [
          {
            status: 200,
            description: 'Sessions revoked.',
            body: JSON.stringify({
              status: 'revoked',
              message: 'All active sessions invalidated successfully.'
            }, null, 2)
          }
        ],
        tags: ['Security', 'Revocation']
      }
    ]
  },
  {
    id: 'integration',
    name: 'Connection Keys & API Access',
    description: 'Manage master Connection Keys (acct_*) for authorizing public AI microservice calls.',
    iconName: 'Key',
    badge: 'API Keys',
    endpoints: [
      {
        id: 'integration-generate-key',
        category: 'integration',
        method: 'POST',
        path: '/generate-connection-key',
        title: 'Generate or Rotate Connection Key',
        summary: 'Generate a new acct_ hex key for authenticating microservice API calls.',
        description: 'Generates a 16-byte hex token prefixed with acct_, deletes the old key from Redis cache, and stores the new key in the user document.',
        auth: 'Bearer JWT',
        rateLimit: '5 req/sec',
        parameters: [],
        responses: [
          {
            status: 200,
            description: 'Connection key generated.',
            body: JSON.stringify({
              status: 'success',
              connection_key: 'acct_eb3789b4a9912a8b',
              message: 'Keep this key confidential. Pass via X-CONNECTION-KEY header.'
            }, null, 2)
          }
        ],
        tags: ['Connection Key', 'API Keys']
      },
      {
        id: 'integration-info',
        category: 'integration',
        method: 'GET',
        path: '/integration-info',
        title: 'Get Integration Info & Bot Handles',
        summary: 'Fetch active connection key and registered Telegram bot handles for integration.',
        description: 'Returns active connection_key, configured bot usernames (@botname), and plan tier.',
        auth: 'Bearer JWT',
        rateLimit: '5 req/sec',
        parameters: [],
        responses: [
          {
            status: 200,
            description: 'Integration information returned.',
            body: JSON.stringify({
              connection_key: 'acct_eb3789b4a9912a8b',
              bots: ['@myawesome_bot', '@shopmanager_bot'],
              plan: 'free'
            }, null, 2)
          }
        ],
        tags: ['Integration', 'Config']
      }
    ]
  },
  {
    id: 'microservices',
    name: 'Public Microservice APIs',
    description: 'High-speed AI and automation proxy endpoints authenticated via X-CONNECTION-KEY header.',
    iconName: 'Cpu',
    badge: 'Microservices',
    endpoints: [
      {
        id: 'api-autoup',
        category: 'microservices',
        method: 'POST',
        path: '/autoup',
        title: 'Auto-Update Bot Audience Subscriber',
        summary: 'Idempotently capture Telegram user interactions into your bot broadcast audience.',
        description: 'Call this from your Telegram bot webhook / on_message handler whenever a user sends /start or interacts. Idempotently registers the user ID in your bot subscriber list in MongoDB using $addToSet.',
        auth: 'X-CONNECTION-KEY',
        rateLimit: '20 req/sec per key',
        headers: [
          {
            name: 'X-CONNECTION-KEY',
            description: 'Your BotFusion Account Connection Key (acct_...)',
            required: true,
            example: 'acct_eb3789b4a9912a8b'
          }
        ],
        parameters: [
          {
            name: 'bot_username',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Target bot username including @ symbol.',
            example: '@myawesome_bot'
          },
          {
            name: 'user_id',
            type: 'number',
            location: 'body',
            required: true,
            description: 'Numeric Telegram User ID of interacting user.',
            example: 1928631932
          }
        ],
        requestBodyExample: {
          bot_username: '@myawesome_bot',
          user_id: 1928631932
        },
        responses: [
          {
            status: 200,
            description: 'User registered in audience.',
            body: JSON.stringify({
              status: 'success',
              message: 'User added to audience list',
              bot: '@myawesome_bot',
              total_users: 1420
            }, null, 2)
          },
          {
            status: 401,
            description: 'Invalid or revoked connection key.',
            body: JSON.stringify({
              error: 'Invalid or missing X-CONNECTION-KEY'
            }, null, 2)
          }
        ],
        notes: [
          'Enforces maximum 2,000 subscribers per bot on Free plan. Upgrade to Premium for unlimited audience capacity.'
        ],
        tags: ['AutoUp', 'Audience', 'Subscribers']
      },
      {
        id: 'api-score-user',
        category: 'microservices',
        method: 'POST',
        path: '/score_user',
        title: 'AI Anomaly Detection & Fraud Risk Scoring',
        summary: 'Evaluate user behavioral chat event patterns to predict spam and botnet risk.',
        description: 'Proxies request to ML anomaly detection service (https://anomalyendpoint.onrender.com/score_user). Evaluates user activity timestamps, message entropy, and interaction frequencies to return an anomaly score (0.0 to 1.0) and risk tier.',
        auth: 'X-CONNECTION-KEY',
        rateLimit: '20 req/sec per key',
        headers: [
          {
            name: 'X-CONNECTION-KEY',
            description: 'Account Connection Key',
            required: true,
            example: 'acct_eb3789b4a9912a8b'
          }
        ],
        parameters: [
          {
            name: 'user_id',
            type: 'number',
            location: 'body',
            required: true,
            description: 'Telegram user ID to analyze.',
            example: 7365291723
          },
          {
            name: 'events',
            type: 'array',
            location: 'body',
            required: true,
            description: 'Array of recent user interaction event objects.',
            example: [
              { chat_id: 100234, timestamp: 1725000000, text: 'Hello bot', type: 'message' },
              { chat_id: 100234, timestamp: 1725000002, text: '/claim free crypto', type: 'command' }
            ]
          }
        ],
        requestBodyExample: {
          user_id: 7365291723,
          events: [
            { chat_id: 100234, timestamp: 1725000000, text: 'Hello bot', type: 'message' },
            { chat_id: 100234, timestamp: 1725000002, text: '/claim free crypto', type: 'command' }
          ]
        },
        responses: [
          {
            status: 200,
            description: 'Risk score computed.',
            body: JSON.stringify({
              user_id: 7365291723,
              anomaly_score: 0.88,
              risk_level: 'HIGH',
              flagged: true,
              signals: ['rapid_command_burst', 'suspicious_keyword_match']
            }, null, 2)
          }
        ],
        tags: ['AI Anomaly', 'Machine Learning', 'Fraud Detection']
      },
      {
        id: 'api-genqr',
        category: 'microservices',
        method: 'POST',
        path: '/genqr',
        title: 'Vector & Dynamic QR Code Generator',
        summary: 'Generate branded, styled vector QR codes with custom styling and gradients.',
        description: 'Proxies to BotFusion QR rendering microservice. Supports JSON configuration or multipart image overlays, custom dot styling, gradients, and Telegram deep-link presets. Returns binary image PNG or base64 data.',
        auth: 'X-CONNECTION-KEY',
        rateLimit: '20 req/sec per key',
        headers: [
          {
            name: 'X-CONNECTION-KEY',
            description: 'Account Connection Key',
            required: true,
            example: 'acct_eb3789b4a9912a8b'
          }
        ],
        parameters: [
          {
            name: 'data',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Payload URL or text to encode.',
            example: 'https://t.me/myawesome_bot?start=ref_123'
          },
          {
            name: 'dot_style',
            type: 'string',
            location: 'body',
            required: false,
            description: 'QR dot shape style (square, rounded, dots, classy).',
            example: 'rounded'
          },
          {
            name: 'gradient',
            type: 'boolean',
            location: 'body',
            required: false,
            description: 'Enable fire gradient on QR pattern.',
            example: true
          },
          {
            name: 'dot_color',
            type: 'string',
            location: 'body',
            required: false,
            description: 'Hex color string for foreground dots.',
            example: '#f97316'
          },
          {
            name: 'background_color',
            type: 'string',
            location: 'body',
            required: false,
            description: 'Hex color string for background.',
            example: '#09090b'
          }
        ],
        requestBodyExample: {
          data: 'https://t.me/myawesome_bot?start=ref_123',
          dot_style: 'rounded',
          gradient: true,
          dot_color: '#f97316',
          background_color: '#09090b'
        },
        responses: [
          {
            status: 200,
            description: 'PNG image stream returned.',
            body: '<Binary image/png data>'
          }
        ],
        tags: ['QR Code', 'Branding', 'Graphics']
      },
      {
        id: 'api-gen-link-create',
        category: 'microservices',
        method: 'POST',
        path: '/gen_link',
        title: 'Create Tracked Referral / Seller Link',
        summary: 'Generate unique tracked seller campaign links with conversion tracking.',
        description: 'Verifies bot ownership in user fleet, then generates a tracked campaign link proxied to Seller Link Tracker service (https://alight-koum.onrender.com/gen_link).',
        auth: 'X-CONNECTION-KEY',
        rateLimit: '20 req/sec per key',
        headers: [
          {
            name: 'X-CONNECTION-KEY',
            description: 'Account Connection Key',
            required: true,
            example: 'acct_eb3789b4a9912a8b'
          }
        ],
        parameters: [
          {
            name: 'username',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Bot handle.',
            example: '@shopmanager_bot'
          },
          {
            name: 'user_id',
            type: 'number',
            location: 'body',
            required: true,
            description: 'Affiliate or Seller Telegram User ID.',
            example: 1928631932
          },
          {
            name: 'link',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Destination target URL.',
            example: 'https://store.example.com/product/101'
          },
          {
            name: 'notify',
            type: 'boolean',
            location: 'body',
            required: false,
            description: 'Whether to alert the affiliate on click via Telegram.',
            example: true
          }
        ],
        requestBodyExample: {
          username: '@shopmanager_bot',
          user_id: 1928631932,
          link: 'https://store.example.com/product/101',
          notify: true
        },
        responses: [
          {
            status: 200,
            description: 'Tracked link created.',
            body: JSON.stringify({
              status: 'success',
              tracking_id: 'trk_98a72b1',
              short_url: 'https://bf.link/trk_98a72b1',
              target_url: 'https://store.example.com/product/101'
            }, null, 2)
          }
        ],
        tags: ['Link Tracking', 'Affiliates', 'Analytics']
      },
      {
        id: 'api-gen-link-list',
        category: 'microservices',
        method: 'GET',
        path: '/gen_link',
        title: 'List Active Tracked Links',
        summary: 'Query click-through counts and active tracked links for a bot.',
        description: 'Retrieves all tracked seller links and performance stats for the specified bot.',
        auth: 'X-CONNECTION-KEY',
        rateLimit: '20 req/sec per key',
        headers: [
          {
            name: 'X-CONNECTION-KEY',
            description: 'Account Connection Key',
            required: true,
            example: 'acct_eb3789b4a9912a8b'
          }
        ],
        parameters: [
          {
            name: 'username',
            type: 'string',
            location: 'query',
            required: true,
            description: 'Bot handle.',
            example: '@shopmanager_bot'
          }
        ],
        responses: [
          {
            status: 200,
            description: 'Link list returned.',
            body: JSON.stringify({
              bot: '@shopmanager_bot',
              total_links: 3,
              links: [
                { tracking_id: 'trk_98a72b1', user_id: 1928631932, clicks: 142, created_at: '2026-08-25T10:00:00Z' }
              ]
            }, null, 2)
          }
        ],
        tags: ['Link Tracking', 'Analytics']
      },
      {
        id: 'api-profanity-check',
        category: 'microservices',
        method: 'POST',
        path: '/profanity_check',
        title: 'AI Profanity & Toxicity Content Filter',
        summary: 'Screen chat messages for profanity, toxicity, hate speech, and spam links.',
        description: 'Proxies message analysis to AI Content Moderation service (https://profinity-sand.vercel.app/api/check-message). Returns toxic severity score and array of flagged tokens.',
        auth: 'X-CONNECTION-KEY',
        rateLimit: '20 req/sec per key',
        headers: [
          {
            name: 'X-CONNECTION-KEY',
            description: 'Account Connection Key',
            required: true,
            example: 'acct_eb3789b4a9912a8b'
          }
        ],
        parameters: [
          {
            name: 'message',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Text string to analyze.',
            example: 'Special discount offer! Visit now'
          }
        ],
        requestBodyExample: {
          message: 'Special discount offer! Visit now'
        },
        responses: [
          {
            status: 200,
            description: 'Message analysis returned.',
            body: JSON.stringify({
              is_clean: true,
              toxicity_score: 0.02,
              flagged_words: [],
              category: 'safe'
            }, null, 2)
          }
        ],
        tags: ['Profanity Filter', 'AI Moderation', 'Safety']
      }
    ]
  },
  {
    id: 'fleet',
    name: 'Bot Fleet & Broadcast Engine',
    description: 'Manage Telegram bot inventories, bulk upload audiences, and execute high-speed multi-bot broadcasts.',
    iconName: 'Bot',
    badge: 'Fleet Engine',
    endpoints: [
      {
        id: 'fleet-dashboard',
        category: 'fleet',
        method: 'GET',
        path: '/dashboard',
        title: 'Get Fleet Dashboard & Audience Metrics',
        summary: 'Fetch bot fleet inventory, subscriber counts per bot, and active broadcast tasks.',
        description: 'Returns all connected bots, user count per bot, active and completed tasks, and account subscription plan.',
        auth: 'Bearer JWT',
        rateLimit: '5 req/sec',
        parameters: [],
        responses: [
          {
            status: 200,
            description: 'Dashboard metrics returned.',
            body: JSON.stringify({
              bots: [
                { token: '8646621305:AAGkQR...', username: '@mytest_bot', total_users: 1540 }
              ],
              tasks: [
                {
                  id: 'task_98f12a3b',
                  type: 'broadcast',
                  status: 'complete',
                  progress: { total: 1540, sent: 1532, failed: 8 }
                }
              ],
              plan: 'free'
            }, null, 2)
          }
        ],
        tags: ['Dashboard', 'Fleet', 'Metrics']
      },
      {
        id: 'fleet-add-bot',
        category: 'fleet',
        method: 'POST',
        path: '/add-bot',
        title: 'Connect Bot to Fleet',
        summary: 'Register a new Telegram Bot Token into your automated fleet.',
        description: 'Queries Telegram Bot API getMe with the provided bot token. Verifies validity, checks tier limit (Free tier: max 10 bots), and saves bot token and username into user inventory.',
        auth: 'Bearer JWT',
        rateLimit: '5 req/sec',
        parameters: [
          {
            name: 'bot_token',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Telegram Bot API Token issued by @BotFather.',
            example: '8646621305:AAGkQRrz2Il8zzo-oLYmcTGrVskgAkMne10'
          }
        ],
        requestBodyExample: {
          bot_token: '8646621305:AAGkQRrz2Il8zzo-oLYmcTGrVskgAkMne10'
        },
        responses: [
          {
            status: 200,
            description: 'Bot connected successfully.',
            body: JSON.stringify({
              status: 'success',
              bot: {
                username: '@mytest_bot',
                first_name: 'My Test Bot',
                id: 8646621305
              },
              message: 'Bot connected to fleet successfully.'
            }, null, 2)
          },
          {
            status: 400,
            description: 'Invalid bot token or unauthorized by Telegram.',
            body: JSON.stringify({
              error: 'Invalid Telegram bot token.'
            }, null, 2)
          }
        ],
        tags: ['Bot Management', 'Connect']
      },
      {
        id: 'fleet-delete-bot',
        category: 'fleet',
        method: 'POST',
        path: '/delete-bot',
        title: 'Remove Bot from Fleet',
        summary: 'Disconnect a bot from your inventory.',
        description: 'Removes the bot and its audience list from MongoDB bots collection.',
        auth: 'Bearer JWT',
        rateLimit: '5 req/sec',
        parameters: [
          {
            name: 'bot_token',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Telegram Bot Token to remove.',
            example: '8646621305:AAGkQRrz2Il8zzo-oLYmcTGrVskgAkMne10'
          }
        ],
        requestBodyExample: {
          bot_token: '8646621305:AAGkQRrz2Il8zzo-oLYmcTGrVskgAkMne10'
        },
        responses: [
          {
            status: 200,
            description: 'Bot removed.',
            body: JSON.stringify({
              status: 'success',
              message: 'Bot removed from fleet.'
            }, null, 2)
          }
        ],
        tags: ['Bot Management', 'Delete']
      },
      {
        id: 'fleet-upload-users',
        category: 'fleet',
        method: 'POST',
        path: '/upload-users',
        title: 'Bulk Upload Audience Subscribers (File)',
        summary: 'Upload audience subscriber IDs from TXT, CSV, JSON, or XML files.',
        description: 'Accepts multipart/form-data upload. Spawns asynchronous worker thread to parse 9-11 digit numeric Telegram User IDs with regex, validating and deduplicating into the target bot audience.',
        auth: 'Bearer JWT',
        rateLimit: '5 req/sec',
        parameters: [
          {
            name: 'bot_token',
            type: 'string',
            location: 'formData',
            required: true,
            description: 'Target bot token to assign audience to.',
            example: '8646621305:AAGkQRrz2Il8zzo-oLYmcTGrVskgAkMne10'
          },
          {
            name: 'file',
            type: 'file',
            location: 'formData',
            required: true,
            description: 'File (.txt, .csv, .json, .xml) containing Telegram User IDs (max 15MB).',
            example: 'subscribers.txt'
          }
        ],
        responses: [
          {
            status: 200,
            description: 'Parsing task initiated.',
            body: JSON.stringify({
              status: 'processing',
              task_id: 'task_file_parse_83f9a2',
              message: 'File parsing started in background. Check task status for progress.'
            }, null, 2)
          }
        ],
        tags: ['Audience', 'File Upload', 'Bulk Import']
      },
      {
        id: 'fleet-start-broadcast',
        category: 'fleet',
        method: 'POST',
        path: '/start-broadcast',
        title: 'Execute Targeted Multi-Bot Broadcast',
        summary: 'Launch a high-speed targeted broadcast across your bot audience.',
        description: 'Supports text, image, video, dynamic inline button rows, selective bot token exclusions, and pin_message. Broadcasts are dispatched across thread pool at 15 msg/sec. 403 Forbidden (blocked) user IDs are automatically removed from audience list.',
        auth: 'Bearer JWT',
        rateLimit: 'Max 1 active broadcast at a time',
        parameters: [
          {
            name: 'message',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Broadcast message text (supports HTML/Markdown formatting).',
            example: '🚀 <b>Big Update Released!</b>\nCheck out our new features now.'
          },
          {
            name: 'content_type',
            type: 'string',
            location: 'body',
            required: false,
            description: 'Type of content: "text", "image", or "video". Default: "text".',
            example: 'text'
          },
          {
            name: 'buttons',
            type: 'array',
            location: 'body',
            required: false,
            description: 'Array of inline button rows: [[{ text: "Visit Web", url: "https://..." }]].',
            example: [[{ text: 'Visit Website', url: 'https://botfusion.kesug.com' }]]
          },
          {
            name: 'pin_message',
            type: 'boolean',
            location: 'body',
            required: false,
            description: 'Whether to automatically pin the broadcast in user private chat.',
            example: false
          },
          {
            name: 'excluded_bot_tokens',
            type: 'array',
            location: 'body',
            required: false,
            description: 'Array of bot tokens to exclude from this broadcast run.',
            example: []
          }
        ],
        requestBodyExample: {
          message: '🚀 <b>Big Update Released!</b>\nCheck out our new features now.',
          content_type: 'text',
          buttons: [[{ text: 'Visit Website', url: 'https://botfusion.kesug.com' }]],
          pin_message: false,
          excluded_bot_tokens: []
        },
        responses: [
          {
            status: 200,
            description: 'Broadcast task queued.',
            body: JSON.stringify({
              status: 'broadcast_started',
              task_id: 'task_98f12a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b',
              total_recipients: 1540,
              message: 'Broadcast started in background.'
            }, null, 2)
          },
          {
            status: 409,
            description: 'Another broadcast is already actively running.',
            body: JSON.stringify({
              error: 'A broadcast is already running. Please wait for it to complete.'
            }, null, 2)
          }
        ],
        tags: ['Broadcast', 'Telegram Messaging', 'Marketing']
      },
      {
        id: 'fleet-stop-broadcast',
        category: 'fleet',
        method: 'POST',
        path: '/stop-broadcast/{task_id}',
        title: 'Halt Active Broadcast Task',
        summary: 'Immediately abort an in-flight broadcast task.',
        description: 'Sets task status to "stopped". The background broadcast worker checks this flag between batches and halts execution gracefully.',
        auth: 'Bearer JWT',
        rateLimit: '5 req/sec',
        parameters: [
          {
            name: 'task_id',
            type: 'string',
            location: 'path',
            required: true,
            description: 'Broadcast Task ID string.',
            example: 'task_98f12a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b'
          }
        ],
        responses: [
          {
            status: 200,
            description: 'Task stopped.',
            body: JSON.stringify({
              status: 'stopped',
              task_id: 'task_98f12a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b',
              message: 'Broadcast task stopped successfully.'
            }, null, 2)
          }
        ],
        tags: ['Broadcast', 'Task Control']
      },
      {
        id: 'fleet-task-status',
        category: 'fleet',
        method: 'GET',
        path: '/task-status/{task_id}',
        title: 'Query Task Status & Progress Meter',
        summary: 'Poll delivery progress, sent/failed metrics, and completion state.',
        description: 'Queries MongoDB tasks collection to return real-time delivery count, failed count, status, and error details.',
        auth: 'Bearer JWT',
        rateLimit: '5 req/sec',
        parameters: [
          {
            name: 'task_id',
            type: 'string',
            location: 'path',
            required: true,
            description: 'Task ID to query.',
            example: 'task_98f12a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b'
          }
        ],
        responses: [
          {
            status: 200,
            description: 'Task status returned.',
            body: JSON.stringify({
              id: 'task_98f12a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b',
              type: 'broadcast',
              status: 'running',
              progress: {
                total: 1540,
                sent: 820,
                failed: 4
              },
              created_at: '2026-08-30T07:15:00+00:00'
            }, null, 2)
          }
        ],
        tags: ['Task Status', 'Polling', 'Progress']
      }
    ]
  },
  {
    id: 'crypto',
    name: 'BotFusion Pay Crypto Gateway',
    description: 'Non-custodial BEP-20 USDT merchant payment infrastructure on BNB Smart Chain.',
    iconName: 'CreditCard',
    badge: 'Crypto Merchant',
    endpoints: [
      {
        id: 'crypto-provision',
        category: 'crypto',
        method: 'POST',
        path: '/crypto/provision',
        title: 'Provision Non-Custodial Developer Store',
        summary: 'Create developer merchant account with HD index0 wallet and live API key.',
        description: 'Calls gateway developer provisioning API. Stores developerId, apiKey, seedPhrase, index0Wallet, and botToken in users.cryptoAccount.',
        auth: 'Bearer JWT',
        rateLimit: '5 req/sec',
        parameters: [
          {
            name: 'name',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Developer or merchant store name.',
            example: 'Alpha Bot Store'
          },
          {
            name: 'developerBotToken',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Telegram Bot Token for payment alert notifications.',
            example: '8646621305:AAGkQRrz2Il8zzo-oLYmcTGrVskgAkMne10'
          },
          {
            name: 'developerTelegramId',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Telegram User ID to receive invoice alerts.',
            example: '1928631932'
          }
        ],
        requestBodyExample: {
          name: 'Alpha Bot Store',
          developerBotToken: '8646621305:AAGkQRrz2Il8zzo-oLYmcTGrVskgAkMne10',
          developerTelegramId: '1928631932'
        },
        responses: [
          {
            status: 200,
            description: 'Merchant account provisioned.',
            body: JSON.stringify({
              status: 'success',
              cryptoAccount: {
                developerId: 'dev_48f93a10b',
                apiKey: 'bfpay_live_738a92b1c0e4',
                index0Wallet: '0x1234567890abcdef1234567890abcdef12345678',
                plan: 'free',
                createdAt: '2026-08-30T07:00:00Z'
              }
            }, null, 2)
          }
        ],
        tags: ['Provision', 'Crypto Merchant', 'BNB Chain']
      },
      {
        id: 'crypto-account',
        category: 'crypto',
        method: 'GET',
        path: '/crypto/account',
        title: 'Get Crypto Merchant Account & Live On-Chain Balance',
        summary: 'Query live BSC index0 wallet balance (BNB & USDT) and API usage totals.',
        description: 'Queries cryptoAccount details, counts total API calls in api_log, and queries real-time on-chain balance from {GATEWAY_BASE_URL}/api/wallets/index0.',
        auth: 'Bearer JWT',
        rateLimit: '5 req/sec',
        parameters: [],
        responses: [
          {
            status: 200,
            description: 'Account overview returned.',
            body: JSON.stringify({
              account: {
                developerId: 'dev_48f93a10b',
                apiKey: 'bfpay_live_738a92b1c0e4',
                index0Wallet: '0x1234567890abcdef1234567890abcdef12345678',
                plan: 'free',
                totalCalls: 342,
                balance: {
                  bnb: '0.045',
                  usdt: '128.50'
                }
              }
            }, null, 2)
          }
        ],
        tags: ['Crypto Balance', 'Merchant Account']
      },
      {
        id: 'crypto-invoices',
        category: 'crypto',
        method: 'GET',
        path: '/crypto/invoices',
        title: 'List Payment Invoices & Status',
        summary: 'Query customer invoice history and on-chain payment statuses.',
        description: 'Proxies invoice list from gateway for the authenticated developer account.',
        auth: 'Bearer JWT',
        rateLimit: '5 req/sec',
        parameters: [
          {
            name: 'limit',
            type: 'number',
            location: 'query',
            required: false,
            description: 'Max number of invoices to return (default 50).',
            example: 50
          }
        ],
        responses: [
          {
            status: 200,
            description: 'Invoice list returned.',
            body: JSON.stringify({
              invoices: [
                {
                  invoiceId: 'inv_938f2a1b',
                  amount: '1.00',
                  currency: 'USDT (BEP-20)',
                  tempAddress: '0x839Fa2B8...',
                  status: 'verified',
                  createdAt: '2026-08-30T07:00:00Z'
                }
              ]
            }, null, 2)
          }
        ],
        tags: ['Invoices', 'Payment Tracking']
      },
      {
        id: 'crypto-upgrade-botfusion',
        category: 'crypto',
        method: 'POST',
        path: '/crypto/upgrade/botfusion',
        title: 'Generate BotFusion Premium Invoice (USDT BEP-20)',
        summary: 'Generate an automated BSC USDT invoice to upgrade BotFusion to Premium.',
        description: 'Creates a BSC USDT payment invoice with a dedicated temporary one-time payment address. Packages: 1 Month ($1.00), 3 Months ($2.00), 1 Year ($7.00).',
        auth: 'Bearer JWT',
        rateLimit: '5 req/sec',
        parameters: [
          {
            name: 'package',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Subscription tier package: "1m", "3m", or "1y".',
            example: '1m'
          }
        ],
        requestBodyExample: {
          package: '1m'
        },
        responses: [
          {
            status: 200,
            description: 'Invoice generated with temporary deposit address.',
            body: JSON.stringify({
              invoiceId: 'inv_bf_83a91b',
              package: '1m',
              amount: '1.00',
              currency: 'USDT (BEP-20)',
              tempAddress: '0x438A2B9C81F782410a8b9C0E28B10284091A8b9C',
              network: 'BNB Smart Chain (BEP20)',
              expiresIn: 1800
            }, null, 2)
          }
        ],
        tags: ['Premium Upgrade', 'BSC USDT']
      },
      {
        id: 'crypto-bfpay-proxy',
        category: 'crypto',
        method: 'ALL',
        path: '/bfpay/{path}',
        title: 'Reverse Proxy to BotFusion Pay Engine',
        summary: 'Authenticated reverse proxy to /api/{path} on the crypto payment gateway.',
        description: 'Proxies REST calls to BSC USDT payment gateway with Redis rate limiting (Free: 1 req/s, Premium: 2 req/s) and call logging into api_log.',
        auth: 'x-api-key',
        rateLimit: '1 req/s (Free), 2 req/s (Premium)',
        headers: [
          {
            name: 'x-api-key',
            description: 'BotFusion Pay Live API Key (bfpay_live_...)',
            required: true,
            example: 'bfpay_live_738a92b1c0e4'
          }
        ],
        parameters: [
          {
            name: 'path',
            type: 'string',
            location: 'path',
            required: true,
            description: 'Gateway endpoint subpath (e.g. invoices, wallets, claims).',
            example: 'invoices'
          }
        ],
        responses: [
          {
            status: 200,
            description: 'Gateway response proxied.',
            body: JSON.stringify({
              success: true,
              data: {}
            }, null, 2)
          }
        ],
        tags: ['Gateway Proxy', 'x-api-key']
      }
    ]
  },
  {
    id: 'webhooks',
    name: 'Webhooks & System Health',
    description: 'Payment confirmation webhooks and automated health monitoring endpoints.',
    iconName: 'Activity',
    badge: 'System & Webhooks',
    endpoints: [
      {
        id: 'webhook-botfusion-upgrade',
        category: 'webhooks',
        method: 'POST',
        path: '/webhook/botfusion-upgrade',
        title: 'BotFusion Upgrade Confirmation Webhook',
        summary: 'Automated on-chain payment confirmation webhook from payment gateway.',
        description: 'Authenticated via X-Webhook-Token: MASTER_BOT_TOKEN. Marks internal invoice verified and activates/extends user premium subscription.',
        auth: 'X-Webhook-Token',
        rateLimit: '5 req/sec',
        headers: [
          {
            name: 'X-Webhook-Token',
            description: 'Master bot webhook token',
            required: true,
            example: 'MASTER_BOT_TOKEN_...'
          }
        ],
        parameters: [
          {
            name: 'invoiceId',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Invoice identifier.',
            example: 'inv_bf_83a91b'
          },
          {
            name: 'customerId',
            type: 'string',
            location: 'body',
            required: true,
            description: 'User ID to upgrade.',
            example: 'c7a6e13e-d9b8-4d57-891a-7b3b9b4f7e21'
          },
          {
            name: 'package',
            type: 'string',
            location: 'body',
            required: true,
            description: 'Package duration: 1m, 3m, 1y.',
            example: '1m'
          },
          {
            name: 'amountPaid',
            type: 'number',
            location: 'body',
            required: true,
            description: 'Amount of USDT received on chain.',
            example: 1.00
          }
        ],
        requestBodyExample: {
          invoiceId: 'inv_bf_83a91b',
          customerId: 'c7a6e13e-d9b8-4d57-891a-7b3b9b4f7e21',
          package: '1m',
          amountPaid: 1.00
        },
        responses: [
          {
            status: 200,
            description: 'Webhook processed and user upgraded.',
            body: JSON.stringify({
              status: 'upgraded',
              message: 'BotFusion premium activated for user.'
            }, null, 2)
          }
        ],
        tags: ['Webhooks', 'Payment Confirmation']
      },
      {
        id: 'system-health',
        category: 'webhooks',
        method: 'GET',
        path: '/health',
        title: 'System Health Check',
        summary: 'Public health check returning service status.',
        description: 'Public health monitoring endpoint for load balancers and uptime checkers.',
        auth: 'None',
        rateLimit: '5 req/sec',
        parameters: [],
        responses: [
          {
            status: 200,
            description: 'Service operational.',
            body: JSON.stringify({
              status: 'ok',
              service: 'BotFusion Core API',
              uptime: '99.98%'
            }, null, 2)
          }
        ],
        tags: ['Health', 'Monitoring']
      },
      {
        id: 'system-heat',
        category: 'webhooks',
        method: 'GET',
        path: '/heat',
        title: 'Lightweight Ping Check',
        summary: 'Plaintext ping response for rapid liveness checks.',
        description: 'Returns HTTP 200 with plaintext string "ok".',
        auth: 'None',
        rateLimit: '5 req/sec',
        parameters: [],
        responses: [
          {
            status: 200,
            description: 'Plaintext ping check.',
            body: 'ok'
          }
        ],
        tags: ['Ping', 'Liveness']
      }
    ]
  }
];

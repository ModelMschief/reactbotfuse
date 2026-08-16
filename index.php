<?php
$userAgent = $_SERVER['HTTP_USER_AGENT'];

if (preg_match('/facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Discordbot|Slackbot/i', $userAgent)) {
    header("Location: https://v0-preview-bot-crawl.vercel.app/api/preview?redirect=true");
    exit();
}

// Otherwise load React app
readfile("index.html");
?>
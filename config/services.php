<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google_analytics' => [
        'tracking_id' => env('GOOGLE_ANALYTICS_ID'),
    ],

    'google_tag_manager' => [
        'id' => env('GOOGLE_TAG_MANAGER'),
    ],

    'psn' => [
        'npsso_token' => env('NPSSO_TOKEN'),
        // Updated credentials from PSN Android app (as of 2025)
        'client_id' => '09515159-7237-4370-9b40-3806e67c0891',
        'client_secret' => 'ucPjka5tntB2KqsP',
        'redirect_uri' => 'com.scee.psxandroid.scecompcall://redirect',
        'scope' => 'psn:mobile.v2.core psn:clientapp',
    ],

    'gt7' => [
        'bearer_token' => env('GT7_BEARER_TOKEN'),
        'api_base_url' => env('GT7_API_BASE_URL', 'https://web-api.gt7.game.gran-turismo.com'),
    ],

];

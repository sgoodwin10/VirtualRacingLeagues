<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Site Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains site-wide configuration values that are shared
    | across all applications (public, user dashboard, admin dashboard).
    | These values are passed to Blade templates and can be accessed in
    | JavaScript via window.__SITE_CONFIG__.
    |
    */

    'name' => env('APP_NAME', 'VRL'),

    'timezone' => env('APP_TIMEZONE', 'UTC'),

    'discord' => [
        'url' => env('DISCORD_URL'),
        'invite_code' => env('DISCORD_INVITE_CODE'),
    ],

    'maintenance' => [
        'enabled' => (bool) env('APP_MAINTENANCE_MODE', false),
        'message' => env(
            'APP_MAINTENANCE_MESSAGE',
            'The site is currently undergoing maintenance. Please check back soon.'
        ),
    ],

    'registration' => [
        'enabled' => (bool) env('REGISTRATION_ENABLED', true),
    ],

    'google' => [
        'analytics_id' => env('GOOGLE_ANALYTICS_ID'),
        'tag_manager_id' => env('GOOGLE_TAG_MANAGER_ID'),
    ],

];

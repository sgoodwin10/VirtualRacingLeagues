<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Email Notifications
    |--------------------------------------------------------------------------
    |
    | Enable or disable email notifications globally.
    |
    */

    'email_enabled' => env('NOTIFICATIONS_EMAIL_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Discord Notifications
    |--------------------------------------------------------------------------
    |
    | Enable or disable Discord notifications globally.
    |
    */

    'discord_enabled' => env('NOTIFICATIONS_DISCORD_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Discord Webhook URLs
    |--------------------------------------------------------------------------
    |
    | Discord webhook URLs for different notification types.
    | These should be set in your .env file.
    |
    */

    'discord' => [
        'contacts_webhook' => env('DISCORD_WEBHOOK_CONTACTS'),
        'registrations_webhook' => env('DISCORD_WEBHOOK_REGISTRATIONS'),
        'system_webhook' => env('DISCORD_WEBHOOK_SYSTEM'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Notification Retention
    |--------------------------------------------------------------------------
    |
    | Number of days to keep notification logs in the database.
    | Older logs will be automatically deleted by the cleanup command.
    |
    */

    'retention' => [
        'days' => (int) env('NOTIFICATION_RETENTION_DAYS', 90),
    ],

    /*
    |--------------------------------------------------------------------------
    | Admin Email
    |--------------------------------------------------------------------------
    |
    | The email address where admin notifications should be sent.
    |
    */

    'admin_email' => env('ADMIN_EMAIL', 'admin@example.com'),

];

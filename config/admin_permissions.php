<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Admin Role Permissions
    |--------------------------------------------------------------------------
    |
    | This configuration defines the permissions for each admin role.
    | The permissions are used to control access to various features
    | and resources within the admin panel.
    |
    | Roles hierarchy:
    | - super_admin: Full access to everything (*)
    | - admin: Full access except super admin management
    | - moderator: Limited access to manage content
    |
    */

    'roles' => [
        'super_admin' => [
            '*', // Full access to all permissions
        ],

        'admin' => [
            // User management
            'users.view',
            'users.create',
            'users.update',
            'users.delete',

            // Admin management (limited - cannot manage super_admins)
            'admins.view',
            'admins.create',
            'admins.update',
            'admins.delete',

            // League management
            'leagues.view',
            'leagues.create',
            'leagues.update',
            'leagues.delete',

            // Race management
            'races.view',
            'races.create',
            'races.update',
            'races.delete',

            // Reports
            'reports.view',
            'reports.export',

            // Analytics
            'analytics.view',
        ],

        'moderator' => [
            // User management (view only)
            'users.view',

            // League management (limited)
            'leagues.view',
            'leagues.update',

            // Race management
            'races.view',
            'races.create',
            'races.update',

            // Reports (view only)
            'reports.view',

            // Analytics (view only)
            'analytics.view',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Permission Descriptions
    |--------------------------------------------------------------------------
    |
    | Human-readable descriptions for each permission.
    |
    */

    'permissions' => [
        // User permissions
        'users.view' => 'View users',
        'users.create' => 'Create new users',
        'users.update' => 'Update existing users',
        'users.delete' => 'Delete users',

        // Admin permissions
        'admins.view' => 'View admins',
        'admins.create' => 'Create new admins',
        'admins.update' => 'Update existing admins',
        'admins.delete' => 'Delete admins',

        // League permissions
        'leagues.view' => 'View leagues',
        'leagues.create' => 'Create new leagues',
        'leagues.update' => 'Update existing leagues',
        'leagues.delete' => 'Delete leagues',

        // Race permissions
        'races.view' => 'View races',
        'races.create' => 'Create new races',
        'races.update' => 'Update existing races',
        'races.delete' => 'Delete races',

        // Report permissions
        'reports.view' => 'View reports',
        'reports.export' => 'Export reports',

        // Analytics permissions
        'analytics.view' => 'View analytics',

        // System permissions
        'settings.view' => 'View system settings',
        'settings.update' => 'Update system settings',
    ],
];

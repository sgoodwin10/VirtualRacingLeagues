<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Feature Flags
    |--------------------------------------------------------------------------
    |
    | This file manages feature flags that control optional functionality
    | throughout the application. These can be toggled via environment
    | variables to enable or disable features without code changes.
    |
    */

    /**
     * Enable the new Spatie Media Library system for file uploads.
     * When true, files will be stored using Media Library.
     * When false, files will use the legacy Storage::disk() approach.
     *
     * During transition, the dual-write strategy is used where files
     * are written to both systems, allowing for safe migration.
     */
    'use_new_media_system' => env('FEATURE_NEW_MEDIA', true),
];

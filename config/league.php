<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Free Tier League Limit
    |--------------------------------------------------------------------------
    |
    | The maximum number of leagues a free tier user can create.
    | Users on paid plans are exempt from this limit.
    |
    */
    'free_tier_limit' => (int) env('LEAGUE_FREE_TIER_LIMIT', 1),

    /*
    |--------------------------------------------------------------------------
    | Cache Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for league-related caching, including race results,
    | standings, and other frequently accessed data.
    |
    */
    'cache' => [
        /*
        | Enable or disable caching for league data. When disabled, all data
        | will be fetched directly from the database without caching.
        |
        | Default: true
        */
        'enabled' => (bool) env('LEAGUE_CACHE_ENABLED', true),

        /*
        | The cache store to use for league data. If not specified, the
        | application's default cache store will be used.
        |
        | Supported: "redis", "memcached", "file", "database", "array"
        | Default: config('cache.default')
        */
        'store' => env('LEAGUE_CACHE_STORE', config('cache.default')),

        /*
        | Time-to-live (TTL) for cached league data in seconds.
        | After this duration, cached entries will expire and be regenerated.
        |
        | Default: 86400 (24 hours)
        */
        'ttl' => (int) env('LEAGUE_CACHE_TTL', 86400),

        /*
        | Maximum size for a single cache entry in bytes. Entries exceeding
        | this size will not be cached to prevent memory issues.
        |
        | Default: 1048576 (1MB)
        */
        'max_size' => (int) env('LEAGUE_CACHE_MAX_SIZE', 1048576),

        /*
        | Lock timeout in seconds for cache operations. This prevents race
        | conditions when multiple processes try to regenerate the same
        | cached data simultaneously.
        |
        | Default: 10 seconds
        */
        'lock_timeout' => (int) env('LEAGUE_CACHE_LOCK_TIMEOUT', 10),
    ],

    /*
    |--------------------------------------------------------------------------
    | Pagination Defaults
    |--------------------------------------------------------------------------
    |
    | Default pagination settings for league-related data listings such as
    | seasons, races, standings, and results.
    |
    */
    'pagination' => [
        /*
        | Default number of items to display per page when pagination is used.
        | This applies to all league data listings unless explicitly overridden.
        |
        | Default: 15
        */
        'per_page' => (int) env('LEAGUE_PAGINATION_PER_PAGE', 15),

        /*
        | Maximum number of items that can be requested per page. This prevents
        | users from requesting excessively large result sets that could impact
        | performance.
        |
        | Default: 100
        */
        'max_per_page' => (int) env('LEAGUE_PAGINATION_MAX_PER_PAGE', 100),
    ],

    /*
    |--------------------------------------------------------------------------
    | Validation Rules
    |--------------------------------------------------------------------------
    |
    | Validation constraints for league-related data fields. These values are
    | used across form requests and domain validation.
    |
    */
    'validation' => [
        /*
        | Maximum length for league, season, and competition slugs.
        | Slugs are used in URLs and must be URL-safe.
        |
        | Default: 255 characters
        */
        'slug_max_length' => (int) env('LEAGUE_SLUG_MAX_LENGTH', 255),

        /*
        | Maximum length for league, season, competition, and race names.
        | This ensures consistent naming constraints across all entities.
        |
        | Default: 255 characters
        */
        'name_max_length' => (int) env('LEAGUE_NAME_MAX_LENGTH', 255),
    ],
];

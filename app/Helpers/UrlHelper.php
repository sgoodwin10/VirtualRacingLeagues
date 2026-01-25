<?php

declare(strict_types=1);

namespace App\Helpers;

class UrlHelper
{
    /**
     * Build a subdomain URL from the base app URL
     * Properly handles port numbers in development environments
     *
     * @param string $subdomain The subdomain to prepend (empty string for root domain)
     * @return string The fully constructed URL
     */
    public static function buildSubdomainUrl(string $subdomain): string
    {
        $url = config('app.url');
        $parsed = parse_url($url);

        $scheme = $parsed['scheme'] ?? 'http';
        $host = $parsed['host'] ?? 'localhost';
        $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';

        // Add subdomain if not empty
        if ($subdomain !== '') {
            $host = $subdomain . '.' . $host;
        }

        return "{$scheme}://{$host}{$port}";
    }

    /**
     * Get the public site URL (no subdomain)
     *
     * @return string The public site URL
     */
    public static function publicUrl(): string
    {
        return self::buildSubdomainUrl('');
    }

    /**
     * Get the app subdomain URL
     *
     * @return string The app subdomain URL
     */
    public static function appUrl(): string
    {
        return self::buildSubdomainUrl('app');
    }

    /**
     * Get the admin subdomain URL
     *
     * @return string The admin subdomain URL
     */
    public static function adminUrl(): string
    {
        return self::buildSubdomainUrl('admin');
    }
}

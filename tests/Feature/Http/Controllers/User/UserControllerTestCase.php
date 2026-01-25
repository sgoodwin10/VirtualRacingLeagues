<?php

declare(strict_types=1);

namespace Tests\Feature\Http\Controllers\User;

use Tests\TestCase;

/**
 * Base test case for User controller tests.
 *
 * Automatically sets the app subdomain for all tests.
 */
abstract class UserControllerTestCase extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // All user controller tests should hit the app subdomain
        // Set APP_URL to the app subdomain for URL generation
        config(['app.url' => 'http://app.virtualracingleagues.localhost']);
    }

    /**
     * Override the json method to include proper subdomain support
     */
    public function json($method, $uri, array $data = [], array $headers = [], $options = 0)
    {
        // Prepend the full URL if the URI doesn't already include a domain
        if (! str_starts_with($uri, 'http')) {
            $uri = 'http://app.virtualracingleagues.localhost' . $uri;
        }

        return parent::json($method, $uri, $data, $headers, $options);
    }
}

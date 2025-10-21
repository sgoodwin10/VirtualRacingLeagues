<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Set up the test case.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Disable CSRF for easier testing
        $this->withoutMiddleware(\App\Http\Middleware\VerifyCsrfToken::class);

        // Set default HTTP_HOST for all test requests to main domain
        $_SERVER['HTTP_HOST'] = 'virtualracingleagues.localhost';
    }

    /**
     * Helper method to make requests to the app subdomain.
     */
    protected function onAppDomain(): static
    {
        $_SERVER['HTTP_HOST'] = 'app.virtualracingleagues.localhost';
        return $this;
    }

    /**
     * Helper method to make requests to the admin subdomain.
     */
    protected function onAdminDomain(): static
    {
        $_SERVER['HTTP_HOST'] = 'admin.virtualracingleagues.localhost';
        return $this;
    }

    /**
     * Reset to main domain after subdomain tests.
     */
    protected function onMainDomain(): static
    {
        $_SERVER['HTTP_HOST'] = 'virtualracingleagues.localhost';
        return $this;
    }

    /**
     * Use MariaDB testing connection for this test.
     * Useful when you need to test MariaDB-specific features in Feature tests.
     *
     * Usage:
     *   protected function setUp(): void
     *   {
     *       parent::setUp();
     *       $this->useTestDatabase();
     *   }
     */
    protected function useTestDatabase(): void
    {
        config(['database.default' => 'testing']);
    }
}

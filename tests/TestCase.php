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
    }

    /**
     * Seed the database after it has been refreshed.
     * This runs automatically when using RefreshDatabase trait.
     */
    protected function afterRefreshingDatabase()
    {
        // Seed platforms for all tests
        $this->seed(\Database\Seeders\PlatformSeeder::class);
    }

    /**
     * Helper method to make requests to the app subdomain.
     */
    protected function onAppDomain(): static
    {
        $this->withServerVariables(['HTTP_HOST' => 'app.virtualracingleagues.localhost']);

        return $this;
    }

    /**
     * Helper method to make requests to the admin subdomain.
     */
    protected function onAdminDomain(): static
    {
        $this->withServerVariables(['HTTP_HOST' => 'admin.virtualracingleagues.localhost']);

        return $this;
    }

    /**
     * Reset to main domain after subdomain tests.
     */
    protected function onMainDomain(): static
    {
        $this->withServerVariables(['HTTP_HOST' => 'virtualracingleagues.localhost']);

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

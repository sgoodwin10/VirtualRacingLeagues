<?php

declare(strict_types=1);

namespace Tests\Unit\Helpers;

use App\Helpers\UrlHelper;
use Tests\TestCase;

class UrlHelperTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_build_subdomain_url_with_no_port(): void
    {
        config(['app.url' => 'http://example.com']);

        $result = UrlHelper::buildSubdomainUrl('app');

        $this->assertEquals('http://app.example.com', $result);
    }

    public function test_build_subdomain_url_with_port(): void
    {
        config(['app.url' => 'http://example.com:8000']);

        $result = UrlHelper::buildSubdomainUrl('app');

        $this->assertEquals('http://app.example.com:8000', $result);
    }

    public function test_build_subdomain_url_with_empty_subdomain(): void
    {
        config(['app.url' => 'http://example.com:8000']);

        $result = UrlHelper::buildSubdomainUrl('');

        $this->assertEquals('http://example.com:8000', $result);
    }

    public function test_build_subdomain_url_with_https(): void
    {
        config(['app.url' => 'https://example.com']);

        $result = UrlHelper::buildSubdomainUrl('admin');

        $this->assertEquals('https://admin.example.com', $result);
    }

    public function test_public_url(): void
    {
        config(['app.url' => 'http://example.com:8000']);

        $result = UrlHelper::publicUrl();

        $this->assertEquals('http://example.com:8000', $result);
    }

    public function test_app_url(): void
    {
        config(['app.url' => 'http://example.com:8000']);

        $result = UrlHelper::appUrl();

        $this->assertEquals('http://app.example.com:8000', $result);
    }

    public function test_admin_url(): void
    {
        config(['app.url' => 'http://example.com:8000']);

        $result = UrlHelper::adminUrl();

        $this->assertEquals('http://admin.example.com:8000', $result);
    }

    public function test_build_subdomain_url_handles_complex_ports(): void
    {
        config(['app.url' => 'http://localhost:3000']);

        $result = UrlHelper::buildSubdomainUrl('api');

        $this->assertEquals('http://api.localhost:3000', $result);
    }
}

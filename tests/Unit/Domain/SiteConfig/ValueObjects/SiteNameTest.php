<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\SiteConfig\ValueObjects;

use App\Domain\SiteConfig\Exceptions\InvalidConfigurationException;
use App\Domain\SiteConfig\ValueObjects\SiteName;
use PHPUnit\Framework\TestCase;

class SiteNameTest extends TestCase
{
    public function test_can_create_valid_site_name(): void
    {
        $siteName = SiteName::from('My Application');

        $this->assertInstanceOf(SiteName::class, $siteName);
        $this->assertEquals('My Application', $siteName->value());
        $this->assertEquals('My Application', (string) $siteName);
    }

    public function test_throws_exception_for_empty_site_name(): void
    {
        $this->expectException(InvalidConfigurationException::class);
        $this->expectExceptionMessage('Site name cannot be empty');

        SiteName::from('');
    }

    public function test_throws_exception_for_whitespace_only_site_name(): void
    {
        $this->expectException(InvalidConfigurationException::class);
        $this->expectExceptionMessage('Site name cannot be empty');

        SiteName::from('   ');
    }

    public function test_throws_exception_for_site_name_exceeding_max_length(): void
    {
        $this->expectException(InvalidConfigurationException::class);
        $this->expectExceptionMessage('Site name cannot exceed 255 characters');

        SiteName::from(str_repeat('a', 256));
    }

    public function test_equals_method_works_correctly(): void
    {
        $siteName1 = SiteName::from('My App');
        $siteName2 = SiteName::from('My App');
        $siteName3 = SiteName::from('Another App');

        $this->assertTrue($siteName1->equals($siteName2));
        $this->assertFalse($siteName1->equals($siteName3));
    }
}

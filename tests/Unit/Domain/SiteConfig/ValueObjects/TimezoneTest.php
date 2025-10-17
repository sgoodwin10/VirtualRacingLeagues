<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\SiteConfig\ValueObjects;

use App\Domain\SiteConfig\Exceptions\InvalidConfigurationException;
use App\Domain\SiteConfig\ValueObjects\Timezone;
use PHPUnit\Framework\TestCase;

class TimezoneTest extends TestCase
{
    public function test_can_create_valid_timezone(): void
    {
        $timezone = Timezone::from('America/New_York');

        $this->assertInstanceOf(Timezone::class, $timezone);
        $this->assertEquals('America/New_York', $timezone->value());
    }

    public function test_accepts_utc_timezone(): void
    {
        $timezone = Timezone::from('UTC');

        $this->assertEquals('UTC', $timezone->value());
    }

    public function test_throws_exception_for_invalid_timezone(): void
    {
        $this->expectException(InvalidConfigurationException::class);
        $this->expectExceptionMessage('Invalid timezone');

        Timezone::from('Invalid/Timezone');
    }

    public function test_equals_method_works_correctly(): void
    {
        $timezone1 = Timezone::from('UTC');
        $timezone2 = Timezone::from('UTC');
        $timezone3 = Timezone::from('America/New_York');

        $this->assertTrue($timezone1->equals($timezone2));
        $this->assertFalse($timezone1->equals($timezone3));
    }
}

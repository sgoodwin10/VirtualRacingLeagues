<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\SiteConfig\ValueObjects;

use App\Domain\SiteConfig\Exceptions\InvalidConfigurationException;
use App\Domain\SiteConfig\ValueObjects\TrackingId;
use PHPUnit\Framework\TestCase;

class TrackingIdTest extends TestCase
{
    public function test_can_create_valid_google_tag_manager_id(): void
    {
        $trackingId = TrackingId::googleTagManager('GTM-ABC123');

        $this->assertInstanceOf(TrackingId::class, $trackingId);
        $this->assertEquals('GTM-ABC123', $trackingId->value());
        $this->assertFalse($trackingId->isEmpty());
    }

    public function test_can_create_valid_google_analytics_id(): void
    {
        $trackingId = TrackingId::googleAnalytics('G-ABCD1234');

        $this->assertInstanceOf(TrackingId::class, $trackingId);
        $this->assertEquals('G-ABCD1234', $trackingId->value());
    }

    public function test_accepts_null_tracking_id(): void
    {
        $trackingId = TrackingId::googleTagManager(null);

        $this->assertNull($trackingId->value());
        $this->assertTrue($trackingId->isEmpty());
    }

    public function test_throws_exception_for_invalid_gtm_format(): void
    {
        $this->expectException(InvalidConfigurationException::class);
        $this->expectExceptionMessage('Invalid Google Tag Manager tracking ID');

        TrackingId::googleTagManager('INVALID-123');
    }

    public function test_throws_exception_for_invalid_ga_format(): void
    {
        $this->expectException(InvalidConfigurationException::class);
        $this->expectExceptionMessage('Invalid Google Analytics tracking ID');

        TrackingId::googleAnalytics('INVALID-123');
    }

    public function test_throws_exception_for_tracking_id_exceeding_max_length(): void
    {
        $this->expectException(InvalidConfigurationException::class);

        TrackingId::googleTagManager('GTM-' . str_repeat('A', 50));
    }
}

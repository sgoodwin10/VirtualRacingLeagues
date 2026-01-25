<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Driver\ValueObjects;

use App\Domain\Driver\ValueObjects\PlatformIdentifiers;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class PlatformIdentifiersTest extends TestCase
{
    public function test_can_create_with_psn_id(): void
    {
        $platformIds = PlatformIdentifiers::from('JohnDoe77', null, null);

        $this->assertEquals('JohnDoe77', $platformIds->psnId());
        $this->assertNull($platformIds->iracingId());
        $this->assertEquals('PSN: JohnDoe77', $platformIds->primaryIdentifier());
    }

    public function test_can_create_with_multiple_platform_ids(): void
    {
        $platformIds = PlatformIdentifiers::from('JohnDoe77', 'iJohnDoe', 12345);

        $this->assertEquals('JohnDoe77', $platformIds->psnId());
        $this->assertEquals('iJohnDoe', $platformIds->iracingId());
        $this->assertEquals(12345, $platformIds->iracingCustomerId());
    }

    public function test_allows_all_platform_ids_to_be_null(): void
    {
        // PlatformIdentifiers now allows all IDs to be null to support drivers with only name (no platform IDs)
        $platformIds = PlatformIdentifiers::from(null, null, null);

        $this->assertNull($platformIds->psnId());
        $this->assertNull($platformIds->iracingId());
        $this->assertNull($platformIds->iracingCustomerId());
        $this->assertNull($platformIds->discordId());
        $this->assertNull($platformIds->primaryIdentifier());
    }

    public function test_allows_all_platform_ids_to_be_empty_strings(): void
    {
        // PlatformIdentifiers now allows empty strings to support drivers with only name (no platform IDs)
        $platformIds = PlatformIdentifiers::from('', '', null, '');

        $this->assertEquals('', $platformIds->psnId());
        $this->assertEquals('', $platformIds->iracingId());
        $this->assertNull($platformIds->iracingCustomerId());
        $this->assertEquals('', $platformIds->discordId());
        $this->assertNull($platformIds->primaryIdentifier());
    }

    public function test_throws_exception_if_psn_id_too_long(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('PSN ID cannot exceed 255 characters');

        PlatformIdentifiers::from(str_repeat('a', 256), null, null);
    }

    public function test_throws_exception_if_iracing_customer_id_is_negative(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('iRacing customer ID must be a positive integer');

        PlatformIdentifiers::from(null, null, -1);
    }

    public function test_primary_identifier_prioritizes_psn(): void
    {
        $platformIds = PlatformIdentifiers::from('PSN123', 'iRacing123', null);

        $this->assertEquals('PSN: PSN123', $platformIds->primaryIdentifier());
    }

    public function test_has_conflict_with_returns_true_for_matching_psn(): void
    {
        $platformIds1 = PlatformIdentifiers::from('JohnDoe77', null, null);
        $platformIds2 = PlatformIdentifiers::from('JohnDoe77', 'DifferentiRacing', null);

        $this->assertTrue($platformIds1->hasConflictWith($platformIds2));
    }

    public function test_has_conflict_with_returns_false_for_no_overlap(): void
    {
        $platformIds1 = PlatformIdentifiers::from('JohnDoe77', null, null);
        $platformIds2 = PlatformIdentifiers::from(null, 'iRacingJohn', null);

        $this->assertFalse($platformIds1->hasConflictWith($platformIds2));
    }

    public function test_equals_returns_true_for_same_values(): void
    {
        $platformIds1 = PlatformIdentifiers::from('PSN123', 'iRacing123', null);
        $platformIds2 = PlatformIdentifiers::from('PSN123', 'iRacing123', null);

        $this->assertTrue($platformIds1->equals($platformIds2));
    }

    public function test_equals_returns_false_for_different_values(): void
    {
        $platformIds1 = PlatformIdentifiers::from('PSN123', null, null);
        $platformIds2 = PlatformIdentifiers::from('PSN456', null, null);

        $this->assertFalse($platformIds1->equals($platformIds2));
    }
}

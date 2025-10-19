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
        $platformIds = PlatformIdentifiers::from('JohnDoe77', null, null, null);

        $this->assertEquals('JohnDoe77', $platformIds->psnId());
        $this->assertNull($platformIds->gt7Id());
        $this->assertNull($platformIds->iracingId());
        $this->assertEquals('PSN: JohnDoe77', $platformIds->primaryIdentifier());
    }

    public function test_can_create_with_multiple_platform_ids(): void
    {
        $platformIds = PlatformIdentifiers::from('JohnDoe77', 'GT7John', 'iJohnDoe', 12345);

        $this->assertEquals('JohnDoe77', $platformIds->psnId());
        $this->assertEquals('GT7John', $platformIds->gt7Id());
        $this->assertEquals('iJohnDoe', $platformIds->iracingId());
        $this->assertEquals(12345, $platformIds->iracingCustomerId());
    }

    public function test_throws_exception_if_all_platform_ids_are_null(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('At least one platform identifier is required');

        PlatformIdentifiers::from(null, null, null, null);
    }

    public function test_throws_exception_if_all_platform_ids_are_empty_strings(): void
    {
        $this->expectException(InvalidArgumentException::class);

        PlatformIdentifiers::from('', '', '', null);
    }

    public function test_throws_exception_if_psn_id_too_long(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('PSN ID cannot exceed 255 characters');

        PlatformIdentifiers::from(str_repeat('a', 256), null, null, null);
    }

    public function test_throws_exception_if_iracing_customer_id_is_negative(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('iRacing customer ID must be a positive integer');

        PlatformIdentifiers::from(null, null, null, -1);
    }

    public function test_primary_identifier_prioritizes_psn(): void
    {
        $platformIds = PlatformIdentifiers::from('PSN123', 'GT7_123', 'iRacing123', null);

        $this->assertEquals('PSN: PSN123', $platformIds->primaryIdentifier());
    }

    public function test_has_conflict_with_returns_true_for_matching_psn(): void
    {
        $platformIds1 = PlatformIdentifiers::from('JohnDoe77', null, null, null);
        $platformIds2 = PlatformIdentifiers::from('JohnDoe77', 'DifferentGT7', null, null);

        $this->assertTrue($platformIds1->hasConflictWith($platformIds2));
    }

    public function test_has_conflict_with_returns_false_for_no_overlap(): void
    {
        $platformIds1 = PlatformIdentifiers::from('JohnDoe77', null, null, null);
        $platformIds2 = PlatformIdentifiers::from(null, 'GT7John', null, null);

        $this->assertFalse($platformIds1->hasConflictWith($platformIds2));
    }

    public function test_equals_returns_true_for_same_values(): void
    {
        $platformIds1 = PlatformIdentifiers::from('PSN123', 'GT7_123', null, null);
        $platformIds2 = PlatformIdentifiers::from('PSN123', 'GT7_123', null, null);

        $this->assertTrue($platformIds1->equals($platformIds2));
    }

    public function test_equals_returns_false_for_different_values(): void
    {
        $platformIds1 = PlatformIdentifiers::from('PSN123', null, null, null);
        $platformIds2 = PlatformIdentifiers::from('PSN456', null, null, null);

        $this->assertFalse($platformIds1->equals($platformIds2));
    }
}

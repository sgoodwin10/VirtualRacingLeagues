<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Driver\Entities;

use App\Domain\Driver\Entities\Driver;
use App\Domain\Driver\ValueObjects\DriverName;
use App\Domain\Driver\ValueObjects\PlatformIdentifiers;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

final class DriverTest extends TestCase
{
    public function test_can_create_driver(): void
    {
        $name = DriverName::from('John', 'Doe', null);
        $platformIds = PlatformIdentifiers::from('JohnDoe77', null, null, null);

        $driver = Driver::create(
            name: $name,
            platformIds: $platformIds,
            email: 'john@example.com',
            phone: '555-1234'
        );

        $this->assertNull($driver->id());
        $this->assertEquals('John Doe', $driver->name()->displayName());
        $this->assertEquals('PSN: JohnDoe77', $driver->platformIds()->primaryIdentifier());
        $this->assertEquals('john@example.com', $driver->email());
        $this->assertEquals('555-1234', $driver->phone());
        $this->assertFalse($driver->isDeleted());
    }

    public function test_can_reconstitute_driver(): void
    {
        $name = DriverName::from('Jane', 'Smith', null);
        $platformIds = PlatformIdentifiers::from(null, 'GT7Jane', null, null);
        $createdAt = new DateTimeImmutable('2025-01-01 10:00:00');
        $updatedAt = new DateTimeImmutable('2025-01-02 15:30:00');

        $driver = Driver::reconstitute(
            id: 1,
            name: $name,
            platformIds: $platformIds,
            email: null,
            phone: null,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
            deletedAt: null
        );

        $this->assertEquals(1, $driver->id());
        $this->assertEquals('Jane Smith', $driver->name()->displayName());
        $this->assertEquals('2025-01-01 10:00:00', $driver->createdAt()?->format('Y-m-d H:i:s'));
    }

    public function test_can_update_profile(): void
    {
        $driver = Driver::create(
            name: DriverName::from('John', 'Doe', null),
            platformIds: PlatformIdentifiers::from('JohnDoe77', null, null, null)
        );

        $newName = DriverName::from('Jane', 'Doe', null);
        $newPlatformIds = PlatformIdentifiers::from('JaneDoe88', null, null, null);

        $driver->updateProfile($newName, $newPlatformIds, 'jane@example.com', '555-9999');

        $this->assertEquals('Jane Doe', $driver->name()->displayName());
        $this->assertEquals('PSN: JaneDoe88', $driver->platformIds()->primaryIdentifier());
        $this->assertEquals('jane@example.com', $driver->email());
        $this->assertEquals('555-9999', $driver->phone());
    }

    public function test_can_delete_driver(): void
    {
        $driver = Driver::create(
            name: DriverName::from('John', 'Doe', null),
            platformIds: PlatformIdentifiers::from('JohnDoe77', null, null, null)
        );

        $this->assertFalse($driver->isDeleted());

        $driver->delete();

        $this->assertTrue($driver->isDeleted());
        $this->assertNotNull($driver->deletedAt());
    }

    public function test_has_platform_conflict_with(): void
    {
        $driver1 = Driver::create(
            name: DriverName::from('John', 'Doe', null),
            platformIds: PlatformIdentifiers::from('JohnDoe77', null, null, null)
        );

        $driver2 = Driver::create(
            name: DriverName::from('Jane', 'Doe', null),
            platformIds: PlatformIdentifiers::from('JohnDoe77', 'GT7Jane', null, null)
        );

        $this->assertTrue($driver1->hasPlatformConflictWith($driver2));
    }

    public function test_can_set_id(): void
    {
        $driver = Driver::create(
            name: DriverName::from('John', 'Doe', null),
            platformIds: PlatformIdentifiers::from('JohnDoe77', null, null, null)
        );

        $this->assertNull($driver->id());

        $driver->setId(42);

        $this->assertEquals(42, $driver->id());
    }
}

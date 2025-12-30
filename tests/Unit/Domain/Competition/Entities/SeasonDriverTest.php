<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\Entities;

use App\Domain\Competition\Entities\SeasonDriver;
use App\Domain\Competition\ValueObjects\SeasonDriverStatus;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

final class SeasonDriverTest extends TestCase
{
    public function test_can_create_season_driver(): void
    {
        $seasonDriver = SeasonDriver::create(
            seasonId: 1,
            leagueDriverId: 10,
            status: SeasonDriverStatus::ACTIVE,
            notes: 'Primary driver'
        );

        $this->assertNull($seasonDriver->id());
        $this->assertEquals(1, $seasonDriver->seasonId());
        $this->assertEquals(10, $seasonDriver->leagueDriverId());
        $this->assertTrue($seasonDriver->isActive());
        $this->assertEquals('Primary driver', $seasonDriver->notes());
    }

    public function test_can_create_season_driver_with_default_status(): void
    {
        $seasonDriver = SeasonDriver::create(
            seasonId: 1,
            leagueDriverId: 10,
        );

        $this->assertTrue($seasonDriver->isActive());
        $this->assertNull($seasonDriver->notes());
    }

    public function test_can_reconstitute_season_driver(): void
    {
        $addedAt = new DateTimeImmutable('2025-01-01 10:00:00');
        $updatedAt = new DateTimeImmutable('2025-01-02 15:30:00');

        $seasonDriver = SeasonDriver::reconstitute(
            id: 1,
            seasonId: 2,
            leagueDriverId: 20,
            teamId: null,
            status: SeasonDriverStatus::RESERVE,
            notes: 'Backup driver',
            addedAt: $addedAt,
            updatedAt: $updatedAt,
        );

        $this->assertEquals(1, $seasonDriver->id());
        $this->assertEquals(2, $seasonDriver->seasonId());
        $this->assertEquals(20, $seasonDriver->leagueDriverId());
        $this->assertTrue($seasonDriver->isReserve());
        $this->assertEquals('Backup driver', $seasonDriver->notes());
        $this->assertEquals('2025-01-01 10:00:00', $seasonDriver->addedAt()->format('Y-m-d H:i:s'));
    }

    public function test_can_update_status(): void
    {
        $seasonDriver = SeasonDriver::create(
            seasonId: 1,
            leagueDriverId: 10,
        );

        $this->assertTrue($seasonDriver->isActive());

        $seasonDriver->updateStatus(SeasonDriverStatus::RESERVE);

        $this->assertTrue($seasonDriver->isReserve());
        $this->assertFalse($seasonDriver->isActive());
    }

    public function test_can_activate_driver(): void
    {
        $seasonDriver = SeasonDriver::create(
            seasonId: 1,
            leagueDriverId: 10,
            status: SeasonDriverStatus::RESERVE,
        );

        $seasonDriver->activate();

        $this->assertTrue($seasonDriver->isActive());
    }

    public function test_can_mark_as_reserve(): void
    {
        $seasonDriver = SeasonDriver::create(
            seasonId: 1,
            leagueDriverId: 10,
        );

        $seasonDriver->markAsReserve();

        $this->assertTrue($seasonDriver->isReserve());
    }

    public function test_can_mark_as_withdrawn(): void
    {
        $seasonDriver = SeasonDriver::create(
            seasonId: 1,
            leagueDriverId: 10,
        );

        $seasonDriver->markAsWithdrawn();

        $this->assertTrue($seasonDriver->isWithdrawn());
    }

    public function test_can_update_notes(): void
    {
        $seasonDriver = SeasonDriver::create(
            seasonId: 1,
            leagueDriverId: 10,
        );

        $this->assertNull($seasonDriver->notes());

        $seasonDriver->updateNotes('Updated notes');

        $this->assertEquals('Updated notes', $seasonDriver->notes());
    }

    public function test_can_release_events(): void
    {
        $seasonDriver = SeasonDriver::create(
            seasonId: 1,
            leagueDriverId: 10,
        );

        $seasonDriver->setId(1);
        $seasonDriver->updateStatus(SeasonDriverStatus::RESERVE);

        $this->assertTrue($seasonDriver->hasEvents());

        $events = $seasonDriver->releaseEvents();

        $this->assertNotEmpty($events);
        $this->assertFalse($seasonDriver->hasEvents());
    }

    public function test_status_changes_record_events(): void
    {
        $seasonDriver = SeasonDriver::create(
            seasonId: 1,
            leagueDriverId: 10,
        );

        $seasonDriver->setId(1);
        $seasonDriver->clearEvents(); // Clear creation events

        $seasonDriver->markAsReserve();

        $this->assertTrue($seasonDriver->hasEvents());
    }

    public function test_identical_status_does_not_record_event(): void
    {
        $seasonDriver = SeasonDriver::create(
            seasonId: 1,
            leagueDriverId: 10,
            status: SeasonDriverStatus::ACTIVE,
        );

        $seasonDriver->setId(1);
        $seasonDriver->clearEvents();

        $seasonDriver->updateStatus(SeasonDriverStatus::ACTIVE);

        $this->assertFalse($seasonDriver->hasEvents());
    }
}

<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\Entities;

use App\Domain\Competition\Entities\RaceResult;
use App\Domain\Competition\ValueObjects\RaceResultStatus;
use App\Domain\Competition\ValueObjects\RaceTime;
use PHPUnit\Framework\TestCase;

final class RaceResultTest extends TestCase
{
    public function test_creates_race_result_with_valid_data(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            divisionId: 5,
            position: 1,
            originalRaceTime: '01:23:45.678',
            originalRaceTimeDifference: '00:00:00.000',
            fastestLap: '01:20:30.123',
            penalties: '00:00:05.000',
            hasFastestLap: true,
            hasPole: false,
            dnf: false,
        );

        $this->assertNull($result->id());
        $this->assertSame(1, $result->raceId());
        $this->assertSame(10, $result->driverId());
        $this->assertSame(5, $result->divisionId());
        $this->assertSame(1, $result->position());
        $this->assertSame('01:23:45.678', $result->originalRaceTime()->value());
        $this->assertSame('00:00:00.000', $result->originalRaceTimeDifference()->value());
        $this->assertSame('01:20:30.123', $result->fastestLap()->value());
        $this->assertSame('00:00:05.000', $result->penalties()->value());
        $this->assertTrue($result->hasFastestLap());
        $this->assertFalse($result->hasPole());
        $this->assertFalse($result->dnf());
        $this->assertSame(RaceResultStatus::PENDING, $result->status());
        $this->assertSame(0, $result->racePoints());
    }

    public function test_creates_race_result_with_null_times(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            divisionId: 5,
            position: null,
            originalRaceTime: null,
            originalRaceTimeDifference: null,
            fastestLap: null,
            penalties: null,
            hasFastestLap: false,
            hasPole: false,
            dnf: true,
        );

        $this->assertTrue($result->originalRaceTime()->isNull());
        $this->assertTrue($result->originalRaceTimeDifference()->isNull());
        $this->assertTrue($result->fastestLap()->isNull());
        $this->assertTrue($result->penalties()->isNull());
        $this->assertTrue($result->dnf());
    }

    public function test_calculates_final_race_time_without_penalties(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            divisionId: 5,
            position: 1,
            originalRaceTime: '01:23:45.678',
            penalties: null,
        );

        $finalTime = $result->finalRaceTime();

        $this->assertSame('01:23:45.678', $finalTime->value());
        $this->assertEquals($result->originalRaceTime(), $finalTime);
    }

    public function test_calculates_final_race_time_with_penalties(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            divisionId: 5,
            position: 1,
            originalRaceTime: '01:23:45.678',
            penalties: '00:00:05.000',
        );

        $finalTime = $result->finalRaceTime();

        // 01:23:45.678 + 00:00:05.000 = 01:23:50.678
        $this->assertSame('01:23:50.678', $finalTime->value());
    }

    public function test_final_race_time_is_null_when_original_is_null(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            divisionId: 5,
            position: null,
            originalRaceTime: null,
            penalties: '00:00:05.000',
        );

        $finalTime = $result->finalRaceTime();

        $this->assertTrue($finalTime->isNull());
    }

    public function test_final_race_time_equals_original_when_penalties_are_null(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            divisionId: 5,
            position: 1,
            originalRaceTime: '01:23:45.678',
            penalties: null,
        );

        $finalTime = $result->finalRaceTime();

        $this->assertSame('01:23:45.678', $finalTime->value());
        $this->assertEquals($result->originalRaceTime(), $finalTime);
    }

    public function test_updates_race_result(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            divisionId: 5,
            position: 2,
            originalRaceTime: '01:23:45.678',
            penalties: null,
        );
        $result->setId(1); // Set ID before updating

        $result->update(
            position: 1,
            originalRaceTime: '01:20:30.123',
            originalRaceTimeDifference: '00:00:00.000',
            fastestLap: '01:20:30.123',
            penalties: '00:00:03.000',
            hasFastestLap: true,
            hasPole: false,
            dnf: false,
        );

        $this->assertSame(1, $result->position());
        $this->assertSame('01:20:30.123', $result->originalRaceTime()->value());
        $this->assertSame('00:00:03.000', $result->penalties()->value());
        $this->assertTrue($result->hasFastestLap());
        $this->assertSame('01:20:33.123', $result->finalRaceTime()->value());
    }

    public function test_marks_as_fastest_lap(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            hasFastestLap: false,
        );

        $result->markAsFastestLap();

        $this->assertTrue($result->hasFastestLap());
    }

    public function test_clears_fastest_lap(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            hasFastestLap: true,
        );

        $result->clearFastestLap();

        $this->assertFalse($result->hasFastestLap());
    }

    public function test_sets_race_points(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
        );

        $result->setRacePoints(25);

        $this->assertSame(25, $result->racePoints());
    }

    public function test_confirms_result(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
        );

        $this->assertSame(RaceResultStatus::PENDING, $result->status());

        $result->confirm();

        $this->assertSame(RaceResultStatus::CONFIRMED, $result->status());
    }

    public function test_stores_final_race_time_difference(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            divisionId: 5,
            position: 2,
            originalRaceTimeDifference: '00:00:15.250',
            finalRaceTimeDifference: '00:00:15.250',
            penalties: null,
        );

        $finalTimeDiff = $result->finalRaceTimeDifference();

        // Final time difference is stored as-is, not calculated
        $this->assertSame('00:00:15.250', $finalTimeDiff->value());
    }

    public function test_stores_final_race_time_difference_with_penalties(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            divisionId: 5,
            position: 2,
            originalRaceTimeDifference: '00:00:15.250',
            finalRaceTimeDifference: '00:00:20.250', // Frontend calculates: 00:00:15.250 + 00:00:05.000
            penalties: '00:00:05.000',
        );

        $finalTimeDiff = $result->finalRaceTimeDifference();

        // Backend stores the value as-is, does not calculate
        $this->assertSame('00:00:20.250', $finalTimeDiff->value());
    }

    public function test_final_race_time_difference_is_null_when_not_provided(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            divisionId: 5,
            position: null,
            originalRaceTimeDifference: null,
            finalRaceTimeDifference: null,
            penalties: '00:00:05.000',
        );

        $finalTimeDiff = $result->finalRaceTimeDifference();

        $this->assertTrue($finalTimeDiff->isNull());
    }

    public function test_stores_final_race_time_difference_matching_original_when_no_penalties(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            divisionId: 5,
            position: 2,
            originalRaceTimeDifference: '00:00:15.250',
            finalRaceTimeDifference: '00:00:15.250', // Frontend sends same as original when no penalties
            penalties: null,
        );

        $finalTimeDiff = $result->finalRaceTimeDifference();

        // Backend returns stored value
        $this->assertSame('00:00:15.250', $finalTimeDiff->value());
    }

    // Validation Tests

    public function test_throws_exception_when_race_id_is_zero(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Race ID must be greater than 0');

        RaceResult::create(
            raceId: 0,
            driverId: 10,
        );
    }

    public function test_throws_exception_when_race_id_is_negative(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Race ID must be greater than 0');

        RaceResult::create(
            raceId: -1,
            driverId: 10,
        );
    }

    public function test_throws_exception_when_driver_id_is_zero(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Driver ID must be greater than 0');

        RaceResult::create(
            raceId: 1,
            driverId: 0,
        );
    }

    public function test_throws_exception_when_driver_id_is_negative(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Driver ID must be greater than 0');

        RaceResult::create(
            raceId: 1,
            driverId: -1,
        );
    }

    public function test_throws_exception_when_position_is_zero(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Position must be greater than 0 when provided');

        RaceResult::create(
            raceId: 1,
            driverId: 10,
            position: 0,
        );
    }

    public function test_throws_exception_when_position_is_negative(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Position must be greater than 0 when provided');

        RaceResult::create(
            raceId: 1,
            driverId: 10,
            position: -1,
        );
    }

    public function test_throws_exception_when_updating_before_id_is_set(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
        );

        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('Cannot update race result before it has been persisted');

        $result->update(
            position: 1,
            originalRaceTime: '01:23:45.678',
            originalRaceTimeDifference: null,
            fastestLap: null,
            penalties: null,
            hasFastestLap: false,
            hasPole: false,
            dnf: false,
        );
    }

    public function test_throws_exception_when_updating_position_to_zero(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
        );
        $result->setId(1);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Position must be greater than 0 when provided');

        $result->update(
            position: 0,
            originalRaceTime: null,
            originalRaceTimeDifference: null,
            fastestLap: null,
            penalties: null,
            hasFastestLap: false,
            hasPole: false,
            dnf: false,
        );
    }

    public function test_clears_fastest_lap_when_marking_as_dnf(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            position: 5,
            hasFastestLap: true,
        );
        $result->setId(1);

        $result->update(
            position: 5,
            originalRaceTime: null,
            originalRaceTimeDifference: null,
            fastestLap: null,
            penalties: null,
            hasFastestLap: false,
            hasPole: false,
            dnf: true,
        );

        // Position is kept (DNF drivers can have positions in racing)
        $this->assertSame(5, $result->position());
        // But fastest lap is cleared (DNF drivers don't get fastest lap bonuses)
        $this->assertFalse($result->hasFastestLap());
        $this->assertTrue($result->dnf());
    }

    public function test_recalculates_final_race_time_difference_when_penalties_change(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            originalRaceTimeDifference: '00:00:10.000',
            finalRaceTimeDifference: '00:00:10.000',
            penalties: null,
        );
        $result->setId(1);

        $result->update(
            position: null,
            originalRaceTime: null,
            originalRaceTimeDifference: '00:00:10.000',
            fastestLap: null,
            penalties: '00:00:05.000',
            hasFastestLap: false,
            hasPole: false,
            dnf: false,
        );

        // Should recalculate: 00:00:10.000 + 00:00:05.000 = 00:00:15.000
        $this->assertSame('00:00:15.000', $result->finalRaceTimeDifference()->value());
    }

    public function test_recalculates_final_race_time_difference_when_original_time_difference_changes(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            originalRaceTimeDifference: '00:00:10.000',
            finalRaceTimeDifference: '00:00:15.000',
            penalties: '00:00:05.000',
        );
        $result->setId(1);

        $result->update(
            position: null,
            originalRaceTime: null,
            originalRaceTimeDifference: '00:00:20.000',
            fastestLap: null,
            penalties: '00:00:05.000',
            hasFastestLap: false,
            hasPole: false,
            dnf: false,
        );

        // Should recalculate: 00:00:20.000 + 00:00:05.000 = 00:00:25.000
        $this->assertSame('00:00:25.000', $result->finalRaceTimeDifference()->value());
    }

    public function test_final_race_time_difference_equals_original_when_penalties_removed(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
            originalRaceTimeDifference: '00:00:10.000',
            finalRaceTimeDifference: '00:00:15.000',
            penalties: '00:00:05.000',
        );
        $result->setId(1);

        $result->update(
            position: null,
            originalRaceTime: null,
            originalRaceTimeDifference: '00:00:10.000',
            fastestLap: null,
            penalties: null,
            hasFastestLap: false,
            hasPole: false,
            dnf: false,
        );

        // Should recalculate: when penalties are null, final equals original
        $this->assertSame('00:00:10.000', $result->finalRaceTimeDifference()->value());
    }

    public function test_throws_exception_when_race_points_are_negative(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
        );

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Race points cannot be negative');

        $result->setRacePoints(-5);
    }

    public function test_allows_zero_race_points(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
        );

        $result->setRacePoints(0);

        $this->assertSame(0, $result->racePoints());
    }

    public function test_throws_exception_when_positions_gained_exceeds_maximum(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
        );

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Positions gained must be between -99 and 99');

        $result->setPositionsGained(100);
    }

    public function test_throws_exception_when_positions_gained_exceeds_minimum(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
        );

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Positions gained must be between -99 and 99');

        $result->setPositionsGained(-100);
    }

    public function test_allows_positions_gained_at_maximum_boundary(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
        );

        $result->setPositionsGained(99);

        $this->assertSame(99, $result->positionsGained());
    }

    public function test_allows_positions_gained_at_minimum_boundary(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
        );

        $result->setPositionsGained(-99);

        $this->assertSame(-99, $result->positionsGained());
    }

    public function test_allows_null_positions_gained(): void
    {
        $result = RaceResult::create(
            raceId: 1,
            driverId: 10,
        );

        $result->setPositionsGained(null);

        $this->assertNull($result->positionsGained());
    }
}

<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\Entities;

use App\Domain\Competition\Entities\Race;
use App\Domain\Competition\Events\RaceCreated;
use App\Domain\Competition\Events\RaceUpdated;
use App\Domain\Competition\ValueObjects\GridSource;
use App\Domain\Competition\ValueObjects\PointsSystem;
use App\Domain\Competition\ValueObjects\QualifyingFormat;
use App\Domain\Competition\ValueObjects\RaceLengthType;
use App\Domain\Competition\ValueObjects\RaceName;
use App\Domain\Competition\ValueObjects\RaceType;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

final class RaceTest extends TestCase
{
    public function test_creates_new_race(): void
    {
        $race = Race::create(
            roundId: 1,
            raceNumber: 1,
            name: RaceName::from('Sprint Race'),
            type: RaceType::SPRINT,
            qualifyingFormat: QualifyingFormat::STANDARD,
            qualifyingLength: 15,
            qualifyingTire: 'soft',
            gridSource: GridSource::QUALIFYING,
            gridSourceRaceId: null,
            lengthType: RaceLengthType::LAPS,
            lengthValue: 20,
            extraLapAfterTime: false,
            weather: 'clear',
            tireRestrictions: 'any',
            fuelUsage: 'standard',
            damageModel: 'full',
            trackLimitsEnforced: true,
            falseStartDetection: true,
            collisionPenalties: true,
            mandatoryPitStop: false,
            minimumPitTime: null,
            assistsRestrictions: 'limited',
            raceDivisions: false,
            pointsSystem: PointsSystem::f1Standard(),
            bonusPoints: ['fastest_lap' => 1],
            dnfPoints: 0,
            dnsPoints: 0,
            raceNotes: 'Test race',
        );

        $this->assertNull($race->id());
        $this->assertSame(1, $race->roundId());
        $this->assertSame(1, $race->raceNumber());
        $this->assertSame('Sprint Race', $race->name()?->value());
        $this->assertSame(RaceType::SPRINT, $race->type());
        $this->assertSame(QualifyingFormat::STANDARD, $race->qualifyingFormat());
        $this->assertSame(15, $race->qualifyingLength());
        $this->assertSame('soft', $race->qualifyingTire());
        $this->assertSame(GridSource::QUALIFYING, $race->gridSource());
        $this->assertNull($race->gridSourceRaceId());
        $this->assertSame(RaceLengthType::LAPS, $race->lengthType());
        $this->assertSame(20, $race->lengthValue());
        $this->assertFalse($race->extraLapAfterTime());
        $this->assertTrue($race->trackLimitsEnforced());
        $this->assertFalse($race->raceDivisions());
        $this->assertSame(['fastest_lap' => 1], $race->bonusPoints());
        $this->assertSame(0, $race->dnfPoints());
        $this->assertSame(0, $race->dnsPoints());
        $this->assertSame('Test race', $race->raceNotes());
    }

    public function test_creates_race_created_event(): void
    {
        $race = Race::create(
            roundId: 1,
            raceNumber: 1,
            name: RaceName::from('Test Race'),
            type: RaceType::FEATURE,
            qualifyingFormat: QualifyingFormat::STANDARD,
            qualifyingLength: 15,
            qualifyingTire: null,
            gridSource: GridSource::QUALIFYING,
            gridSourceRaceId: null,
            lengthType: RaceLengthType::LAPS,
            lengthValue: 30,
            extraLapAfterTime: false,
            weather: null,
            tireRestrictions: null,
            fuelUsage: null,
            damageModel: null,
            trackLimitsEnforced: true,
            falseStartDetection: true,
            collisionPenalties: true,
            mandatoryPitStop: false,
            minimumPitTime: null,
            assistsRestrictions: null,
            raceDivisions: false,
            pointsSystem: PointsSystem::f1Standard(),
            bonusPoints: null,
            dnfPoints: 0,
            dnsPoints: 0,
            raceNotes: null,
        );

        $events = $race->events();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(RaceCreated::class, $events[0]);

        /** @var RaceCreated $event */
        $event = $events[0];
        $this->assertSame(1, $event->roundId);
        $this->assertSame(1, $event->raceNumber);
        $this->assertSame('Test Race', $event->name);
        $this->assertSame('feature', $event->type);
    }

    public function test_reconstitutes_race_from_persistence(): void
    {
        $createdAt = new DateTimeImmutable('2024-01-01 10:00:00');
        $updatedAt = new DateTimeImmutable('2024-01-02 15:00:00');

        $race = Race::reconstitute(
            id: 123,
            roundId: 1,
            isQualifier: false,
            raceNumber: 2,
            name: RaceName::from('Feature Race'),
            type: RaceType::FEATURE,
            qualifyingFormat: QualifyingFormat::TIME_TRIAL,
            qualifyingLength: 20,
            qualifyingTire: 'medium',
            gridSource: GridSource::PREVIOUS_RACE,
            gridSourceRaceId: 122,
            lengthType: RaceLengthType::TIME,
            lengthValue: 60,
            extraLapAfterTime: true,
            weather: 'dynamic',
            tireRestrictions: 'multiple_required',
            fuelUsage: 'limited',
            damageModel: 'simulation',
            trackLimitsEnforced: false,
            falseStartDetection: true,
            collisionPenalties: false,
            mandatoryPitStop: true,
            minimumPitTime: 90,
            assistsRestrictions: 'none',
            raceDivisions: true,
            pointsSystem: PointsSystem::f1Standard(),
            bonusPoints: ['pole' => 1, 'fastest_lap' => 1],
            dnfPoints: 0,
            dnsPoints: 0,
            raceNotes: 'Championship finale',
            createdAt: $createdAt,
            updatedAt: $updatedAt,
        );

        $this->assertSame(123, $race->id());
        $this->assertSame(1, $race->roundId());
        $this->assertSame(2, $race->raceNumber());
        $this->assertSame('Feature Race', $race->name()?->value());
        $this->assertSame(RaceType::FEATURE, $race->type());
        $this->assertSame(122, $race->gridSourceRaceId());
        $this->assertTrue($race->mandatoryPitStop());
        $this->assertSame(90, $race->minimumPitTime());
        $this->assertTrue($race->raceDivisions());
        $this->assertSame($createdAt, $race->createdAt());
        $this->assertSame($updatedAt, $race->updatedAt());
        $this->assertEmpty($race->events());
    }

    public function test_updates_race_configuration(): void
    {
        $race = Race::create(
            roundId: 1,
            raceNumber: 1,
            name: RaceName::from('Original Name'),
            type: RaceType::SPRINT,
            qualifyingFormat: QualifyingFormat::STANDARD,
            qualifyingLength: 15,
            qualifyingTire: 'soft',
            gridSource: GridSource::QUALIFYING,
            gridSourceRaceId: null,
            lengthType: RaceLengthType::LAPS,
            lengthValue: 20,
            extraLapAfterTime: false,
            weather: 'clear',
            tireRestrictions: 'any',
            fuelUsage: 'standard',
            damageModel: 'full',
            trackLimitsEnforced: true,
            falseStartDetection: true,
            collisionPenalties: true,
            mandatoryPitStop: false,
            minimumPitTime: null,
            assistsRestrictions: 'limited',
            raceDivisions: false,
            pointsSystem: PointsSystem::f1Standard(),
            bonusPoints: null,
            dnfPoints: 0,
            dnsPoints: 0,
            raceNotes: null,
        );

        $race->setId(1);
        $originalUpdatedAt = $race->updatedAt();

        // Small delay to ensure timestamp changes
        sleep(1);

        $race->updateConfiguration(
            name: RaceName::from('Updated Name'),
            type: RaceType::FEATURE,
            qualifyingFormat: QualifyingFormat::TIME_TRIAL,
            qualifyingLength: 30,
            qualifyingTire: 'medium',
            gridSource: GridSource::CHAMPIONSHIP,
            gridSourceRaceId: null,
            lengthType: RaceLengthType::TIME,
            lengthValue: 60,
            extraLapAfterTime: true,
            weather: 'dynamic',
            tireRestrictions: 'multiple_required',
            fuelUsage: 'limited',
            damageModel: 'simulation',
            trackLimitsEnforced: false,
            falseStartDetection: false,
            collisionPenalties: false,
            mandatoryPitStop: true,
            minimumPitTime: 120,
            assistsRestrictions: 'none',
            raceDivisions: true,
            pointsSystem: PointsSystem::from([1 => 10, 2 => 8, 3 => 6]),
            bonusPoints: ['fastest_lap' => 2],
            dnfPoints: 0,
            dnsPoints: 0,
            raceNotes: 'Updated notes',
        );

        $this->assertSame('Updated Name', $race->name()?->value());
        $this->assertSame(RaceType::FEATURE, $race->type());
        $this->assertSame(QualifyingFormat::TIME_TRIAL, $race->qualifyingFormat());
        $this->assertSame(30, $race->qualifyingLength());
        $this->assertSame(GridSource::CHAMPIONSHIP, $race->gridSource());
        $this->assertSame(RaceLengthType::TIME, $race->lengthType());
        $this->assertSame(60, $race->lengthValue());
        $this->assertTrue($race->extraLapAfterTime());
        $this->assertFalse($race->trackLimitsEnforced());
        $this->assertTrue($race->mandatoryPitStop());
        $this->assertSame(120, $race->minimumPitTime());
        $this->assertTrue($race->raceDivisions());
        $this->assertSame([1 => 10, 2 => 8, 3 => 6], $race->pointsSystem()->toArray());
        $this->assertSame(['fastest_lap' => 2], $race->bonusPoints());
        $this->assertGreaterThan($originalUpdatedAt, $race->updatedAt());

        $events = $race->events();
        $this->assertCount(2, $events); // RaceCreated + RaceUpdated
        $this->assertInstanceOf(RaceUpdated::class, $events[1]);
    }

    public function test_no_update_event_when_no_changes(): void
    {
        $race = Race::create(
            roundId: 1,
            raceNumber: 1,
            name: RaceName::from('Test Race'),
            type: RaceType::SPRINT,
            qualifyingFormat: QualifyingFormat::STANDARD,
            qualifyingLength: 15,
            qualifyingTire: 'soft',
            gridSource: GridSource::QUALIFYING,
            gridSourceRaceId: null,
            lengthType: RaceLengthType::LAPS,
            lengthValue: 20,
            extraLapAfterTime: false,
            weather: 'clear',
            tireRestrictions: 'any',
            fuelUsage: 'standard',
            damageModel: 'full',
            trackLimitsEnforced: true,
            falseStartDetection: true,
            collisionPenalties: true,
            mandatoryPitStop: false,
            minimumPitTime: null,
            assistsRestrictions: 'limited',
            raceDivisions: false,
            pointsSystem: PointsSystem::f1Standard(),
            bonusPoints: null,
            dnfPoints: 0,
            dnsPoints: 0,
            raceNotes: null,
        );

        // Update with same values
        $race->updateConfiguration(
            name: RaceName::from('Test Race'),
            type: RaceType::SPRINT,
            qualifyingFormat: QualifyingFormat::STANDARD,
            qualifyingLength: 15,
            qualifyingTire: 'soft',
            gridSource: GridSource::QUALIFYING,
            gridSourceRaceId: null,
            lengthType: RaceLengthType::LAPS,
            lengthValue: 20,
            extraLapAfterTime: false,
            weather: 'clear',
            tireRestrictions: 'any',
            fuelUsage: 'standard',
            damageModel: 'full',
            trackLimitsEnforced: true,
            falseStartDetection: true,
            collisionPenalties: true,
            mandatoryPitStop: false,
            minimumPitTime: null,
            assistsRestrictions: 'limited',
            raceDivisions: false,
            pointsSystem: PointsSystem::f1Standard(),
            bonusPoints: null,
            dnfPoints: 0,
            dnsPoints: 0,
            raceNotes: null,
        );

        $events = $race->events();
        $this->assertCount(1, $events); // Only RaceCreated, no RaceUpdated
    }

    public function test_release_events_clears_events_array(): void
    {
        $race = Race::create(
            roundId: 1,
            raceNumber: 1,
            name: RaceName::from('Test Race'),
            type: RaceType::SPRINT,
            qualifyingFormat: QualifyingFormat::STANDARD,
            qualifyingLength: 15,
            qualifyingTire: null,
            gridSource: GridSource::QUALIFYING,
            gridSourceRaceId: null,
            lengthType: RaceLengthType::LAPS,
            lengthValue: 20,
            extraLapAfterTime: false,
            weather: null,
            tireRestrictions: null,
            fuelUsage: null,
            damageModel: null,
            trackLimitsEnforced: true,
            falseStartDetection: true,
            collisionPenalties: true,
            mandatoryPitStop: false,
            minimumPitTime: null,
            assistsRestrictions: null,
            raceDivisions: false,
            pointsSystem: PointsSystem::f1Standard(),
            bonusPoints: null,
            dnfPoints: 0,
            dnsPoints: 0,
            raceNotes: null,
        );

        $this->assertCount(1, $race->events());

        $releasedEvents = $race->releaseEvents();
        $this->assertCount(1, $releasedEvents);
        $this->assertEmpty($race->events());
    }
}

<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\Entities;

use App\Domain\Competition\Entities\Race;
use App\Domain\Competition\Events\QualifierCreated;
use App\Domain\Competition\Events\QualifierUpdated;
use App\Domain\Competition\Exceptions\InvalidQualifierConfigurationException;
use App\Domain\Competition\ValueObjects\QualifyingFormat;
use App\Domain\Competition\ValueObjects\RaceName;
use PHPUnit\Framework\TestCase;

final class QualifierTest extends TestCase
{
    public function test_creates_new_qualifier(): void
    {
        $qualifier = Race::createQualifier(
            roundId: 1,
            name: RaceName::from('Qualifying Session'),
            qualifyingFormat: QualifyingFormat::STANDARD,
            qualifyingLength: 20,
            qualifyingTire: 'soft',
            weather: 'clear',
            tireRestrictions: null,
            fuelUsage: null,
            damageModel: null,
            assistsRestrictions: null,
            qualifyingPole: 1,
            qualifyingPoleTop10: false,
            raceNotes: null,
        );

        $this->assertTrue($qualifier->isQualifier());
        $this->assertNull($qualifier->id());
        $this->assertSame(1, $qualifier->roundId());
        $this->assertNull($qualifier->raceNumber());
        $this->assertSame('Qualifying Session', $qualifier->name()?->value());
        $this->assertNull($qualifier->type());
        $this->assertSame(QualifyingFormat::STANDARD, $qualifier->qualifyingFormat());
        $this->assertSame(20, $qualifier->qualifyingLength());
        $this->assertSame(1, $qualifier->qualifyingPole());
        $this->assertFalse($qualifier->qualifyingPoleTop10());
        $this->assertFalse($qualifier->mandatoryPitStop());
        $this->assertNull($qualifier->minimumPitTime());
        // Verify penalty fields are disabled by default for qualifiers
        $this->assertFalse($qualifier->trackLimitsEnforced());
        $this->assertFalse($qualifier->falseStartDetection());
        $this->assertFalse($qualifier->collisionPenalties());
    }

    public function test_creates_qualifier_created_event(): void
    {
        $qualifier = Race::createQualifier(
            roundId: 1,
            name: RaceName::from('Test Qualifying'),
            qualifyingFormat: QualifyingFormat::TIME_TRIAL,
            qualifyingLength: 15,
            qualifyingTire: null,
            weather: null,
            tireRestrictions: null,
            fuelUsage: null,
            damageModel: null,
            assistsRestrictions: null,
            qualifyingPole: null,
            qualifyingPoleTop10: false,
            raceNotes: null,
        );

        $events = $qualifier->events();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(QualifierCreated::class, $events[0]);
    }

    public function test_throws_exception_for_none_qualifying_format(): void
    {
        $this->expectException(InvalidQualifierConfigurationException::class);
        $this->expectExceptionMessage('Qualifier must have a qualifying format');

        Race::createQualifier(
            roundId: 1,
            name: null,
            qualifyingFormat: QualifyingFormat::NONE,
            qualifyingLength: 15,
            qualifyingTire: null,
            weather: null,
            tireRestrictions: null,
            fuelUsage: null,
            damageModel: null,
            assistsRestrictions: null,
            qualifyingPole: null,
            qualifyingPoleTop10: false,
            raceNotes: null,
        );
    }


    public function test_throws_exception_for_invalid_length(): void
    {
        $this->expectException(InvalidQualifierConfigurationException::class);
        $this->expectExceptionMessage('Qualifier length must be at least 1 minute');

        Race::createQualifier(
            roundId: 1,
            name: null,
            qualifyingFormat: QualifyingFormat::STANDARD,
            qualifyingLength: 0,
            qualifyingTire: null,
            weather: null,
            tireRestrictions: null,
            fuelUsage: null,
            damageModel: null,
            assistsRestrictions: null,
            qualifyingPole: null,
            qualifyingPoleTop10: false,
            raceNotes: null,
        );
    }

    public function test_updates_qualifier_configuration(): void
    {
        $qualifier = Race::createQualifier(
            roundId: 1,
            name: RaceName::from('Original Qualifying'),
            qualifyingFormat: QualifyingFormat::STANDARD,
            qualifyingLength: 15,
            qualifyingTire: 'soft',
            weather: 'clear',
            tireRestrictions: null,
            fuelUsage: null,
            damageModel: null,
            assistsRestrictions: null,
            qualifyingPole: null,
            qualifyingPoleTop10: false,
            raceNotes: null,
        );

        $qualifier->setId(1);

        sleep(1);

        $qualifier->updateQualifierConfiguration(
            name: RaceName::from('Updated Qualifying'),
            qualifyingFormat: QualifyingFormat::TIME_TRIAL,
            qualifyingLength: 20,
            qualifyingTire: 'medium',
            weather: 'dynamic',
            tireRestrictions: 'any',
            fuelUsage: 'standard',
            damageModel: 'full',
            assistsRestrictions: 'limited',
            qualifyingPole: 2,
            qualifyingPoleTop10: false,
            raceNotes: 'Updated notes',
        );

        $this->assertSame('Updated Qualifying', $qualifier->name()?->value());
        $this->assertSame(QualifyingFormat::TIME_TRIAL, $qualifier->qualifyingFormat());
        $this->assertSame(20, $qualifier->qualifyingLength());
        $this->assertSame('medium', $qualifier->qualifyingTire());
        $this->assertSame(2, $qualifier->qualifyingPole());
        $this->assertFalse($qualifier->qualifyingPoleTop10());
        // Verify penalty fields remain disabled even after update
        $this->assertFalse($qualifier->trackLimitsEnforced());
        $this->assertFalse($qualifier->falseStartDetection());
        $this->assertFalse($qualifier->collisionPenalties());

        $events = $qualifier->events();
        $this->assertCount(2, $events);
        $this->assertInstanceOf(QualifierUpdated::class, $events[1]);
    }

    public function test_update_throws_exception_for_non_qualifier(): void
    {
        $race = Race::create(
            roundId: 1,
            raceNumber: 1,
            name: RaceName::from('Race 1'),
            type: null,
            qualifyingFormat: QualifyingFormat::STANDARD,
            qualifyingLength: 15,
            qualifyingTire: null,
            gridSource: \App\Domain\Competition\ValueObjects\GridSource::QUALIFYING,
            gridSourceRaceId: null,
            lengthType: \App\Domain\Competition\ValueObjects\RaceLengthType::LAPS,
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
            pointsSystem: \App\Domain\Competition\ValueObjects\PointsSystem::from([1 => 25]),
            fastestLap: null,
            fastestLapTop10: false,
            qualifyingPole: null,
            qualifyingPoleTop10: false,
            dnfPoints: 0,
            dnsPoints: 0,
            raceNotes: null,
            racePoints: false,
        );

        $race->setId(1);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Cannot update race as qualifier');

        $race->updateQualifierConfiguration(
            name: null,
            qualifyingFormat: QualifyingFormat::STANDARD,
            qualifyingLength: 15,
            qualifyingTire: null,
            weather: null,
            tireRestrictions: null,
            fuelUsage: null,
            damageModel: null,
            assistsRestrictions: null,
            qualifyingPole: null,
            qualifyingPoleTop10: false,
            raceNotes: null,
        );
    }
}

<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\Entities;

use App\Domain\Competition\Entities\Round;
use App\Domain\Competition\Events\RoundCreated;
use App\Domain\Competition\Events\RoundDeleted;
use App\Domain\Competition\Events\RoundStatusChanged;
use App\Domain\Competition\Events\RoundUpdated;
use App\Domain\Competition\ValueObjects\RoundName;
use App\Domain\Competition\ValueObjects\RoundNumber;
use App\Domain\Competition\ValueObjects\RoundSlug;
use App\Domain\Competition\ValueObjects\RoundStatus;
use App\Domain\Competition\ValueObjects\PointsSystem;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for Round entity.
 */
final class RoundTest extends TestCase
{
    #[Test]
    public function it_creates_new_round_with_required_fields(): void
    {
        $round = Round::create(
            seasonId: 1,
            roundNumber: RoundNumber::from(5),
            name: RoundName::from('Season Opener'),
            slug: RoundSlug::from('season-opener'),
            scheduledAt: new DateTimeImmutable('2025-02-18 19:00:00'),
            timezone: 'Australia/Sydney',
            platformTrackId: 10,
            trackLayout: null,
            trackConditions: null,
            technicalNotes: null,
            streamUrl: null,
            internalNotes: null,
            fastestLap: 1,
            fastestLapTop10: false,
            qualifyingPole: null,
            qualifyingPoleTop10: false,
            pointsSystem: null,
            roundPoints: false,
            createdByUserId: 1,
        );

        $this->assertNull($round->id());
        $this->assertEquals(1, $round->seasonId());
        $this->assertEquals(5, $round->roundNumber()->value());
        $this->assertEquals('Season Opener', $round->name()?->value());
        $this->assertEquals('season-opener', $round->slug()->value());
        $this->assertEquals(RoundStatus::SCHEDULED, $round->status());
        $this->assertEquals('Australia/Sydney', $round->timezone());
        $this->assertEquals(10, $round->platformTrackId());
        $this->assertEquals(1, $round->fastestLap());
        $this->assertEquals(false, $round->fastestLapTop10());
        $this->assertNull($round->pointsSystem());
        $this->assertEquals(false, $round->roundPoints());
        $this->assertEquals(1, $round->createdByUserId());
    }

    #[Test]
    public function it_reconstitutes_round_from_persistence(): void
    {
        $pointsSystem = PointsSystem::from([1 => 25, 2 => 18, 3 => 15]);

        $round = Round::reconstitute(
            id: 1,
            seasonId: 2,
            roundNumber: RoundNumber::from(3),
            name: RoundName::from('Round 3'),
            slug: RoundSlug::from('round-3'),
            scheduledAt: new DateTimeImmutable('2025-03-15 18:00:00'),
            timezone: 'UTC',
            platformTrackId: 5,
            trackLayout: 'GP',
            trackConditions: 'Dry',
            technicalNotes: 'BOP enabled',
            streamUrl: 'https://twitch.tv/test',
            internalNotes: 'Test notes',
            fastestLap: null,
            fastestLapTop10: true,
            qualifyingPole: 3,
            qualifyingPoleTop10: true,
            pointsSystem: $pointsSystem,
            roundPoints: true,
            status: RoundStatus::COMPLETED,
            roundResults: null,
            qualifyingResults: null,
            raceTimeResults: null,
            fastestLapResults: null,
            teamChampionshipResults: null,
            tiebreakerInformation: null,
            createdByUserId: 1,
            createdAt: new DateTimeImmutable('2025-01-01 00:00:00'),
            updatedAt: new DateTimeImmutable('2025-01-02 00:00:00'),
            deletedAt: null,
        );

        $this->assertEquals(1, $round->id());
        $this->assertEquals(2, $round->seasonId());
        $this->assertEquals(3, $round->roundNumber()->value());
        $this->assertEquals(RoundStatus::COMPLETED, $round->status());
        $this->assertEquals('GP', $round->trackLayout());
        $this->assertNull($round->fastestLap());
        $this->assertTrue($round->fastestLapTop10());
        $this->assertNotNull($round->pointsSystem());
        $this->assertEquals([1 => 25, 2 => 18, 3 => 15], $round->pointsSystem()?->toArray());
        $this->assertTrue($round->roundPoints());
    }

    #[Test]
    public function it_updates_round_details(): void
    {
        $round = $this->createDefaultRound();
        $newPointsSystem = PointsSystem::from([1 => 30, 2 => 25, 3 => 20]);

        $round->updateDetails(
            roundNumber: RoundNumber::from(6),
            name: RoundName::from('Updated Name'),
            slug: RoundSlug::from('updated-name'),
            scheduledAt: new DateTimeImmutable('2025-02-25 19:00:00'),
            platformTrackId: 11,
            trackLayout: 'National',
            trackConditions: 'Wet',
            technicalNotes: 'New notes',
            streamUrl: 'https://youtube.com/test',
            internalNotes: 'Internal update',
            fastestLap: 2,
            fastestLapTop10: true,
            qualifyingPole: 5,
            qualifyingPoleTop10: true,
            pointsSystem: $newPointsSystem,
            roundPoints: true,
        );

        $this->assertEquals(6, $round->roundNumber()->value());
        $this->assertEquals('Updated Name', $round->name()?->value());
        $this->assertEquals('National', $round->trackLayout());
        $this->assertEquals(2, $round->fastestLap());
        $this->assertTrue($round->fastestLapTop10());
        $this->assertEquals([1 => 30, 2 => 25, 3 => 20], $round->pointsSystem()?->toArray());
        $this->assertTrue($round->roundPoints());
        $this->assertTrue($round->hasEvents());
    }

    #[Test]
    public function it_does_not_record_event_when_no_changes_made(): void
    {
        $round = $this->createDefaultRound();

        $round->updateDetails(
            roundNumber: $round->roundNumber(),
            name: $round->name(),
            slug: $round->slug(),
            scheduledAt: $round->scheduledAt(),
            platformTrackId: $round->platformTrackId(),
            trackLayout: $round->trackLayout(),
            trackConditions: $round->trackConditions(),
            technicalNotes: $round->technicalNotes(),
            streamUrl: $round->streamUrl(),
            internalNotes: $round->internalNotes(),
            fastestLap: $round->fastestLap(),
            fastestLapTop10: $round->fastestLapTop10(),
            qualifyingPole: $round->qualifyingPole(),
            qualifyingPoleTop10: $round->qualifyingPoleTop10(),
            pointsSystem: $round->pointsSystem(),
            roundPoints: $round->roundPoints(),
        );

        $this->assertFalse($round->hasEvents());
    }

    #[Test]
    public function it_changes_status(): void
    {
        $round = $this->createDefaultRound();
        $round->setId(1);

        $round->changeStatus(RoundStatus::IN_PROGRESS);

        $this->assertEquals(RoundStatus::IN_PROGRESS, $round->status());
        $this->assertTrue($round->hasEvents());

        $events = $round->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(RoundStatusChanged::class, $events[0]);
    }

    #[Test]
    public function it_does_not_record_event_when_status_unchanged(): void
    {
        $round = $this->createDefaultRound();

        $round->changeStatus(RoundStatus::SCHEDULED);

        $this->assertFalse($round->hasEvents());
    }

    #[Test]
    public function it_deletes_round(): void
    {
        $round = $this->createDefaultRound();
        $round->setId(1);

        $round->delete();

        $this->assertNotNull($round->deletedAt());
        $this->assertTrue($round->hasEvents());

        $events = $round->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(RoundDeleted::class, $events[0]);
    }

    #[Test]
    public function it_records_creation_event(): void
    {
        $round = $this->createDefaultRound();
        $round->setId(1);

        $round->recordCreationEvent();

        $events = $round->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(RoundCreated::class, $events[0]);
        $this->assertEquals(1, $events[0]->roundId);
    }

    #[Test]
    public function it_releases_and_clears_events(): void
    {
        $round = $this->createDefaultRound();
        $round->setId(1);

        $round->changeStatus(RoundStatus::IN_PROGRESS);
        $this->assertTrue($round->hasEvents());

        $events = $round->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertFalse($round->hasEvents());
    }

    private function createDefaultRound(): Round
    {
        return Round::create(
            seasonId: 1,
            roundNumber: RoundNumber::from(5),
            name: RoundName::from('Test Round'),
            slug: RoundSlug::from('test-round'),
            scheduledAt: new DateTimeImmutable('2025-02-18 19:00:00'),
            timezone: 'UTC',
            platformTrackId: 10,
            trackLayout: 'GP',
            trackConditions: 'Dry',
            technicalNotes: 'Test',
            streamUrl: null,
            internalNotes: null,
            fastestLap: 1,
            fastestLapTop10: false,
            qualifyingPole: null,
            qualifyingPoleTop10: false,
            pointsSystem: null,
            roundPoints: false,
            createdByUserId: 1,
        );
    }
}

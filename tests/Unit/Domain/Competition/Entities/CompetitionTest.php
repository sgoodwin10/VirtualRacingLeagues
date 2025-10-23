<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\Entities;

use App\Domain\Competition\Entities\Competition;
use App\Domain\Competition\Events\CompetitionArchived;
use App\Domain\Competition\Events\CompetitionCreated;
use App\Domain\Competition\Events\CompetitionDeleted;
use App\Domain\Competition\Events\CompetitionUpdated;
use App\Domain\Competition\Exceptions\CompetitionAlreadyArchivedException;
use App\Domain\Competition\Exceptions\CompetitionIsArchivedException;
use App\Domain\Competition\ValueObjects\CompetitionName;
use App\Domain\Competition\ValueObjects\CompetitionSlug;
use App\Domain\Competition\ValueObjects\CompetitionStatus;
use PHPUnit\Framework\TestCase;

class CompetitionTest extends TestCase
{
    public function test_can_create_competition(): void
    {
        $competition = Competition::create(
            leagueId: 1,
            name: CompetitionName::from('GT3 Championship'),
            slug: CompetitionSlug::from('gt3-championship'),
            platformId: 1,
            createdByUserId: 1,
            description: 'A competitive GT3 series',
            logoPath: '/path/to/logo.png',
        );

        $this->assertNull($competition->id());
        $this->assertSame(1, $competition->leagueId());
        $this->assertSame('GT3 Championship', $competition->name()->value());
        $this->assertSame('gt3-championship', $competition->slug()->value());
        $this->assertSame('A competitive GT3 series', $competition->description());
        $this->assertSame(1, $competition->platformId());
        $this->assertSame('/path/to/logo.png', $competition->logoPath());
        $this->assertTrue($competition->status()->isActive());
        $this->assertSame(1, $competition->createdByUserId());
        $this->assertInstanceOf(\DateTimeImmutable::class, $competition->createdAt());
        $this->assertInstanceOf(\DateTimeImmutable::class, $competition->updatedAt());
        $this->assertNull($competition->deletedAt());
        $this->assertNull($competition->archivedAt());
    }

    public function test_can_create_competition_with_minimal_data(): void
    {
        $competition = Competition::create(
            leagueId: 1,
            name: CompetitionName::from('GT3 Championship'),
            slug: CompetitionSlug::from('gt3-championship'),
            platformId: 1,
            createdByUserId: 1,
        );

        $this->assertNull($competition->description());
        $this->assertNull($competition->logoPath());
    }

    public function test_can_reconstitute_competition(): void
    {
        $now = new \DateTimeImmutable();

        $competition = Competition::reconstitute(
            id: 1,
            leagueId: 1,
            name: CompetitionName::from('GT3 Championship'),
            slug: CompetitionSlug::from('gt3-championship'),
            platformId: 1,
            status: CompetitionStatus::ACTIVE,
            createdByUserId: 1,
            description: 'A competitive GT3 series',
            logoPath: '/path/to/logo.png',
            createdAt: $now,
            updatedAt: $now,
            deletedAt: null,
            archivedAt: null,
        );

        $this->assertSame(1, $competition->id());
        $this->assertSame('GT3 Championship', $competition->name()->value());
    }

    public function test_can_update_details(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);

        $newName = CompetitionName::from('GT4 Championship');
        $competition->updateDetails($newName, 'Updated description');

        $this->assertSame('GT4 Championship', $competition->name()->value());
        $this->assertSame('Updated description', $competition->description());
        $this->assertTrue($competition->hasEvents());

        $events = $competition->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(CompetitionUpdated::class, $events[0]);
    }

    public function test_updating_same_values_does_not_record_event(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);

        $sameName = CompetitionName::from('GT3 Championship');
        $competition->updateDetails($sameName, 'A competitive GT3 series');

        $this->assertFalse($competition->hasEvents());
    }

    public function test_cannot_update_archived_competition(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);
        $competition->archive();
        $competition->clearEvents();

        $this->expectException(CompetitionIsArchivedException::class);
        $this->expectExceptionMessage('Cannot update archived competition');

        $competition->updateDetails(
            CompetitionName::from('New Name'),
            'New description'
        );
    }

    public function test_can_update_logo(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);

        $competition->updateLogo('/new/path/logo.png');

        $this->assertSame('/new/path/logo.png', $competition->logoPath());
        $this->assertTrue($competition->hasEvents());

        $events = $competition->releaseEvents();
        $this->assertInstanceOf(CompetitionUpdated::class, $events[0]);
    }

    public function test_cannot_update_logo_when_archived(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);
        $competition->archive();
        $competition->clearEvents();

        $this->expectException(CompetitionIsArchivedException::class);

        $competition->updateLogo('/new/path/logo.png');
    }

    public function test_can_update_slug(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);

        $newSlug = CompetitionSlug::from('gt4-championship');
        $competition->updateSlug($newSlug);

        $this->assertSame('gt4-championship', $competition->slug()->value());
    }

    public function test_cannot_update_slug_when_archived(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);
        $competition->archive();
        $competition->clearEvents();

        $this->expectException(CompetitionIsArchivedException::class);

        $competition->updateSlug(CompetitionSlug::from('new-slug'));
    }

    public function test_can_archive_competition(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);

        $competition->archive();

        $this->assertTrue($competition->isArchived());
        $this->assertFalse($competition->isActive());
        $this->assertInstanceOf(\DateTimeImmutable::class, $competition->archivedAt());

        $events = $competition->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(CompetitionArchived::class, $events[0]);
    }

    public function test_cannot_archive_already_archived_competition(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);
        $competition->archive();
        $competition->clearEvents();

        $this->expectException(CompetitionAlreadyArchivedException::class);
        $this->expectExceptionMessage('Competition is already archived');

        $competition->archive();
    }

    public function test_can_restore_archived_competition(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);
        $competition->archive();
        $competition->clearEvents();

        $competition->restore();

        $this->assertTrue($competition->isActive());
        $this->assertFalse($competition->isArchived());
        $this->assertNull($competition->archivedAt());

        $events = $competition->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(CompetitionUpdated::class, $events[0]);
    }

    public function test_restoring_active_competition_does_nothing(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);

        $competition->restore();

        $this->assertTrue($competition->isActive());
        $this->assertFalse($competition->hasEvents());
    }

    public function test_can_delete_competition(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);

        $competition->delete();

        $this->assertTrue($competition->isDeleted());
        $this->assertInstanceOf(\DateTimeImmutable::class, $competition->deletedAt());

        $events = $competition->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(CompetitionDeleted::class, $events[0]);
    }

    public function test_deleting_already_deleted_competition_does_nothing(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);
        $competition->delete();
        $competition->clearEvents();

        $competition->delete();

        $this->assertFalse($competition->hasEvents());
    }

    public function test_platform_id_is_immutable(): void
    {
        $competition = $this->createCompetition();

        // Verify there is no setPlatform method
        $this->assertFalse(method_exists($competition, 'setPlatform'));
        $this->assertFalse(method_exists($competition, 'setPlatformId'));
        $this->assertFalse(method_exists($competition, 'updatePlatform'));
        $this->assertFalse(method_exists($competition, 'updatePlatformId'));
    }

    public function test_records_creation_event_after_id_set(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);

        $competition->recordCreationEvent();

        $events = $competition->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(CompetitionCreated::class, $events[0]);

        /** @var CompetitionCreated $event */
        $event = $events[0];
        $this->assertSame(1, $event->competitionId);
        $this->assertSame(1, $event->leagueId);
        $this->assertSame('GT3 Championship', $event->name);
        $this->assertSame(1, $event->platformId);
        $this->assertSame(1, $event->createdByUserId);
    }

    public function test_cannot_record_creation_event_without_id(): void
    {
        $competition = $this->createCompetition();

        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('Cannot record creation event before entity has an ID');

        $competition->recordCreationEvent();
    }

    public function test_is_active_returns_correct_value(): void
    {
        $competition = $this->createCompetition();

        $this->assertTrue($competition->isActive());
        $this->assertFalse($competition->isArchived());
        $this->assertFalse($competition->isDeleted());
    }

    public function test_is_archived_returns_correct_value(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);
        $competition->archive();

        $this->assertFalse($competition->isActive());
        $this->assertTrue($competition->isArchived());
        $this->assertFalse($competition->isDeleted());
    }

    public function test_is_deleted_returns_correct_value(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);
        $competition->delete();

        $this->assertTrue($competition->isDeleted());
    }

    public function test_release_events_returns_and_clears_events(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);
        $competition->updateDetails(
            CompetitionName::from('New Name'),
            'New description'
        );

        $this->assertTrue($competition->hasEvents());

        $events = $competition->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertFalse($competition->hasEvents());

        // Second call should return empty
        $events2 = $competition->releaseEvents();
        $this->assertCount(0, $events2);
    }

    public function test_clear_events_removes_all_events(): void
    {
        $competition = $this->createCompetition();
        $competition->setId(1);
        $competition->updateDetails(
            CompetitionName::from('New Name'),
            'New description'
        );

        $this->assertTrue($competition->hasEvents());

        $competition->clearEvents();

        $this->assertFalse($competition->hasEvents());
    }

    private function createCompetition(): Competition
    {
        return Competition::create(
            leagueId: 1,
            name: CompetitionName::from('GT3 Championship'),
            slug: CompetitionSlug::from('gt3-championship'),
            platformId: 1,
            createdByUserId: 1,
            description: 'A competitive GT3 series',
            logoPath: '/path/to/logo.png',
        );
    }
}

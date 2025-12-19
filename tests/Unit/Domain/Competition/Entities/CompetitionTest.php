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
            competitionColour: '{"r":100,"g":102,"b":241}',
            createdAt: $now,
            updatedAt: $now,
            archivedAt: null,
        );

        $this->assertSame(1, $competition->id());
        $this->assertSame('GT3 Championship', $competition->name()->value());
        $this->assertSame('{"r":100,"g":102,"b":241}', $competition->competitionColour());
    }

    public function test_can_update_details(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);

        $newName = CompetitionName::from('GT4 Championship');
        $competition->updateDetails($newName, 'Updated description');

        $this->assertSame('GT4 Championship', $competition->name()->value());
        $this->assertSame('Updated description', $competition->description());
        $this->assertTrue($competition->hasEvents());

        $events = $competition->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(CompetitionUpdated::class, $events[0]);
    }

    public function test_can_clear_description(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);

        $competition->updateDetails(
            CompetitionName::from('GT3 Championship'),
            null
        );

        $this->assertNull($competition->description());
        $this->assertTrue($competition->hasEvents());

        $events = $competition->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(CompetitionUpdated::class, $events[0]);

        /** @var CompetitionUpdated $event */
        $event = $events[0];
        $this->assertArrayHasKey('description', $event->changes);
        $this->assertSame('A competitive GT3 series', $event->changes['description']['old']);
        $this->assertNull($event->changes['description']['new']);
    }

    public function test_updating_same_values_does_not_record_event(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);

        $sameName = CompetitionName::from('GT3 Championship');
        $competition->updateDetails($sameName, 'A competitive GT3 series');

        $this->assertFalse($competition->hasEvents());
    }

    public function test_cannot_update_archived_competition(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);
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
        $this->setCompetitionId($competition, 1);

        $competition->updateLogo('/new/path/logo.png');

        $this->assertSame('/new/path/logo.png', $competition->logoPath());
        $this->assertTrue($competition->hasEvents());

        $events = $competition->releaseEvents();
        $this->assertInstanceOf(CompetitionUpdated::class, $events[0]);
    }

    public function test_can_remove_logo(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);

        $competition->updateLogo(null);

        $this->assertNull($competition->logoPath());
        $this->assertTrue($competition->hasEvents());

        $events = $competition->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(CompetitionUpdated::class, $events[0]);

        /** @var CompetitionUpdated $event */
        $event = $events[0];
        $this->assertArrayHasKey('logo_path', $event->changes);
        $this->assertSame('/path/to/logo.png', $event->changes['logo_path']['old']);
        $this->assertNull($event->changes['logo_path']['new']);
    }

    public function test_cannot_update_logo_when_archived(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);
        $competition->archive();
        $competition->clearEvents();

        $this->expectException(CompetitionIsArchivedException::class);

        $competition->updateLogo('/new/path/logo.png');
    }

    public function test_can_update_competition_colour(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);

        $competition->updateCompetitionColour('{"r":255,"g":0,"b":0}');

        $this->assertSame('{"r":255,"g":0,"b":0}', $competition->competitionColour());
        $this->assertTrue($competition->hasEvents());

        $events = $competition->releaseEvents();
        $this->assertInstanceOf(CompetitionUpdated::class, $events[0]);
    }

    public function test_cannot_update_competition_colour_when_archived(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);
        $competition->archive();
        $competition->clearEvents();

        $this->expectException(CompetitionIsArchivedException::class);

        $competition->updateCompetitionColour('{"r":255,"g":0,"b":0}');
    }

    public function test_can_update_slug(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);

        $newSlug = CompetitionSlug::from('gt4-championship');
        $competition->updateSlug($newSlug);

        $this->assertSame('gt4-championship', $competition->slug()->value());
    }

    public function test_cannot_update_slug_when_archived(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);
        $competition->archive();
        $competition->clearEvents();

        $this->expectException(CompetitionIsArchivedException::class);

        $competition->updateSlug(CompetitionSlug::from('new-slug'));
    }

    public function test_can_archive_competition(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);

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
        $this->setCompetitionId($competition, 1);
        $competition->archive();
        $competition->clearEvents();

        $this->expectException(CompetitionAlreadyArchivedException::class);
        $this->expectExceptionMessage('Competition is already archived');

        $competition->archive();
    }

    public function test_can_restore_archived_competition(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);
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
        $this->setCompetitionId($competition, 1);

        $competition->restore();

        $this->assertTrue($competition->isActive());
        $this->assertFalse($competition->hasEvents());
    }

    public function test_can_delete_competition(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);

        $competition->delete();

        $events = $competition->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(CompetitionDeleted::class, $events[0]);
    }

    public function test_deleting_competition_multiple_times_is_idempotent(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);
        $competition->delete();
        $competition->clearEvents();

        $competition->delete();

        // Delete is now idempotent - subsequent calls should be a no-op
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
        $this->setCompetitionId($competition, 1);

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
    }

    public function test_is_archived_returns_correct_value(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);
        $competition->archive();

        $this->assertFalse($competition->isActive());
        $this->assertTrue($competition->isArchived());
    }

    public function test_release_events_returns_and_clears_events(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);
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
        $this->setCompetitionId($competition, 1);
        $competition->updateDetails(
            CompetitionName::from('New Name'),
            'New description'
        );

        $this->assertTrue($competition->hasEvents());

        $competition->clearEvents();

        $this->assertFalse($competition->hasEvents());
    }

    public function test_updating_name_does_not_automatically_update_slug(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);

        // Change the name
        $newName = CompetitionName::from('Formula 1 Championship');
        $competition->updateDetails($newName, 'Updated description');

        // Slug should NOT be auto-updated
        $this->assertSame('gt3-championship', $competition->slug()->value());

        $events = $competition->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(CompetitionUpdated::class, $events[0]);

        /** @var CompetitionUpdated $event */
        $event = $events[0];
        $this->assertArrayHasKey('name', $event->changes);
        $this->assertArrayNotHasKey('slug', $event->changes);
    }

    public function test_updating_name_preserves_created_at(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);

        $originalCreatedAt = $competition->createdAt();

        $competition->updateDetails(
            CompetitionName::from('New Name'),
            'New description'
        );

        // createdAt should be the exact same instance (not modified)
        $this->assertSame($originalCreatedAt, $competition->createdAt());
    }

    public function test_updating_name_updates_updated_at(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);

        $originalUpdatedAt = $competition->updatedAt();

        $competition->updateDetails(
            CompetitionName::from('New Name'),
            'New description'
        );

        // updatedAt should be a different instance (newly created)
        $this->assertNotSame($originalUpdatedAt, $competition->updatedAt());

        // The new updatedAt should be greater than or equal to the original
        // (in practice it will always be >= due to how DateTimeImmutable works)
        $this->assertGreaterThanOrEqual(
            $originalUpdatedAt->getTimestamp(),
            $competition->updatedAt()->getTimestamp()
        );
    }

    public function test_cannot_update_details_on_unpersisted_entity(): void
    {
        $competition = $this->createCompetition();

        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('Cannot perform this operation on an unpersisted entity');

        $competition->updateDetails(
            CompetitionName::from('New Name'),
            'New description'
        );
    }

    public function test_update_slug(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);

        $newSlug = CompetitionSlug::from('new-unique-slug');
        $competition->updateSlug($newSlug);

        $this->assertSame('new-unique-slug', $competition->slug()->value());

        $events = $competition->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(CompetitionUpdated::class, $events[0]);

        /** @var CompetitionUpdated $event */
        $event = $events[0];
        $this->assertArrayHasKey('slug', $event->changes);
        $this->assertSame('gt3-championship', $event->changes['slug']['old']);
        $this->assertSame('new-unique-slug', $event->changes['slug']['new']);
    }

    public function test_event_payload_contains_correct_changes(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);

        // Update multiple fields at once
        $competition->updateDetails(
            CompetitionName::from('New Championship Name'),
            'Brand new description'
        );

        $events = $competition->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(CompetitionUpdated::class, $events[0]);

        /** @var CompetitionUpdated $event */
        $event = $events[0];

        // Verify event has correct competition ID
        $this->assertSame(1, $event->competitionId);

        // Verify event has correct league ID
        $this->assertSame(1, $event->leagueId);

        // Verify changes array has both fields
        $this->assertArrayHasKey('name', $event->changes);
        $this->assertArrayHasKey('description', $event->changes);

        // Verify old values
        $this->assertSame('GT3 Championship', $event->changes['name']['old']);
        $this->assertSame('A competitive GT3 series', $event->changes['description']['old']);

        // Verify new values
        $this->assertSame('New Championship Name', $event->changes['name']['new']);
        $this->assertSame('Brand new description', $event->changes['description']['new']);

        // Verify event has timestamp (as string in Y-m-d H:i:s format)
        $this->assertIsString($event->occurredAt);
        $this->assertNotEmpty($event->occurredAt);
        // Verify timestamp is valid Y-m-d H:i:s format
        $timestamp = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $event->occurredAt);
        $this->assertInstanceOf(\DateTimeImmutable::class, $timestamp);
        // Verify format is correct by comparing
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $event->occurredAt);
    }

    public function test_update_slug_with_same_value_does_not_record_event(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);

        $sameSlug = CompetitionSlug::from('gt3-championship');
        $competition->updateSlug($sameSlug);

        $this->assertFalse($competition->hasEvents());
    }

    public function test_cannot_update_slug_on_unpersisted_entity(): void
    {
        $competition = $this->createCompetition();

        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('Cannot perform this operation on an unpersisted entity');

        $competition->updateSlug(CompetitionSlug::from('new-slug'));
    }

    public function test_cannot_update_slug_on_archived_competition(): void
    {
        $competition = $this->createCompetition();
        $this->setCompetitionId($competition, 1);
        $competition->archive();
        $competition->clearEvents();

        $this->expectException(CompetitionIsArchivedException::class);

        $competition->updateSlug(CompetitionSlug::from('new-slug'));
    }

    public function test_cannot_archive_unpersisted_entity(): void
    {
        $competition = $this->createCompetition();

        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('Cannot perform this operation on an unpersisted entity');

        $competition->archive();
    }

    public function test_cannot_delete_unpersisted_entity(): void
    {
        $competition = $this->createCompetition();

        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('Cannot perform this operation on an unpersisted entity');

        $competition->delete();
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

    /**
     * Helper method to set ID on competition using reflection.
     * Mimics what the repository does after persisting an entity.
     */
    private function setCompetitionId(Competition $competition, int $id): void
    {
        $reflection = new \ReflectionClass($competition);
        $property = $reflection->getProperty('id');
        $property->setAccessible(true);
        $property->setValue($competition, $id);
    }
}

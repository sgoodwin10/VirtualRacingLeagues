<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\Entities;

use App\Domain\Competition\Entities\Season;
use App\Domain\Competition\Exceptions\SeasonIsArchivedException;
use App\Domain\Competition\ValueObjects\SeasonName;
use App\Domain\Competition\ValueObjects\SeasonSlug;
use App\Domain\Competition\ValueObjects\SeasonStatus;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

final class SeasonTest extends TestCase
{
    public function test_can_create_season(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            carClass: 'GT3',
            description: 'First season',
        );

        $this->assertNull($season->id());
        $this->assertEquals(1, $season->competitionId());
        $this->assertEquals('Season 1', $season->name()->value());
        $this->assertEquals('season-1', $season->slug()->value());
        $this->assertEquals('GT3', $season->carClass());
        $this->assertEquals('First season', $season->description());
        $this->assertTrue($season->isSetup());
        $this->assertFalse($season->isActive());
        $this->assertFalse($season->isArchived());
        $this->assertFalse($season->teamChampionshipEnabled());
    }

    public function test_can_reconstitute_season(): void
    {
        $createdAt = new DateTimeImmutable('2025-01-01 10:00:00');
        $updatedAt = new DateTimeImmutable('2025-01-02 15:30:00');

        $season = Season::reconstitute(
            id: 1,
            competitionId: 2,
            name: SeasonName::from('Season 2'),
            slug: SeasonSlug::from('season-2'),
            createdByUserId: 1,
            status: SeasonStatus::ACTIVE,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
        );

        $this->assertEquals(1, $season->id());
        $this->assertEquals(2, $season->competitionId());
        $this->assertEquals('Season 2', $season->name()->value());
        $this->assertTrue($season->isActive());
        $this->assertEquals('2025-01-01 10:00:00', $season->createdAt()->format('Y-m-d H:i:s'));
    }

    public function test_can_update_details(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
        );

        $season->updateDetails(
            SeasonName::from('Season 1 Updated'),
            'GT4',
            'Updated description',
            'Updated specs'
        );

        $this->assertEquals('Season 1 Updated', $season->name()->value());
        $this->assertEquals('GT4', $season->carClass());
        $this->assertEquals('Updated description', $season->description());
        $this->assertEquals('Updated specs', $season->technicalSpecs());
        $this->assertTrue($season->hasEvents());
    }

    public function test_cannot_update_archived_season(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
        );

        $season->setId(1);
        $season->archive();

        $this->expectException(SeasonIsArchivedException::class);

        $season->updateDetails(
            SeasonName::from('Season 1 Updated'),
            null,
            null,
            null
        );
    }

    public function test_can_enable_team_championship(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
        );

        $this->assertFalse($season->teamChampionshipEnabled());

        $season->enableTeamChampionship();

        $this->assertTrue($season->teamChampionshipEnabled());
    }

    public function test_can_disable_team_championship(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            teamChampionshipEnabled: true,
        );

        $this->assertTrue($season->teamChampionshipEnabled());

        $season->disableTeamChampionship();

        $this->assertFalse($season->teamChampionshipEnabled());
    }

    public function test_can_activate_season(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
        );

        $this->assertTrue($season->isSetup());

        $season->activate();

        $this->assertFalse($season->isSetup());
        $this->assertTrue($season->isActive());
    }

    public function test_can_complete_season(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
        );

        $season->activate();
        $season->complete();

        $this->assertTrue($season->isCompleted());
        $this->assertFalse($season->isActive());
    }

    public function test_can_archive_season(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
        );

        $season->setId(1);
        $season->archive();

        $this->assertTrue($season->isArchived());
        $this->assertTrue($season->hasEvents());
    }

    public function test_can_restore_archived_season(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
        );

        $season->setId(1);
        $season->complete();
        $season->archive();
        $season->restore();

        $this->assertFalse($season->isArchived());
        $this->assertTrue($season->isCompleted());
    }

    public function test_can_soft_delete_season(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
        );

        $season->setId(1);

        $this->assertFalse($season->isDeleted());

        $season->delete();

        $this->assertTrue($season->isDeleted());
        $this->assertNotNull($season->deletedAt());
    }

    public function test_can_update_branding(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
        );

        $season->updateBranding('logos/season1.png', 'banners/season1.jpg');

        $this->assertEquals('logos/season1.png', $season->logoPath());
        $this->assertEquals('banners/season1.jpg', $season->bannerPath());
    }

    public function test_can_release_events(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
        );

        $season->setId(1);
        $season->activate();

        $this->assertTrue($season->hasEvents());

        $events = $season->releaseEvents();

        $this->assertNotEmpty($events);
        $this->assertFalse($season->hasEvents());
    }

    public function test_can_enable_race_times(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            raceTimesRequired: false,
        );

        $this->assertFalse($season->raceTimesRequired());

        $season->enableRaceTimes();

        $this->assertTrue($season->raceTimesRequired());
        $this->assertTrue($season->hasEvents());
    }

    public function test_can_disable_race_times(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            raceTimesRequired: true,
        );

        $this->assertTrue($season->raceTimesRequired());

        $season->disableRaceTimes();

        $this->assertFalse($season->raceTimesRequired());
        $this->assertTrue($season->hasEvents());
    }

    public function test_cannot_enable_race_times_on_archived_season(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            raceTimesRequired: false,
        );

        $season->setId(1);
        $season->archive();

        $this->expectException(SeasonIsArchivedException::class);

        $season->enableRaceTimes();
    }

    public function test_cannot_disable_race_times_on_archived_season(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            raceTimesRequired: true,
        );

        $season->setId(1);
        $season->archive();

        $this->expectException(SeasonIsArchivedException::class);

        $season->disableRaceTimes();
    }

    public function test_cannot_enable_team_championship_on_archived_season(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            teamChampionshipEnabled: false,
        );

        $season->setId(1);
        $season->archive();

        $this->expectException(SeasonIsArchivedException::class);

        $season->enableTeamChampionship();
    }

    public function test_cannot_disable_team_championship_on_archived_season(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            teamChampionshipEnabled: true,
        );

        $season->setId(1);
        $season->archive();

        $this->expectException(SeasonIsArchivedException::class);

        $season->disableTeamChampionship();
    }

    public function test_cannot_enable_race_divisions_on_archived_season(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            raceDivisionsEnabled: false,
        );

        $season->setId(1);
        $season->archive();

        $this->expectException(SeasonIsArchivedException::class);

        $season->enableRaceDivisions();
    }

    public function test_cannot_disable_race_divisions_on_archived_season(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            raceDivisionsEnabled: true,
        );

        $season->setId(1);
        $season->archive();

        $this->expectException(SeasonIsArchivedException::class);

        $season->disableRaceDivisions();
    }

    public function test_can_enable_drop_round(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            dropRound: false,
        );

        $this->assertFalse($season->hasDropRound());

        $season->enableDropRound();

        $this->assertTrue($season->hasDropRound());
        $this->assertTrue($season->hasEvents());
    }

    public function test_can_disable_drop_round(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            dropRound: true,
            totalDropRounds: 2,
        );

        $this->assertTrue($season->hasDropRound());
        $this->assertEquals(2, $season->getTotalDropRounds());

        $season->disableDropRound();

        $this->assertFalse($season->hasDropRound());
        $this->assertEquals(0, $season->getTotalDropRounds());
        $this->assertTrue($season->hasEvents());
    }

    public function test_disabling_drop_round_resets_total_drop_rounds_to_zero(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            dropRound: true,
            totalDropRounds: 3,
        );

        $this->assertEquals(3, $season->getTotalDropRounds());

        $season->disableDropRound();

        $this->assertEquals(0, $season->getTotalDropRounds());
    }

    public function test_can_update_total_drop_rounds_when_drop_round_enabled(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            dropRound: true,
        );

        $this->assertEquals(0, $season->getTotalDropRounds());

        $season->updateTotalDropRounds(2);

        $this->assertEquals(2, $season->getTotalDropRounds());
        $this->assertTrue($season->hasEvents());
    }

    public function test_cannot_update_total_drop_rounds_when_drop_round_disabled(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            dropRound: false,
        );

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage(
            'Cannot set total drop rounds to a value greater than 0 when drop round feature is disabled'
        );

        $season->updateTotalDropRounds(2);
    }

    public function test_cannot_create_season_with_drop_round_disabled_and_total_drop_rounds_greater_than_zero(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage(
            'Cannot set total drop rounds to a value greater than 0 when drop round feature is disabled'
        );

        Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            dropRound: false,
            totalDropRounds: 2,
        );
    }

    public function test_can_create_season_with_drop_round_enabled_and_total_drop_rounds_greater_than_zero(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            dropRound: true,
            totalDropRounds: 2,
        );

        $this->assertTrue($season->hasDropRound());
        $this->assertEquals(2, $season->getTotalDropRounds());
    }

    public function test_can_update_total_drop_rounds_to_zero_when_drop_round_disabled(): void
    {
        $season = Season::create(
            competitionId: 1,
            name: SeasonName::from('Season 1'),
            slug: SeasonSlug::from('season-1'),
            createdByUserId: 1,
            dropRound: false,
        );

        // Setting to 0 should always be allowed
        $season->updateTotalDropRounds(0);

        $this->assertEquals(0, $season->getTotalDropRounds());
    }
}

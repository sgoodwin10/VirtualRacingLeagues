<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use App\Domain\Competition\Entities\Season;
use Spatie\LaravelData\Data;

/**
 * Output DTO representing a season with full details.
 */
class SeasonData extends Data
{
    public function __construct(
        public int $id,
        public int $competition_id,
        public SeasonCompetitionData $competition,
        public string $name,
        public string $slug,
        public ?string $car_class,
        public ?string $description,
        public ?string $technical_specs,
        public ?string $logo_url,
        public ?string $banner_url,
        public bool $has_own_logo,
        public bool $has_own_banner,
        public bool $team_championship_enabled,
        public bool $race_divisions_enabled,
        public string $status,
        public bool $is_setup,
        public bool $is_active,
        public bool $is_completed,
        public bool $is_archived,
        public bool $is_deleted,
        public int $created_by_user_id,
        public string $created_at,
        public string $updated_at,
        public ?string $deleted_at,
        public SeasonStatsData $stats,
    ) {
    }

    /**
     * Create from domain entity with competition data and URLs.
     *
     * @param array<string, int> $aggregates
     */
    public static function fromEntity(
        Season $season,
        SeasonCompetitionData $competitionData,
        ?string $logoUrl,
        ?string $bannerUrl,
        array $aggregates = []
    ): self {
        return new self(
            id: $season->id() ?? 0,
            competition_id: $season->competitionId(),
            competition: $competitionData,
            name: $season->name()->value(),
            slug: $season->slug()->value(),
            car_class: $season->carClass(),
            description: $season->description(),
            technical_specs: $season->technicalSpecs(),
            logo_url: $logoUrl,
            banner_url: $bannerUrl,
            has_own_logo: $season->logoPath() !== null,
            has_own_banner: $season->bannerPath() !== null,
            team_championship_enabled: $season->teamChampionshipEnabled(),
            race_divisions_enabled: $season->raceDivisionsEnabled(),
            status: $season->status()->value,
            is_setup: $season->isSetup(),
            is_active: $season->isActive(),
            is_completed: $season->isCompleted(),
            is_archived: $season->isArchived(),
            is_deleted: $season->isDeleted(),
            created_by_user_id: $season->createdByUserId(),
            created_at: $season->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $season->updatedAt()->format('Y-m-d H:i:s'),
            deleted_at: $season->deletedAt()?->format('Y-m-d H:i:s'),
            stats: new SeasonStatsData(
                total_drivers: $aggregates['total_drivers'] ?? 0,
                active_drivers: $aggregates['active_drivers'] ?? 0,
                total_races: $aggregates['total_races'] ?? 0,
                completed_races: $aggregates['completed_races'] ?? 0,
            ),
        );
    }
}

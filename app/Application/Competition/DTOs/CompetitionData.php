<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use App\Domain\Competition\Entities\Competition;
use Spatie\LaravelData\Data;

/**
 * Output DTO representing a competition with full details.
 */
class CompetitionData extends Data
{
    public function __construct(
        public int $id,
        public int $league_id,
        public string $name,
        public string $slug,
        public ?string $description,
        public int $platform_id,
        public string $platform_name,
        public string $platform_slug,
        public ?CompetitionLeagueData $league,
        public string $logo_url,
        public bool $has_own_logo,
        public string $status,
        public bool $is_active,
        public bool $is_archived,
        public bool $is_deleted,
        public ?string $archived_at,
        public string $created_at,
        public string $updated_at,
        public ?string $deleted_at,
        public int $created_by_user_id,
        public CompetitionStatsData $stats,
        /** @var array<CompetitionSeasonData> */
        public array $seasons = [],
    ) {
    }

    /**
     * Create from domain entity with platform data and logo URL.
     *
     * @param array{id: int, name: string, slug: string} $platformData
     * @param array{id: int, name: string, slug: string}|null $leagueData
     * @param array<string, int|string|null> $aggregates
     * @param array<CompetitionSeasonData> $seasons
     */
    public static function fromEntity(
        Competition $competition,
        array $platformData,
        string $logoUrl,
        ?array $leagueData = null,
        array $aggregates = [],
        array $seasons = []
    ): self {
        return new self(
            id: $competition->id() ?? 0,
            league_id: $competition->leagueId(),
            name: $competition->name()->value(),
            slug: $competition->slug()->value(),
            description: $competition->description(),
            platform_id: $competition->platformId(),
            platform_name: $platformData['name'],
            platform_slug: $platformData['slug'],
            league: $leagueData !== null
                ? new CompetitionLeagueData(
                    id: $leagueData['id'],
                    name: $leagueData['name'],
                    slug: $leagueData['slug'],
                )
                : null,
            logo_url: $logoUrl,
            has_own_logo: $competition->logoPath() !== null,
            status: $competition->status()->value,
            is_active: $competition->isActive(),
            is_archived: $competition->isArchived(),
            is_deleted: $competition->isDeleted(),
            archived_at: $competition->archivedAt()?->format('Y-m-d H:i:s'),
            created_at: $competition->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $competition->updatedAt()->format('Y-m-d H:i:s'),
            deleted_at: $competition->deletedAt()?->format('Y-m-d H:i:s'),
            created_by_user_id: $competition->createdByUserId(),
            stats: new CompetitionStatsData(
                total_seasons: (int) ($aggregates['total_seasons'] ?? 0),
                active_seasons: (int) ($aggregates['active_seasons'] ?? 0),
                total_drivers: (int) ($aggregates['total_drivers'] ?? 0),
                total_races: (int) ($aggregates['total_races'] ?? 0),
                next_race_date: isset($aggregates['next_race_date'])
                    ? (string) $aggregates['next_race_date']
                    : null,
            ),
            seasons: $seasons,
        );
    }
}

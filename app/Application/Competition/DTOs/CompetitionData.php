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
        public string $logo_url,
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
    ) {
    }

    /**
     * Create from domain entity with platform data and logo URL.
     *
     * @param array{id: int, name: string, slug: string} $platformData
     * @param array<string, int|string|null> $aggregates
     */
    public static function fromEntity(
        Competition $competition,
        array $platformData,
        string $logoUrl,
        array $aggregates = []
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
            logo_url: $logoUrl,
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
        );
    }
}

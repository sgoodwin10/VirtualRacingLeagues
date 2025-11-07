<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use App\Domain\Competition\Entities\Competition;
use Spatie\LaravelData\Data;

/**
 * Lightweight DTO for competition lists.
 * Excludes detailed stats and description for better performance.
 */
class CompetitionListData extends Data
{
    public function __construct(
        public int $id,
        public int $league_id,
        public string $name,
        public string $slug,
        public int $platform_id,
        public string $platform_name,
        public string $platform_slug,
        public ?CompetitionLeagueData $league,
        public ?string $logo_url,
        public bool $has_own_logo,
        public string $status,
        public bool $is_active,
        public bool $is_archived,
        public string $created_at,
        public string $updated_at,
        public int $created_by_user_id,
    ) {
    }

    /**
     * Create from domain entity with platform data and logo URL.
     *
     * @param array{id: int, name: string, slug: string} $platformData
     * @param array{id: int, name: string, slug: string}|null $leagueData
     */
    public static function fromEntity(
        Competition $competition,
        array $platformData,
        ?string $logoUrl,
        ?array $leagueData = null
    ): self {
        return new self(
            id: $competition->id() ?? 0,
            league_id: $competition->leagueId(),
            name: $competition->name()->value(),
            slug: $competition->slug()->value(),
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
            created_at: $competition->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $competition->updatedAt()->format('Y-m-d H:i:s'),
            created_by_user_id: $competition->createdByUserId(),
        );
    }
}

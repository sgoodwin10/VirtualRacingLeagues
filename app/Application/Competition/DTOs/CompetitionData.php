<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use App\Application\Shared\DTOs\MediaData;
use App\Application\Shared\Factories\MediaDataFactory;
use App\Domain\Competition\Entities\Competition;
use App\Infrastructure\Persistence\Eloquent\Models\Competition as CompetitionEloquent;
use Spatie\LaravelData\Data;

/**
 * Output DTO representing a competition with full details.
 */
class CompetitionData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly int $league_id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $description,
        public readonly int $platform_id,
        public readonly string $platform_name,
        public readonly string $platform_slug,
        public readonly ?CompetitionLeagueData $league,
        /**
         * @deprecated Use $logo instead. This field is maintained for backward compatibility only.
         */
        public readonly ?string $logo_url,
        /**
         * NEW FORMAT - media object with all conversion URLs.
         */
        public readonly ?MediaData $logo,
        public readonly bool $has_own_logo,
        public readonly ?string $competition_colour,
        public readonly string $status,
        public readonly bool $is_active,
        public readonly bool $is_archived,
        public readonly ?string $archived_at,
        public readonly string $created_at,
        public readonly string $updated_at,
        public readonly int $created_by_user_id,
        public readonly CompetitionStatsData $stats,
        /** @var array<CompetitionSeasonData> */
        public readonly array $seasons = [],
    ) {
    }

    /**
     * Create from domain entity with platform data and logo URL.
     *
     * @param array{id: int, name: string, slug: string} $platformData
     * @param array{id: int, name: string, slug: string}|null $leagueData
     * @param array<string, int|string|null> $aggregates
     * @param array<CompetitionSeasonData> $seasons
     * @param CompetitionEloquent|null $eloquentModel
     * @throws \InvalidArgumentException If competition has not been persisted yet (ID is null)
     */
    public static function fromEntity(
        Competition $competition,
        array $platformData,
        ?string $logoUrl,
        ?array $leagueData = null,
        array $aggregates = [],
        array $seasons = [],
        ?CompetitionEloquent $eloquentModel = null
    ): self {
        // Ensure competition has been persisted (has an ID)
        $competitionId = $competition->id();
        if ($competitionId === null) {
            throw new \InvalidArgumentException(
                'Cannot create CompetitionData from unpersisted Competition entity. ' .
                'The competition must be saved to the database before converting to DTO.'
            );
        }

        // Extract media from eloquent model if available
        $logo = null;

        if ($eloquentModel !== null) {
            $mediaFactory = app(MediaDataFactory::class);
            $logo = $mediaFactory->fromMedia($eloquentModel->getFirstMedia('logo'));
        }

        return new self(
            id: $competitionId,
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
            // OLD FORMAT (backward compatibility)
            logo_url: $logoUrl,
            // NEW FORMAT
            logo: $logo,
            has_own_logo: $competition->logoPath() !== null,
            competition_colour: $competition->competitionColour(),
            status: $competition->status()->value,
            is_active: $competition->isActive(),
            is_archived: $competition->isArchived(),
            archived_at: $competition->archivedAt()?->format('Y-m-d H:i:s'),
            created_at: $competition->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $competition->updatedAt()->format('Y-m-d H:i:s'),
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

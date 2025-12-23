<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use App\Domain\Competition\Entities\Season;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use Spatie\LaravelData\Data;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

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
        // OLD FORMAT (backward compatibility) - will be deprecated
        public ?string $logo_url,
        public ?string $banner_url,
        // NEW FORMAT - media objects with all conversion URLs
        public ?array $logo,
        public ?array $banner,
        public bool $has_own_logo,
        public bool $has_own_banner,
        public bool $team_championship_enabled,
        public ?int $teams_drivers_for_calculation,
        public bool $teams_drop_rounds,
        public ?int $teams_total_drop_rounds,
        public bool $race_divisions_enabled,
        public bool $race_times_required,
        public bool $drop_round,
        public int $total_drop_rounds,
        public bool $round_totals_tiebreaker_rules_enabled,
        /** @var array<SeasonTiebreakerRuleData> */
        public array $tiebreaker_rules,
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
     * @param SeasonEloquent|null $eloquentModel Optional eloquent model for media
     */
    public static function fromEntity(
        Season $season,
        SeasonCompetitionData $competitionData,
        ?string $logoUrl,
        ?string $bannerUrl,
        array $aggregates = [],
        ?SeasonEloquent $eloquentModel = null
    ): self {
        // Extract media from eloquent model if available
        $logo = null;
        $banner = null;

        if ($eloquentModel !== null) {
            $logo = self::mediaToArray($eloquentModel->getFirstMedia('logo'));
            $banner = self::mediaToArray($eloquentModel->getFirstMedia('banner'));
        }

        return new self(
            id: $season->id() ?? 0,
            competition_id: $season->competitionId(),
            competition: $competitionData,
            name: $season->name()->value(),
            slug: $season->slug()->value(),
            car_class: $season->carClass(),
            description: $season->description(),
            technical_specs: $season->technicalSpecs(),
            // OLD FORMAT (backward compatibility)
            logo_url: $logoUrl,
            banner_url: $bannerUrl,
            // NEW FORMAT
            logo: $logo,
            banner: $banner,
            has_own_logo: $season->logoPath() !== null,
            has_own_banner: $season->bannerPath() !== null,
            team_championship_enabled: $season->teamChampionshipEnabled(),
            teams_drivers_for_calculation: $season->getTeamsDriversForCalculation(),
            teams_drop_rounds: $season->hasTeamsDropRounds(),
            teams_total_drop_rounds: $season->getTeamsTotalDropRounds(),
            race_divisions_enabled: $season->raceDivisionsEnabled(),
            race_times_required: $season->raceTimesRequired(),
            drop_round: $season->hasDropRound(),
            total_drop_rounds: $season->getTotalDropRounds(),
            round_totals_tiebreaker_rules_enabled: $season->hasTiebreakerRulesEnabled(),
            tiebreaker_rules: array_map(
                fn($rule) => new SeasonTiebreakerRuleData(
                    id: $rule->id(),
                    name: $eloquentModel?->tiebreakerRules->firstWhere('id', $rule->id())?->name ?? '',
                    slug: $rule->slug()->value(),
                    description: $eloquentModel?->tiebreakerRules->firstWhere('id', $rule->id())?->description,
                    order: $rule->order(),
                ),
                $season->getTiebreakerRules()->rules()
            ),
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
                total_divisions: $aggregates['total_divisions'] ?? 0,
                total_teams: $aggregates['total_teams'] ?? 0,
                total_rounds: $aggregates['total_rounds'] ?? 0,
                completed_rounds: $aggregates['completed_rounds'] ?? 0,
            ),
        );
    }

    /**
     * Convert Spatie Media model to array representation
     *
     * @param Media|null $media
     * @return array{id: int, original: string, conversions: array<string, string>, srcset: string}|null
     */
    public static function mediaToArray(?Media $media): ?array
    {
        if ($media === null) {
            return null;
        }

        $conversions = [];
        $conversionNames = ['thumb', 'small', 'medium', 'large', 'og'];

        foreach ($conversionNames as $conversion) {
            try {
                $conversions[$conversion] = $media->getUrl($conversion);
            } catch (\Exception $e) {
                // Conversion may not exist yet (queued) or may not apply to this file type
                // Skip silently
            }
        }

        // Generate srcset for responsive images
        $srcsetParts = [];
        $widths = [
            'thumb' => '150w',
            'small' => '320w',
            'medium' => '640w',
            'large' => '1280w',
        ];

        foreach ($widths as $conversionName => $width) {
            if (isset($conversions[$conversionName])) {
                $srcsetParts[] = "{$conversions[$conversionName]} {$width}";
            }
        }

        return [
            'id' => $media->getKey(),
            'original' => $media->getUrl(),
            'conversions' => $conversions,
            'srcset' => implode(', ', $srcsetParts),
        ];
    }
}

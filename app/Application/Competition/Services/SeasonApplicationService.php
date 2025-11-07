<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Competition\DTOs\CreateSeasonData;
use App\Application\Competition\DTOs\SeasonCompetitionData;
use App\Application\Competition\DTOs\SeasonData;
use App\Application\Competition\DTOs\SeasonLeagueData;
use App\Application\Competition\DTOs\UpdateSeasonData;
use App\Domain\Competition\Entities\Season;
use App\Domain\Competition\Exceptions\CompetitionNotFoundException;
use App\Domain\Competition\Exceptions\SeasonNotFoundException;
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Domain\Competition\Repositories\RoundRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonDriverRepositoryInterface;
use App\Domain\Competition\Repositories\SeasonRepositoryInterface;
use App\Domain\Competition\ValueObjects\SeasonName;
use App\Domain\Competition\ValueObjects\SeasonSlug;
use App\Domain\Competition\ValueObjects\SeasonStatus;
use App\Domain\Division\Repositories\DivisionRepositoryInterface;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Domain\Team\Repositories\TeamRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

/**
 * Season Application Service.
 * Orchestrates season use cases and coordinates domain logic.
 *
 * Responsibilities:
 * - Transaction management
 * - Authorization checks
 * - DTO transformations
 * - Event dispatching
 * - File storage (logos, banners)
 */
final class SeasonApplicationService
{
    public function __construct(
        private readonly SeasonRepositoryInterface $seasonRepository,
        private readonly SeasonDriverRepositoryInterface $seasonDriverRepository,
        private readonly CompetitionRepositoryInterface $competitionRepository,
        private readonly LeagueRepositoryInterface $leagueRepository,
        private readonly DivisionRepositoryInterface $divisionRepository,
        private readonly TeamRepositoryInterface $teamRepository,
        private readonly RoundRepositoryInterface $roundRepository,
    ) {
    }

    /**
     * Create a new season.
     *
     * @throws CompetitionNotFoundException
     * @throws UnauthorizedException
     */
    public function createSeason(CreateSeasonData $data, int $userId): SeasonData
    {
        $logoPath = null;
        $bannerPath = null;

        try {
            return DB::transaction(function () use ($data, $userId, &$logoPath, &$bannerPath) {
                // 1. Validate competition exists
                $competition = $this->competitionRepository->findById($data->competition_id);

                // 2. Authorize (league owner)
                $this->authorizeLeagueOwner($competition, $userId);

                // 3. Generate unique slug
                $slug = $data->slug
                    ? SeasonSlug::from($data->slug)
                    : SeasonSlug::fromName($data->name);

                $uniqueSlug = $this->seasonRepository->generateUniqueSlug(
                    $slug->value(),
                    $data->competition_id
                );

                // 4. Handle logo upload
                if ($data->logo) {
                    $logoPath = $this->storeSeasonImage($data->logo, 'logo', null);
                }

                // 5. Handle banner upload
                if ($data->banner) {
                    $bannerPath = $this->storeSeasonImage($data->banner, 'banner', null);
                }

                // 6. Create season entity
                $season = Season::create(
                    competitionId: $data->competition_id,
                    name: SeasonName::from($data->name),
                    slug: SeasonSlug::from($uniqueSlug),
                    createdByUserId: $userId,
                    carClass: $data->car_class,
                    description: $data->description,
                    technicalSpecs: $data->technical_specs,
                    logoPath: $logoPath,
                    bannerPath: $bannerPath,
                    teamChampionshipEnabled: $data->team_championship_enabled,
                    raceDivisionsEnabled: $data->race_divisions_enabled,
                );

                // 7. Save via repository
                $this->seasonRepository->save($season);

                // 8. Record creation event and dispatch
                $league = $this->leagueRepository->findById($competition->leagueId());
                $season->recordCreationEvent($league->id() ?? 0);
                $this->dispatchEvents($season);

                // 9. Return SeasonData DTO
                return $this->toSeasonData($season, $competition->logoPath());
            });
        } catch (\Throwable $e) {
            // Cleanup uploaded files on failure
            if ($logoPath) {
                $this->deleteSeasonImage($logoPath);
            }
            if ($bannerPath) {
                $this->deleteSeasonImage($bannerPath);
            }
            throw $e;
        }
    }

    /**
     * Update an existing season.
     *
     * @throws SeasonNotFoundException
     * @throws UnauthorizedException
     */
    public function updateSeason(int $id, UpdateSeasonData $data, int $userId): SeasonData
    {
        return DB::transaction(function () use ($id, $data, $userId) {
            // 1. Find season
            $season = $this->seasonRepository->findById($id);

            // 2. Find competition for authorization
            $competition = $this->competitionRepository->findById($season->competitionId());

            // 3. Authorize (league owner)
            $this->authorizeLeagueOwner($competition, $userId);

            // 4. Update details
            $season->updateDetails(
                SeasonName::from($data->name),
                $data->car_class,
                $data->description,
                $data->technical_specs
            );

            // 5. Handle team championship toggle
            if ($data->team_championship_enabled !== null) {
                if ($data->team_championship_enabled) {
                    $season->enableTeamChampionship();
                } else {
                    $season->disableTeamChampionship();
                }
            }

            // 5b. Handle race divisions toggle
            if ($data->race_divisions_enabled !== null) {
                if ($data->race_divisions_enabled) {
                    $season->enableRaceDivisions();
                } else {
                    $season->disableRaceDivisions();
                }
            }

            // 6. Handle logo updates
            if ($data->remove_logo) {
                $this->deleteSeasonImage($season->logoPath());
                $season->updateBranding(null, $season->bannerPath());
            } elseif ($data->logo) {
                $this->deleteSeasonImage($season->logoPath());
                $logoPath = $this->storeSeasonImage($data->logo, 'logo', $season->id());
                $season->updateBranding($logoPath, $season->bannerPath());
            }

            // 7. Handle banner updates
            if ($data->remove_banner) {
                $this->deleteSeasonImage($season->bannerPath());
                $season->updateBranding($season->logoPath(), null);
            } elseif ($data->banner) {
                $this->deleteSeasonImage($season->bannerPath());
                $bannerPath = $this->storeSeasonImage($data->banner, 'banner', $season->id());
                $season->updateBranding($season->logoPath(), $bannerPath);
            }

            // 8. Save
            $this->seasonRepository->save($season);
            $this->dispatchEvents($season);

            // 9. Return DTO
            return $this->toSeasonData($season, $competition->logoPath());
        });
    }

    /**
     * Get season by ID.
     *
     * @throws SeasonNotFoundException
     */
    public function getSeason(int $id): SeasonData
    {
        $season = $this->seasonRepository->findById($id);
        $competition = $this->competitionRepository->findById($season->competitionId());

        return $this->toSeasonData($season, $competition->logoPath());
    }

    /**
     * Get all seasons for a competition.
     *
     * @return array<SeasonData>
     */
    public function getSeasonsByCompetition(int $competitionId): array
    {
        $seasons = $this->seasonRepository->findByCompetition($competitionId);
        $competition = $this->competitionRepository->findById($competitionId);

        return array_map(
            fn(Season $season) => $this->toSeasonData($season, $competition->logoPath()),
            $seasons
        );
    }

    /**
     * Delete a season (soft delete).
     *
     * @throws SeasonNotFoundException
     * @throws UnauthorizedException
     */
    public function deleteSeason(int $id, int $userId): void
    {
        DB::transaction(function () use ($id, $userId) {
            $season = $this->seasonRepository->findById($id);
            $competition = $this->competitionRepository->findById($season->competitionId());

            $this->authorizeLeagueOwner($competition, $userId);

            $season->delete();
            $this->seasonRepository->delete($season);
            $this->dispatchEvents($season);
        });
    }

    /**
     * Archive a season.
     *
     * @throws SeasonNotFoundException
     * @throws UnauthorizedException
     */
    public function archiveSeason(int $id, int $userId): SeasonData
    {
        return DB::transaction(function () use ($id, $userId) {
            $season = $this->seasonRepository->findById($id);
            $competition = $this->competitionRepository->findById($season->competitionId());

            $this->authorizeLeagueOwner($competition, $userId);

            $season->archive();
            $this->seasonRepository->save($season);
            $this->dispatchEvents($season);

            return $this->toSeasonData($season, $competition->logoPath());
        });
    }

    /**
     * Activate a season.
     *
     * @throws SeasonNotFoundException
     * @throws UnauthorizedException
     */
    public function activateSeason(int $id, int $userId): SeasonData
    {
        return DB::transaction(function () use ($id, $userId) {
            $season = $this->seasonRepository->findById($id);
            $competition = $this->competitionRepository->findById($season->competitionId());

            $this->authorizeLeagueOwner($competition, $userId);

            $season->activate();
            $this->seasonRepository->save($season);
            $this->dispatchEvents($season);

            return $this->toSeasonData($season, $competition->logoPath());
        });
    }

    /**
     * Complete a season.
     *
     * @throws SeasonNotFoundException
     * @throws UnauthorizedException
     */
    public function completeSeason(int $id, int $userId): SeasonData
    {
        return DB::transaction(function () use ($id, $userId) {
            $season = $this->seasonRepository->findById($id);
            $competition = $this->competitionRepository->findById($season->competitionId());

            $this->authorizeLeagueOwner($competition, $userId);

            $season->complete();
            $this->seasonRepository->save($season);
            $this->dispatchEvents($season);

            return $this->toSeasonData($season, $competition->logoPath());
        });
    }

    /**
     * Unarchive a season (restore from archived status).
     *
     * @throws SeasonNotFoundException
     * @throws UnauthorizedException
     */
    public function unarchiveSeason(int $id, int $userId): SeasonData
    {
        return DB::transaction(function () use ($id, $userId) {
            $season = $this->seasonRepository->findById($id);
            $competition = $this->competitionRepository->findById($season->competitionId());

            $this->authorizeLeagueOwner($competition, $userId);

            $season->restore();
            $this->seasonRepository->save($season);
            $this->dispatchEvents($season);

            return $this->toSeasonData($season, $competition->logoPath());
        });
    }

    /**
     * Restore a soft-deleted season.
     *
     * @throws SeasonNotFoundException
     * @throws UnauthorizedException
     */
    public function restoreSeason(int $id, int $userId): SeasonData
    {
        return DB::transaction(function () use ($id, $userId) {
            $season = $this->seasonRepository->findByIdWithTrashed($id);
            $competition = $this->competitionRepository->findById($season->competitionId());

            $this->authorizeLeagueOwner($competition, $userId);

            $this->seasonRepository->restore($id);

            // Reload the restored season
            $season = $this->seasonRepository->findById($id);

            return $this->toSeasonData($season, $competition->logoPath());
        });
    }

    /**
     * Check if slug is available for a season name.
     *
     * @return array{available: bool, slug: string, suggestion: string|null}
     */
    public function checkSlugAvailability(int $competitionId, string $name, ?int $excludeId = null): array
    {
        // Generate slug from name
        $baseSlug = SeasonSlug::fromName($name);

        // Check if slug is available
        $available = $this->seasonRepository->isSlugAvailable(
            $baseSlug->value(),
            $competitionId,
            $excludeId
        );

        $suggestion = null;
        if (!$available) {
            $suggestion = $this->seasonRepository->generateUniqueSlug(
                $baseSlug->value(),
                $competitionId,
                $excludeId
            );
        }

        return [
            'available' => $available,
            'slug' => $baseSlug->value(),
            'suggestion' => $suggestion,
        ];
    }

    /**
     * Store a season image (logo or banner).
     */
    private function storeSeasonImage($file, string $type, ?int $seasonId): string
    {
        $directory = $seasonId
            ? "seasons/{$seasonId}"
            : 'seasons/temp';

        $path = $file->store($directory, 'public');

        if (!$path) {
            throw new \RuntimeException("Failed to store season {$type}");
        }

        return $path;
    }

    /**
     * Delete a season image from storage.
     */
    private function deleteSeasonImage(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Convert Season entity to SeasonData DTO.
     */
    private function toSeasonData(Season $season, ?string $competitionLogoPath): SeasonData
    {
        // Get competition data
        $competition = $this->competitionRepository->findById($season->competitionId());

        // Get league data for breadcrumbs
        $league = $this->leagueRepository->findById($competition->leagueId());

        // Determine logo URL (season logo or inherit from competition)
        $logoUrl = $season->logoPath()
            ? Storage::disk('public')->url($season->logoPath())
            : ($competitionLogoPath ? Storage::disk('public')->url($competitionLogoPath) : null);

        $bannerUrl = $season->bannerPath()
            ? Storage::disk('public')->url($season->bannerPath())
            : null;

        // Get driver counts
        $totalDrivers = $this->seasonDriverRepository->countDriversInSeason($season->id() ?? 0);
        $activeDrivers = $this->seasonDriverRepository->countActiveDriversInSeason($season->id() ?? 0);

        // Get division and team counts
        $totalDivisions = count($this->divisionRepository->findBySeasonId($season->id() ?? 0));
        $totalTeams = count($this->teamRepository->findBySeasonId($season->id() ?? 0));

        // Get round counts
        $rounds = $this->roundRepository->findBySeasonId($season->id() ?? 0);
        $totalRounds = count($rounds);
        $completedRounds = count(array_filter($rounds, fn($round) => $round->status()->isCompleted()));

        // Build nested competition data with league
        $competitionData = new SeasonCompetitionData(
            id: $competition->id() ?? 0,
            name: $competition->name()->value(),
            slug: $competition->slug()->value(),
            platform_id: $competition->platformId(),
            competition_colour: $competition->competitionColour(),
            league: new SeasonLeagueData(
                id: $league->id() ?? 0,
                name: $league->name()->value(),
                slug: $league->slug()->value(),
            ),
        );

        return SeasonData::fromEntity(
            season: $season,
            competitionData: $competitionData,
            logoUrl: $logoUrl,
            bannerUrl: $bannerUrl,
            aggregates: [
                'total_drivers' => $totalDrivers,
                'active_drivers' => $activeDrivers,
                'total_races' => 0, // Races are part of rounds, count rounds instead
                'completed_races' => 0, // Races are part of rounds, count rounds instead
                'total_divisions' => $totalDivisions,
                'total_teams' => $totalTeams,
                'total_rounds' => $totalRounds,
                'completed_rounds' => $completedRounds,
            ]
        );
    }

    /**
     * Authorize that user is league owner.
     */
    private function authorizeLeagueOwner($competition, int $userId): void
    {
        $league = $this->leagueRepository->findById($competition->leagueId());

        if ($league->ownerUserId() !== $userId) {
            throw new UnauthorizedException('Only league owner can manage seasons');
        }
    }

    /**
     * Dispatch domain events.
     */
    private function dispatchEvents(Season $season): void
    {
        $events = $season->releaseEvents();

        foreach ($events as $event) {
            Event::dispatch($event);
        }
    }
}

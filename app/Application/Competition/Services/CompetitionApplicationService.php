<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Competition\DTOs\CompetitionData;
use App\Application\Competition\DTOs\CreateCompetitionData;
use App\Application\Competition\DTOs\UpdateCompetitionData;
use App\Domain\Competition\Entities\Competition;
use App\Domain\Competition\Exceptions\CompetitionNotFoundException;
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Domain\Competition\ValueObjects\CompetitionName;
use App\Domain\Competition\ValueObjects\CompetitionSlug;
use App\Domain\League\Exceptions\InvalidPlatformException;
use App\Domain\League\Exceptions\LeagueNotFoundException;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

/**
 * Competition Application Service.
 * Orchestrates competition use cases and coordinates domain logic.
 *
 * Responsibilities:
 * - Transaction management
 * - Authorization checks
 * - DTO transformations
 * - Event dispatching
 * - File storage
 */
final class CompetitionApplicationService
{
    public function __construct(
        private readonly CompetitionRepositoryInterface $competitionRepository,
        private readonly LeagueRepositoryInterface $leagueRepository,
    ) {
    }

    /**
     * Create a new competition.
     *
     * @throws LeagueNotFoundException
     * @throws UnauthorizedException
     * @throws InvalidPlatformException
     */
    public function createCompetition(CreateCompetitionData $data, int $userId): CompetitionData
    {
        return DB::transaction(function () use ($data, $userId) {
            // 1. Validate league exists and user owns it
            $league = $this->leagueRepository->findById($data->league_id);
            if ($league->ownerUserId() !== $userId) {
                throw new UnauthorizedException('Only league owner can create competitions');
            }

            // 2. Validate platform exists and is in league's platforms
            $this->validatePlatformForLeague($data->platform_id, $league->platformIds());

            // 3. Generate unique slug from name
            $baseSlug = CompetitionSlug::fromName($data->name);
            $uniqueSlug = $this->generateUniqueSlug($baseSlug, $data->league_id);

            // 4. Handle logo upload if provided
            $logoPath = null;
            if ($data->logo) {
                $logoPath = $data->logo->store('competitions/logos', 'public');
                if (!$logoPath) {
                    throw new \RuntimeException('Failed to store competition logo');
                }
            }

            // 5. Create competition entity
            $competition = Competition::create(
                leagueId: $data->league_id,
                name: CompetitionName::from($data->name),
                slug: $uniqueSlug,
                platformId: $data->platform_id,
                createdByUserId: $userId,
                description: $data->description,
                logoPath: $logoPath,
            );

            // 6. Save via repository
            $this->competitionRepository->save($competition);

            // 7. Record creation event and dispatch
            $competition->recordCreationEvent();
            $this->dispatchEvents($competition);

            // 8. Return CompetitionData DTO
            return $this->toCompetitionData($competition, $league->logoPath());
        });
    }

    /**
     * Update an existing competition.
     *
     * @throws CompetitionNotFoundException
     * @throws UnauthorizedException
     */
    public function updateCompetition(int $competitionId, UpdateCompetitionData $data, int $userId): CompetitionData
    {
        return DB::transaction(function () use ($competitionId, $data, $userId) {
            // 1. Find competition
            $competition = $this->competitionRepository->findById($competitionId);

            // 2. Authorize (league owner)
            $this->authorizeLeagueOwner($competition, $userId);

            // 3. Update name and description if provided
            if ($data->name !== null) {
                $newName = CompetitionName::from($data->name);

                // If name changes, update slug
                if (!$competition->name()->equals($newName)) {
                    $newSlug = $this->generateUniqueSlug(
                        CompetitionSlug::fromName($data->name),
                        $competition->leagueId(),
                        $competitionId
                    );
                    $competition->updateSlug($newSlug);
                }

                $competition->updateDetails($newName, $data->description ?? $competition->description());
            } elseif ($data->description !== null) {
                $competition->updateDetails($competition->name(), $data->description);
            }

            // 4. Update logo if provided (delete old, upload new)
            if ($data->logo) {
                // Delete old logo if exists and is not default
                if ($competition->logoPath()) {
                    Storage::disk('public')->delete($competition->logoPath());
                }

                $logoPath = $data->logo->store('competitions/logos', 'public');
                if (!$logoPath) {
                    throw new \RuntimeException('Failed to store competition logo');
                }

                $competition->updateLogo($logoPath);
            }

            // 5. Save
            $this->competitionRepository->update($competition);
            $this->dispatchEvents($competition);

            // 6. Get league for logo fallback
            $league = $this->leagueRepository->findById($competition->leagueId());

            // 7. Return DTO
            return $this->toCompetitionData($competition, $league->logoPath());
        });
    }

    /**
     * Get competition by ID.
     *
     * @throws CompetitionNotFoundException
     */
    public function getCompetitionById(int $id): CompetitionData
    {
        $competition = $this->competitionRepository->findById($id);
        $league = $this->leagueRepository->findById($competition->leagueId());

        return $this->toCompetitionData($competition, $league->logoPath());
    }

    /**
     * Get competition by slug and league ID.
     *
     * @throws CompetitionNotFoundException
     */
    public function getCompetitionBySlug(string $slug, int $leagueId): CompetitionData
    {
        $competition = $this->competitionRepository->findBySlug($slug, $leagueId);
        $league = $this->leagueRepository->findById($competition->leagueId());

        return $this->toCompetitionData($competition, $league->logoPath());
    }

    /**
     * Get all competitions for a league.
     *
     * @return array<CompetitionData>
     */
    public function getLeagueCompetitions(int $leagueId): array
    {
        $competitions = $this->competitionRepository->findByLeagueId($leagueId);
        $league = $this->leagueRepository->findById($leagueId);

        return array_map(
            fn(Competition $competition) => $this->toCompetitionData($competition, $league->logoPath()),
            $competitions
        );
    }

    /**
     * Archive a competition.
     *
     * @throws CompetitionNotFoundException
     * @throws UnauthorizedException
     */
    public function archiveCompetition(int $id, int $userId): void
    {
        DB::transaction(function () use ($id, $userId) {
            $competition = $this->competitionRepository->findById($id);
            $this->authorizeLeagueOwner($competition, $userId);

            $competition->archive();
            $this->competitionRepository->update($competition);
            $this->dispatchEvents($competition);
        });
    }

    /**
     * Delete a competition (soft delete).
     *
     * @throws CompetitionNotFoundException
     * @throws UnauthorizedException
     */
    public function deleteCompetition(int $id, int $userId): void
    {
        DB::transaction(function () use ($id, $userId) {
            $competition = $this->competitionRepository->findById($id);
            $this->authorizeLeagueOwner($competition, $userId);

            $competition->delete();
            $this->competitionRepository->delete($competition);
            $this->dispatchEvents($competition);
        });
    }

    /**
     * Check if a slug is available for a competition name.
     *
     * @return array{available: bool, slug: string, suggestion: string|null}
     */
    public function checkSlugAvailability(string $name, int $leagueId, ?int $excludeId = null): array
    {
        $baseSlug = CompetitionSlug::fromName($name);
        $isAvailable = $this->competitionRepository->isSlugAvailable(
            $baseSlug->value(),
            $leagueId,
            $excludeId
        );

        $suggestion = null;
        if (!$isAvailable) {
            $uniqueSlug = $this->generateUniqueSlug($baseSlug, $leagueId, $excludeId);
            $suggestion = $uniqueSlug->value();
        }

        return [
            'available' => $isAvailable,
            'slug' => $baseSlug->value(),
            'suggestion' => $suggestion,
        ];
    }

    /**
     * Generate a unique slug for the league.
     */
    private function generateUniqueSlug(
        CompetitionSlug $baseSlug,
        int $leagueId,
        ?int $excludeId = null
    ): CompetitionSlug {
        $slug = $baseSlug->value();
        $counter = 1;

        while (!$this->competitionRepository->isSlugAvailable($slug, $leagueId, $excludeId)) {
            $slug = $baseSlug->value() . '-' . $counter;
            $counter++;
        }

        return CompetitionSlug::from($slug);
    }

    /**
     * Validate platform exists and belongs to league.
     *
     * @param array<int> $leaguePlatformIds
     * @throws InvalidPlatformException
     */
    private function validatePlatformForLeague(int $platformId, array $leaguePlatformIds): void
    {
        // Check platform exists
        $platform = Platform::find($platformId);
        if (!$platform) {
            throw InvalidPlatformException::notFound($platformId);
        }

        // Check platform is in league's platforms
        if (!in_array($platformId, $leaguePlatformIds, true)) {
            throw InvalidPlatformException::notInLeague($platformId);
        }
    }

    /**
     * Authorize that the user owns the competition's league.
     *
     * @throws UnauthorizedException
     */
    private function authorizeLeagueOwner(Competition $competition, int $userId): void
    {
        $league = $this->leagueRepository->findById($competition->leagueId());

        if ($league->ownerUserId() !== $userId) {
            throw new UnauthorizedException('Only league owner can manage competitions');
        }
    }

    /**
     * Dispatch all domain events from the competition.
     */
    private function dispatchEvents(Competition $competition): void
    {
        $events = $competition->releaseEvents();

        foreach ($events as $event) {
            Event::dispatch($event);
        }
    }

    /**
     * Convert Competition entity to CompetitionData DTO.
     * Accepts league logo path to avoid re-fetching the league entity when already available.
     */
    private function toCompetitionData(Competition $competition, string $leagueLogoPath): CompetitionData
    {
        // Fetch league for additional data (we need more than just logo path now)
        $league = $this->leagueRepository->findById($competition->leagueId());

        $leagueData = [
            'id' => $league->id() ?? 0,
            'name' => $league->name()->value(),
            'slug' => $league->slug()->value(),
        ];

        // Get platform data
        $platform = Platform::findOrFail($competition->platformId());
        $platformData = [
            'id' => $platform->id,
            'name' => $platform->name,
            'slug' => $platform->slug,
        ];

        // Resolve logo URL with fallback to league logo
        $logoUrl = $this->resolveLogoUrl($competition, $leagueLogoPath);

        // Return DTO
        return CompetitionData::fromEntity(
            competition: $competition,
            platformData: $platformData,
            logoUrl: $logoUrl,
            leagueData: $leagueData,
        );
    }

    /**
     * Resolve logo URL with fallback to league logo.
     */
    private function resolveLogoUrl(Competition $competition, string $leagueLogoPath): string
    {
        if ($competition->logoPath()) {
            // @phpstan-ignore-next-line (url() method exists on LocalFilesystemAdapter)
            return Storage::disk('public')->url($competition->logoPath());
        }

        // Fallback to league logo
        // @phpstan-ignore-next-line (url() method exists on LocalFilesystemAdapter)
        return Storage::disk('public')->url($leagueLogoPath);
    }
}

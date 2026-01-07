<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\CreateSeasonData;
use App\Application\Competition\DTOs\UpdateSeasonData;
use App\Application\Competition\Services\SeasonApplicationService;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\ArchiveSeasonRequest;
use App\Http\Requests\User\CompleteSeasonRequest;
use App\Http\Requests\User\CreateSeasonRequest;
use App\Http\Requests\User\UpdateSeasonRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Season Controller.
 * Thin controller for season management (3-5 lines per method).
 * Activity logging handled via domain events and listeners.
 */
final class SeasonController extends Controller
{
    public function __construct(
        private readonly SeasonApplicationService $seasonService
    ) {
    }

    /**
     * Get authenticated user ID with validation.
     *
     * @throws UnauthorizedException if user is not authenticated
     */
    private function getAuthenticatedUserId(): int
    {
        $userId = Auth::id();
        if ($userId === null) {
            throw UnauthorizedException::notAuthenticated();
        }
        return (int) $userId;
    }

    /**
     * List all seasons for a competition.
     */
    public function index(int $competitionId): JsonResponse
    {
        $seasons = $this->seasonService->getSeasonsByCompetition($competitionId);
        return ApiResponse::success($seasons);
    }

    /**
     * Create a new season.
     */
    public function store(CreateSeasonRequest $request, int $competitionId): JsonResponse
    {
        $data = CreateSeasonData::from($request->validated());
        $seasonData = $this->seasonService->createSeason($data, $this->getAuthenticatedUserId());
        return ApiResponse::created($seasonData->toArray(), 'Season created successfully');
    }

    /**
     * Show a single season.
     */
    public function show(int $id): JsonResponse
    {
        $season = $this->seasonService->getSeason($id);
        return ApiResponse::success($season->toArray());
    }

    /**
     * Update a season.
     */
    public function update(UpdateSeasonRequest $request, int $id): JsonResponse
    {
        $data = UpdateSeasonData::from($request->validated());
        $seasonData = $this->seasonService->updateSeason(
            $id,
            $data,
            $this->getAuthenticatedUserId(),
            $request->validated()
        );
        return ApiResponse::success($seasonData->toArray(), 'Season updated successfully');
    }

    /**
     * Delete a season (soft delete).
     */
    public function destroy(int $id): JsonResponse
    {
        $this->seasonService->deleteSeason($id, $this->getAuthenticatedUserId());
        return ApiResponse::success(null, 'Season deleted successfully');
    }

    /**
     * Archive a season.
     */
    public function archive(ArchiveSeasonRequest $request, int $id): JsonResponse
    {
        $seasonData = $this->seasonService->archiveSeason($id, $this->getAuthenticatedUserId());
        return ApiResponse::success($seasonData->toArray(), 'Season archived successfully');
    }

    /**
     * Unarchive a season.
     */
    public function unarchive(int $id): JsonResponse
    {
        $season = $this->seasonService->unarchiveSeason($id, $this->getAuthenticatedUserId());
        return ApiResponse::success($season->toArray(), 'Season unarchived successfully');
    }

    /**
     * Activate a season.
     */
    public function activate(int $id): JsonResponse
    {
        $season = $this->seasonService->activateSeason($id, $this->getAuthenticatedUserId());
        return ApiResponse::success($season->toArray(), 'Season activated successfully');
    }

    /**
     * Complete a season.
     */
    public function complete(CompleteSeasonRequest $request, int $id): JsonResponse
    {
        $seasonData = $this->seasonService->completeSeason($id, $this->getAuthenticatedUserId());
        return ApiResponse::success($seasonData->toArray(), 'Season completed successfully');
    }

    /**
     * Restore a soft-deleted season.
     */
    public function restore(int $id): JsonResponse
    {
        $season = $this->seasonService->restoreSeason($id, $this->getAuthenticatedUserId());
        return ApiResponse::success($season->toArray(), 'Season restored successfully');
    }

    /**
     * Check slug availability for a season name.
     */
    public function checkSlug(Request $request, int $competitionId): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3|max:100',
            'exclude_id' => 'nullable|integer',
        ]);

        $result = $this->seasonService->checkSlugAvailability(
            $competitionId,
            $validated['name'],
            $validated['exclude_id'] ?? null
        );

        return ApiResponse::success($result);
    }

    /**
     * Get season standings (cumulative across all completed rounds).
     */
    public function standings(int $id): JsonResponse
    {
        $standings = $this->seasonService->getSeasonStandings($id);
        return ApiResponse::success($standings);
    }
}

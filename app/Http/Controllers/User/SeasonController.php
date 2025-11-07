<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\CreateSeasonData;
use App\Application\Competition\DTOs\UpdateSeasonData;
use App\Application\Competition\Services\SeasonApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Season Controller.
 * Thin controller for season management (3-5 lines per method).
 */
final class SeasonController extends Controller
{
    public function __construct(
        private readonly SeasonApplicationService $seasonService
    ) {
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
    public function store(Request $request, int $competitionId): JsonResponse
    {
        $userId = Auth::id();
        if ($userId === null) {
            throw new \RuntimeException('User must be authenticated');
        }

        $validated = $request->validate(CreateSeasonData::rules());
        $validated['competition_id'] = $competitionId;

        $data = CreateSeasonData::from($validated);
        $season = $this->seasonService->createSeason($data, (int) $userId);

        return ApiResponse::created($season->toArray(), 'Season created successfully');
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
    public function update(Request $request, int $id): JsonResponse
    {
        $userId = Auth::id();
        if ($userId === null) {
            throw new \RuntimeException('User must be authenticated');
        }

        $validated = $request->validate(UpdateSeasonData::rules());

        $data = UpdateSeasonData::from($validated);
        $season = $this->seasonService->updateSeason($id, $data, (int) $userId);

        return ApiResponse::success($season->toArray(), 'Season updated successfully');
    }

    /**
     * Delete a season (soft delete).
     */
    public function destroy(int $id): JsonResponse
    {
        $userId = Auth::id();
        if ($userId === null) {
            throw new \RuntimeException('User must be authenticated');
        }

        $this->seasonService->deleteSeason($id, (int) $userId);
        return ApiResponse::success(null, 'Season deleted successfully');
    }

    /**
     * Archive a season.
     */
    public function archive(int $id): JsonResponse
    {
        $userId = Auth::id();
        if ($userId === null) {
            throw new \RuntimeException('User must be authenticated');
        }

        $season = $this->seasonService->archiveSeason($id, (int) $userId);
        return ApiResponse::success($season->toArray(), 'Season archived successfully');
    }

    /**
     * Unarchive a season.
     */
    public function unarchive(int $id): JsonResponse
    {
        $userId = Auth::id();
        if ($userId === null) {
            throw new \RuntimeException('User must be authenticated');
        }

        $season = $this->seasonService->unarchiveSeason($id, (int) $userId);
        return ApiResponse::success($season->toArray(), 'Season unarchived successfully');
    }

    /**
     * Activate a season.
     */
    public function activate(int $id): JsonResponse
    {
        $userId = Auth::id();
        if ($userId === null) {
            throw new \RuntimeException('User must be authenticated');
        }

        $season = $this->seasonService->activateSeason($id, (int) $userId);
        return ApiResponse::success($season->toArray(), 'Season activated successfully');
    }

    /**
     * Complete a season.
     */
    public function complete(int $id): JsonResponse
    {
        $userId = Auth::id();
        if ($userId === null) {
            throw new \RuntimeException('User must be authenticated');
        }

        $season = $this->seasonService->completeSeason($id, (int) $userId);
        return ApiResponse::success($season->toArray(), 'Season completed successfully');
    }

    /**
     * Restore a soft-deleted season.
     */
    public function restore(int $id): JsonResponse
    {
        $userId = Auth::id();
        if ($userId === null) {
            throw new \RuntimeException('User must be authenticated');
        }

        $season = $this->seasonService->restoreSeason($id, (int) $userId);
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
}

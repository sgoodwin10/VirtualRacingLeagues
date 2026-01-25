<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Activity\Services\LeagueActivityLogService;
use App\Application\Competition\DTOs\BulkRaceResultsData;
use App\Application\Competition\Services\RaceResultApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\BulkRaceResultsRequest;
use App\Infrastructure\Persistence\Eloquent\Models\Race;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

final class RaceResultController extends Controller
{
    public function __construct(
        private RaceResultApplicationService $raceResultService,
        private readonly LeagueActivityLogService $activityLogService
    ) {
    }

    /**
     * Get all results for a race.
     */
    public function index(int $raceId): JsonResponse
    {
        $results = $this->raceResultService->getResultsForRace($raceId);

        return ApiResponse::success($results);
    }

    /**
     * Save/update results for a race (bulk operation).
     */
    public function store(BulkRaceResultsRequest $request, int $raceId): JsonResponse
    {
        $data = BulkRaceResultsData::from($request->validated());
        $results = $this->raceResultService->saveResults($raceId, $data);

        // Log activity
        try {
            $user = Auth::user();
            if ($user instanceof UserEloquent) {
                $race = Race::findOrFail($raceId);
                $resultCount = count($results);
                $this->activityLogService->logRaceResultsEntered($user, $race, $resultCount);
            }
        } catch (\Exception $e) {
            Log::error('Failed to log race results entry activity', [
                'error' => $e->getMessage(),
                'race_id' => $raceId,
            ]);
        }

        return ApiResponse::created($results);
    }

    /**
     * Delete all results for a race.
     */
    public function destroy(int $raceId): JsonResponse
    {
        $this->raceResultService->deleteResults($raceId);

        return ApiResponse::noContent();
    }
}

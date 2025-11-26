<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\BulkRaceResultsData;
use App\Application\Competition\Services\RaceResultApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\BulkRaceResultsRequest;
use Illuminate\Http\JsonResponse;

final class RaceResultController extends Controller
{
    public function __construct(
        private RaceResultApplicationService $raceResultService,
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

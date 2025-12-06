<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Application\League\Services\LeagueApplicationService;
use App\Domain\League\Exceptions\LeagueNotFoundException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexLeaguesRequest;
use Illuminate\Http\JsonResponse;

/**
 * Admin League Controller.
 * Thin controller that delegates to the application service.
 */
final class AdminLeagueController extends Controller
{
    public function __construct(
        private readonly LeagueApplicationService $leagueService,
    ) {
    }

    /**
     * Display a listing of all leagues (admin view).
     */
    public function index(IndexLeaguesRequest $request): JsonResponse
    {
        $result = $this->leagueService->getAllLeaguesForAdmin($request);

        // PHPStan: Assert the array structure from the request-based call
        /** @var array{data: array<int, mixed>, meta: array<string, int>, links: array<string, string|null>} $result */

        return ApiResponse::paginated($result['data'], $result['meta'], $result['links']);
    }

    /**
     * Display the specified league (admin view).
     */
    public function show(int $id): JsonResponse
    {
        try {
            $leagueData = $this->leagueService->getLeagueForAdmin($id);
            return ApiResponse::success($leagueData->toArray());
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Display detailed league information (admin view).
     * Includes competitions, seasons summary, and statistics.
     */
    public function details(int $id): JsonResponse
    {
        try {
            $leagueDetails = $this->leagueService->getLeagueDetailsForAdmin($id);
            return ApiResponse::success($leagueDetails->toArray());
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Archive the specified league.
     */
    public function archive(int $id): JsonResponse
    {
        try {
            $leagueData = $this->leagueService->archiveLeague($id);
            return ApiResponse::success($leagueData->toArray(), 'League archived successfully');
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Remove the specified league (placeholder - does nothing for now).
     * TODO: Implement permanent delete for archived leagues.
     */
    public function destroy(int $id): JsonResponse
    {
        // Placeholder - just return 204 No Content for now
        return ApiResponse::noContent();
    }
}

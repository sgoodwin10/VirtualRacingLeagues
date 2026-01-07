<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Activity\Services\LeagueActivityLogService;
use App\Helpers\ApiResponse;
use App\Http\Requests\User\ListActivityLogsRequest;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use Illuminate\Http\JsonResponse;

/**
 * Controller for league activity logs.
 *
 * Provides API endpoints for viewing activities within a league.
 */
class LeagueActivityLogController
{
    public function __construct(
        private readonly LeagueActivityLogService $activityLogService
    ) {
    }

    /**
     * Get activities for a league.
     *
     * Query parameters:
     * - limit (int): Number of activities to return (default: 50, max: 100)
     * - page (int): Page number for pagination (default: 1)
     * - entity_type (string): Filter by entity type
     * - action (string): Filter by action type
     * - from_date (string): Filter from date (ISO 8601)
     * - to_date (string): Filter to date (ISO 8601)
     *
     * @param ListActivityLogsRequest $request
     * @param League $league
     * @return JsonResponse
     */
    public function index(ListActivityLogsRequest $request, League $league): JsonResponse
    {
        $filters = $request->getFilters();
        $total = $this->activityLogService->countActivities($league, $filters);
        $data = $this->activityLogService->getActivities($league, $filters);

        return $this->buildPaginatedResponse($league, $data, $total, $request->getLimit(), $request->getPage());
    }

    /**
     * Get a single activity by ID.
     *
     * @param League $league
     * @param int $activityId
     * @return JsonResponse
     */
    public function show(League $league, int $activityId): JsonResponse
    {
        if ($league->owner_user_id !== auth()->id()) {
            return ApiResponse::forbidden('You do not have permission to view this league\'s activities.');
        }

        $activity = $this->activityLogService->getActivityById($league, $activityId);

        if ($activity === null) {
            return ApiResponse::notFound('Activity not found');
        }

        return ApiResponse::success($activity);
    }

    /**
     * Build paginated response for activities.
     *
     * @param League $league
     * @param array<int, array<string, mixed>> $data
     * @param int $total
     * @param int $limit
     * @param int $page
     * @return JsonResponse
     */
    private function buildPaginatedResponse(
        League $league,
        array $data,
        int $total,
        int $limit,
        int $page
    ): JsonResponse {
        $offset = ($page - 1) * $limit;
        $lastPage = $total > 0 ? (int) ceil($total / $limit) : 1;

        return ApiResponse::paginated(
            $data,
            [
                'total' => $total,
                'per_page' => $limit,
                'current_page' => $page,
                'last_page' => $lastPage,
                'from' => $total > 0 ? $offset + 1 : 0,
                'to' => min($offset + $limit, $total),
            ],
            [
                'first' => url("/api/leagues/{$league->id}/activities?page=1&limit={$limit}"),
                'last' => url(
                    "/api/leagues/{$league->id}/activities?page={$lastPage}&limit={$limit}"
                ),
                'prev' => $page > 1
                    ? url("/api/leagues/{$league->id}/activities?page=" . ($page - 1) . "&limit={$limit}")
                    : null,
                'next' => $page < $lastPage
                    ? url("/api/leagues/{$league->id}/activities?page=" . ($page + 1) . "&limit={$limit}")
                    : null,
            ]
        );
    }
}

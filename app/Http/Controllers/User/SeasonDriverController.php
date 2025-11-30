<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\AddSeasonDriverData;
use App\Application\Competition\DTOs\UpdateSeasonDriverData;
use App\Application\Competition\Services\SeasonDriverApplicationService;
use App\Helpers\ApiResponse;
use App\Helpers\PaginationHelper;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * SeasonDriver Controller.
 * Thin controller for season-driver management (3-5 lines per method).
 */
final class SeasonDriverController extends Controller
{
    public function __construct(
        private readonly SeasonDriverApplicationService $seasonDriverService
    ) {
    }

    /**
     * List all drivers in a season.
     * Supports pagination with query parameters:
     * - page: page number (default: 1)
     * - per_page: items per page (default: 10, max: 100)
     * - search: search by driver name
     * - status: filter by status (active, reserve, withdrawn)
     * - division_id: filter by division ID (optional)
     * - team_id: filter by team ID (optional)
     * - order_by: sort column (added_at, status, driver_name, discord_id, psn_id, iracing_id,
     *            driver_number, division_name, team_name)
     * - order_direction: sort direction (asc, desc)
     */
    public function index(Request $request, int $seasonId): JsonResponse
    {
        $validated = $request->validate([
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:active,reserve,withdrawn',
            'division_id' => ['nullable', 'integer', function (string $attribute, mixed $value, \Closure $fail): void {
                // Allow 0 as special value for "no division" filter
                $intValue = (int) $value;
                if ($intValue !== 0 && $value !== null) {
                    $exists = \Illuminate\Support\Facades\DB::table('divisions')->where('id', $intValue)->exists();
                    if (!$exists) {
                        $fail('The selected division id is invalid.');
                    }
                }
            }],
            'team_id' => ['nullable', 'integer', function (string $attribute, mixed $value, \Closure $fail): void {
                // Allow 0 as special value for "no team" (privateer) filter
                $intValue = (int) $value;
                if ($intValue !== 0 && $value !== null) {
                    $exists = \Illuminate\Support\Facades\DB::table('teams')->where('id', $intValue)->exists();
                    if (!$exists) {
                        $fail('The selected team id is invalid.');
                    }
                }
            }],
            'order_by' => 'nullable|string|in:added_at,status,driver_name,discord_id,psn_id,' .
                'iracing_id,driver_number,division_name,team_name',
            'order_direction' => 'nullable|string|in:asc,desc',
        ]);

        $result = $this->seasonDriverService->getSeasonDriversPaginated($seasonId, array_merge($validated, [
            'page' => $request->input('page', 1),
        ]));

        // Build pagination links
        $links = PaginationHelper::buildLinks(
            $request,
            $result['meta']['current_page'],
            $result['meta']['last_page']
        );

        return ApiResponse::paginated(
            array_map(fn($item) => $item->toArray(), $result['data']),
            $result['meta'],
            $links
        );
    }

    /**
     * Add a driver to a season.
     */
    public function store(Request $request, int $seasonId): JsonResponse
    {
        $validated = $request->validate(AddSeasonDriverData::rules());

        $data = AddSeasonDriverData::from($validated);
        $driver = $this->seasonDriverService->addDriverToSeason($seasonId, $data, (int) (Auth::id() ?? 0));

        return ApiResponse::created($driver->toArray(), 'Driver added to season successfully');
    }

    /**
     * Update a season driver.
     */
    public function update(Request $request, int $seasonId, int $leagueDriverId): JsonResponse
    {
        $validated = $request->validate(UpdateSeasonDriverData::rules());

        $data = UpdateSeasonDriverData::from($validated);
        $driver = $this->seasonDriverService->updateSeasonDriver(
            $seasonId,
            $leagueDriverId,
            $data,
            (int) (Auth::id() ?? 0)
        );

        return ApiResponse::success($driver->toArray(), 'Season driver updated successfully');
    }

    /**
     * Remove a driver from a season.
     */
    public function destroy(int $seasonId, int $leagueDriverId): JsonResponse
    {
        $this->seasonDriverService->removeDriverFromSeason($seasonId, $leagueDriverId, (int) (Auth::id() ?? 0));
        return ApiResponse::success(null, 'Driver removed from season successfully');
    }

    /**
     * Bulk add drivers to a season.
     */
    public function bulk(Request $request, int $seasonId): JsonResponse
    {
        $validated = $request->validate([
            'league_driver_ids' => 'required|array|min:1',
            'league_driver_ids.*' => 'required|integer|exists:league_drivers,id',
        ]);

        $drivers = $this->seasonDriverService->addDriversToSeason(
            $seasonId,
            $validated['league_driver_ids'],
            (int) (Auth::id() ?? 0)
        );

        return ApiResponse::success($drivers, 'Drivers added to season successfully');
    }

    /**
     * Get season driver statistics.
     */
    public function stats(int $seasonId): JsonResponse
    {
        $stats = $this->seasonDriverService->getSeasonDriverStats($seasonId);
        return ApiResponse::success($stats);
    }

    /**
     * Get available drivers (not yet in season).
     * Supports pagination with query parameters:
     * - page: page number (default: 1)
     * - per_page: items per page (default: 10, max: 100)
     * - search: search by driver name
     * - league_id: league ID for validation (optional, derived from season if not provided)
     */
    public function available(Request $request, int $seasonId): JsonResponse
    {
        $validated = $request->validate([
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'search' => 'nullable|string|max:255',
            'league_id' => 'nullable|integer|exists:leagues,id',
        ]);

        $result = $this->seasonDriverService->getAvailableDriversPaginated($seasonId, array_merge($validated, [
            'page' => $request->input('page', 1),
        ]));

        // Build pagination links
        $baseUrl = $request->url();
        $queryParams = $request->except('page');
        $lastPage = $result['meta']['last_page'];
        $currentPage = $result['meta']['current_page'];

        $firstPage = $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => 1]));
        $lastPageUrl = $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $lastPage]));
        $prevPage = $currentPage > 1
            ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage - 1]))
            : null;
        $nextPage = $currentPage < $lastPage
            ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage + 1]))
            : null;

        return ApiResponse::paginated(
            $result['data'],
            $result['meta'],
            [
                'first' => $firstPage,
                'last' => $lastPageUrl,
                'prev' => $prevPage,
                'next' => $nextPage,
            ]
        );
    }
}

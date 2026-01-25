<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\AddSeasonDriverData;
use App\Application\Competition\DTOs\UpdateSeasonDriverData;
use App\Application\Competition\Services\SeasonDriverApplicationService;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Helpers\ApiResponse;
use App\Helpers\PaginationHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\AddSeasonDriverRequest;
use App\Http\Requests\User\AvailableDriversRequest;
use App\Http\Requests\User\BulkAddSeasonDriversRequest;
use App\Http\Requests\User\ListSeasonDriversRequest;
use App\Http\Requests\User\UpdateSeasonDriverRequest;
use Illuminate\Http\JsonResponse;
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
     */
    public function index(ListSeasonDriversRequest $request, int $seasonId): JsonResponse
    {
        $result = $this->seasonDriverService->getSeasonDriversPaginated($seasonId, array_merge($request->validated(), [
            'page' => $request->input('page', 1),
        ]));
        $links = PaginationHelper::buildLinks(
            $request,
            $result['meta']['current_page'],
            $result['meta']['last_page']
        );

        return ApiResponse::paginated(
            array_map(fn ($item) => $item->toArray(), $result['data']),
            $result['meta'],
            $links
        );
    }

    /**
     * Add a driver to a season.
     */
    public function store(AddSeasonDriverRequest $request, int $seasonId): JsonResponse
    {
        $data = AddSeasonDriverData::from($request->validated());
        $driverData = $this->seasonDriverService->addDriverToSeason(
            $seasonId,
            $data,
            $this->getAuthenticatedUserId()
        );

        return ApiResponse::created($driverData->toArray(), 'Driver added to season successfully');
    }

    /**
     * Update a season driver.
     */
    public function update(UpdateSeasonDriverRequest $request, int $seasonId, int $leagueDriverId): JsonResponse
    {
        $data = UpdateSeasonDriverData::from($request->validated());
        $driver = $this->seasonDriverService->updateSeasonDriver(
            $seasonId,
            $leagueDriverId,
            $data,
            $this->getAuthenticatedUserId()
        );

        return ApiResponse::success($driver->toArray(), 'Season driver updated successfully');
    }

    /**
     * Remove a driver from a season.
     */
    public function destroy(int $seasonId, int $leagueDriverId): JsonResponse
    {
        $this->seasonDriverService->removeDriverFromSeason(
            $seasonId,
            $leagueDriverId,
            $this->getAuthenticatedUserId()
        );

        return ApiResponse::success(null, 'Driver removed from season successfully');
    }

    /**
     * Bulk add drivers to a season.
     */
    public function bulk(BulkAddSeasonDriversRequest $request, int $seasonId): JsonResponse
    {
        $drivers = $this->seasonDriverService->addDriversToSeason(
            $seasonId,
            $request->validated()['league_driver_ids'],
            $this->getAuthenticatedUserId()
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
     */
    public function available(AvailableDriversRequest $request, int $seasonId): JsonResponse
    {
        $result = $this->seasonDriverService->getAvailableDriversPaginated(
            $seasonId,
            array_merge($request->validated(), ['page' => $request->input('page', 1)])
        );
        $links = PaginationHelper::buildLinks(
            $request,
            $result['meta']['current_page'],
            $result['meta']['last_page']
        );

        return ApiResponse::paginated($result['data'], $result['meta'], $links);
    }

    /**
     * Get authenticated user ID.
     *
     * @throws UnauthorizedException
     */
    private function getAuthenticatedUserId(): int
    {
        $userId = Auth::id();
        if ($userId === null) {
            throw UnauthorizedException::notAuthenticated();
        }

        return (int) $userId;
    }
}

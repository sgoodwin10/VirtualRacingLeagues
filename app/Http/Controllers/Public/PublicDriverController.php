<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Application\League\Services\LeagueApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Public Driver Controller.
 * Handles public-facing driver API endpoints (no authentication required).
 */
final class PublicDriverController extends Controller
{
    public function __construct(
        private readonly LeagueApplicationService $leagueService
    ) {
    }

    /**
     * Get driver profile by season_driver_id.
     *
     * @param int $seasonDriverId The season driver ID
     * @return JsonResponse
     */
    public function show(int $seasonDriverId): JsonResponse
    {
        $driverProfile = $this->leagueService->getPublicDriverProfile($seasonDriverId);

        if ($driverProfile === null) {
            return ApiResponse::error('Driver not found', null, 404);
        }

        return ApiResponse::success($driverProfile->toArray());
    }
}

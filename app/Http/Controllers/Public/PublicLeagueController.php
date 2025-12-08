<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Application\League\Services\LeagueApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\IndexPublicLeaguesRequest;
use Illuminate\Http\JsonResponse;

/**
 * Public League Controller.
 * Handles public-facing league API endpoints (no authentication required).
 */
final class PublicLeagueController extends Controller
{
    public function __construct(
        private readonly LeagueApplicationService $leagueService
    ) {
    }

    /**
     * Get paginated public leagues.
     */
    public function index(IndexPublicLeaguesRequest $request): JsonResponse
    {
        $result = $this->leagueService->getPublicLeagues(
            $request->getPage(),
            $request->getPerPage(),
            $request->getFilters()
        );

        return ApiResponse::success($result);
    }
}

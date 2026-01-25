<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Application\Platform\Services\PlatformApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Public Platform Controller.
 * Handles public-facing platform API endpoints (no authentication required).
 */
final class PublicPlatformController extends Controller
{
    public function __construct(
        private readonly PlatformApplicationService $platformService,
    ) {
    }

    /**
     * Get all active platforms.
     */
    public function index(): JsonResponse
    {
        $platforms = $this->platformService->getAllActivePlatforms();

        return ApiResponse::success($platforms);
    }
}

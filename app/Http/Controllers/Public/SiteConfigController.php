<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Application\Admin\Services\SiteConfigApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Public Site Configuration Controller.
 * Handles public-facing site configuration API endpoints (no authentication required).
 */
final class SiteConfigController extends Controller
{
    public function __construct(
        private readonly SiteConfigApplicationService $siteConfigService
    ) {
    }

    /**
     * Get public site configuration values.
     * Returns only the configuration values that are safe to expose publicly.
     * Also includes whether the user is an admin (for maintenance mode bypass).
     */
    public function show(): JsonResponse
    {
        $config = $this->siteConfigService->getConfiguration();

        $publicConfig = [
            'user_registration_enabled' => $config->isUserRegistrationEnabled(),
            'discord_url' => $config->discordLink(),
            'maintenance_mode' => $config->isMaintenanceMode(),
            'is_admin' => auth()->guard('admin')->check(),
        ];

        return ApiResponse::success($publicConfig);
    }
}

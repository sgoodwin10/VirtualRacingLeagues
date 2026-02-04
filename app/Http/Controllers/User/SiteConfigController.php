<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Admin\Services\SiteConfigApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class SiteConfigController extends Controller
{
    public function __construct(
        private readonly SiteConfigApplicationService $siteConfigService
    ) {
    }

    /**
     * Get site configuration for authenticated users.
     * Returns configuration values for the user dashboard.
     * Includes whether the user is an admin (for maintenance mode bypass).
     */
    public function show(): JsonResponse
    {
        $config = $this->siteConfigService->getConfiguration();

        $userConfig = [
            'user_registration_enabled' => $config->isUserRegistrationEnabled(),
            'discord_url' => $config->discordLink(),
            'maintenance_mode' => $config->isMaintenanceMode(),
            'is_admin' => auth()->guard('admin')->check(),
        ];

        return ApiResponse::success($userConfig);
    }
}

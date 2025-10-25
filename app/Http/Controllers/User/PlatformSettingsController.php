<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class PlatformSettingsController extends Controller
{
    public function getRaceSettings(int $platformId): JsonResponse
    {
        // Determine platform slug based on platformId
        $platformSlug = $this->getPlatformSlug($platformId);

        // Load config file directly from subdirectory
        $configPath = config_path("race_settings/{$platformSlug}.php");

        if (!file_exists($configPath)) {
            return ApiResponse::error('Platform settings not found', null, 404);
        }

        /** @var array<string, mixed> $settings */
        $settings = require $configPath;

        return ApiResponse::success($settings);
    }

    /**
     * Map platform IDs to configuration slugs.
     * TODO: Fetch from platforms table when available.
     *
     * @return string
     */
    private function getPlatformSlug(int $platformId): string
    {
        $mapping = [
            1 => 'gt7',
            2 => 'acc',
            3 => 'iracing',
        ];

        return $mapping[$platformId] ?? 'gt7';
    }
}

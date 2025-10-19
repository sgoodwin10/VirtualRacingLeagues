<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class SiteConfigController extends Controller
{
    /**
     * Get public site configuration.
     */
    public function show(): JsonResponse
    {
        $config = [
            'site_name' => config('app.name'),
            'site_url' => config('app.url'),
            'timezone' => config('app.timezone'),
            'locale' => config('app.locale'),
            'google_analytics_id' => config('services.google_analytics.tracking_id'),
        ];

        return ApiResponse::success($config);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use DateTimeZone;
use Illuminate\Http\JsonResponse;

class TimezoneController extends Controller
{
    /**
     * Get all available timezones.
     */
    public function index(): JsonResponse
    {
        $timezones = DateTimeZone::listIdentifiers();

        $formattedTimezones = array_map(function ($timezone) {
            return [
                'value' => $timezone,
                'label' => $timezone,
            ];
        }, $timezones);

        return ApiResponse::success($formattedTimezones);
    }
}

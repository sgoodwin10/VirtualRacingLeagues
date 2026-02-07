<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use Illuminate\Http\JsonResponse;

class RecaptchaConfigController extends Controller
{
    public function show(): JsonResponse
    {
        return ApiResponse::success([
            'enabled' => config('recaptchav3.enabled', true),
            'siteKey' => config('recaptchav3.enabled', true)
                ? config('recaptchav3.sitekey', '')
                : null,
        ]);
    }
}

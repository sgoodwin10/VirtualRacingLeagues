<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use Illuminate\Http\JsonResponse;

class PlatformController extends Controller
{
    /**
     * Get all active platforms.
     */
    public function index(): JsonResponse
    {
        $platforms = Platform::active()->ordered()->get(['id', 'name', 'slug']);

        return ApiResponse::success($platforms);
    }
}

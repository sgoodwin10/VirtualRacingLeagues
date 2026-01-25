<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Application\Platform\Services\CarImportService;
use App\Domain\Platform\Exceptions\PlatformNotFoundException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * Admin Platform Car Controller.
 * Thin controller - delegates to application service.
 */
final class AdminPlatformCarController extends Controller
{
    public function __construct(
        private readonly CarImportService $importService
    ) {
    }

    /**
     * Import GT7 cars from KudosPrime.
     *
     * @throws \JsonException
     */
    public function import(): JsonResponse
    {
        try {
            $result = $this->importService->importGT7Cars();

            return ApiResponse::success(
                $result->toArray(),
                'GT7 cars imported successfully'
            );
        } catch (PlatformNotFoundException $e) {
            return ApiResponse::notFound($e->getMessage());
        } catch (\Exception $e) {
            Log::error('GT7 car import failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return ApiResponse::error(
                'Failed to import GT7 cars. Please try again later.',
                null,
                500
            );
        }
    }
}

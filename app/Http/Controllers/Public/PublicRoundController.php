<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Application\Competition\Services\RoundApplicationService;
use App\Domain\Competition\Exceptions\RoundNotFoundException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\ShowPublicRoundResultsRequest;
use Illuminate\Http\JsonResponse;

/**
 * Public Round Controller.
 * Handles public-facing round API endpoints (no authentication required).
 */
final class PublicRoundController extends Controller
{
    public function __construct(
        private readonly RoundApplicationService $roundService
    ) {
    }

    /**
     * Get round results with race events.
     */
    public function results(ShowPublicRoundResultsRequest $request): JsonResponse
    {
        try {
            $results = $this->roundService->getRoundResults($request->getRoundId());
            return ApiResponse::success($results->toArray());
        } catch (RoundNotFoundException $e) {
            return ApiResponse::error('Round not found', null, 404);
        }
    }
}

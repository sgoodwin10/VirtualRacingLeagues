<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\CreateRoundData;
use App\Application\Competition\DTOs\UpdateRoundData;
use App\Application\Competition\Services\RoundApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Round Controller.
 * Thin controller for round CRUD operations (3-5 lines per method).
 */
final class RoundController extends Controller
{
    public function __construct(
        private readonly RoundApplicationService $roundService,
    ) {
    }

    /**
     * List all rounds for a season.
     */
    public function index(int $seasonId): JsonResponse
    {
        $rounds = $this->roundService->getRoundsBySeason($seasonId);
        return ApiResponse::success($rounds);
    }

    /**
     * Create a new round.
     */
    public function store(CreateRoundData $data, int $seasonId): JsonResponse
    {
        // TODO: Get timezone from season/league
        // TODO: Authorize user owns league
        $timezone = 'UTC'; // Placeholder
        /** @var int $userId */
        $userId = auth('web')->id() ?? 0;

        $round = $this->roundService->createRound($data, $seasonId, $timezone, $userId);
        return ApiResponse::created($round->toArray(), 'Round created successfully');
    }

    /**
     * Get a single round.
     */
    public function show(int $roundId): JsonResponse
    {
        $round = $this->roundService->getRound($roundId);
        return ApiResponse::success($round->toArray());
    }

    /**
     * Update a round.
     */
    public function update(UpdateRoundData $data, int $roundId): JsonResponse
    {
        // TODO: Authorize user owns league
        $round = $this->roundService->updateRound($roundId, $data);
        return ApiResponse::success($round->toArray(), 'Round updated successfully');
    }

    /**
     * Delete a round.
     */
    public function destroy(int $roundId): JsonResponse
    {
        // TODO: Authorize user owns league
        $this->roundService->deleteRound($roundId);
        return ApiResponse::success(null, 'Round deleted successfully');
    }

    /**
     * Get the next round number for a season.
     */
    public function nextRoundNumber(int $seasonId): JsonResponse
    {
        $nextNumber = $this->roundService->getNextRoundNumber($seasonId);
        return ApiResponse::success(['next_round_number' => $nextNumber]);
    }
}

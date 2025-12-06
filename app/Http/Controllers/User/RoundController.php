<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\CreateRoundData;
use App\Application\Competition\DTOs\UpdateRoundData;
use App\Application\Competition\DTOs\CompleteRoundData;
use App\Application\Competition\Services\RoundApplicationService;
use App\Domain\Competition\Exceptions\RoundNotFoundException;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        /** @var int $userId */
        $userId = auth('web')->id() ?? 0;

        $round = $this->roundService->createRound($data, $seasonId, $userId);
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
    public function update(Request $request, UpdateRoundData $data, int $roundId): JsonResponse
    {
        /** @var int $userId */
        $userId = auth('web')->id() ?? 0;

        $round = $this->roundService->updateRound($roundId, $data, $userId, $request->all());
        return ApiResponse::success($round->toArray(), 'Round updated successfully');
    }

    /**
     * Delete a round.
     */
    public function destroy(int $roundId): JsonResponse
    {
        try {
            /** @var int $userId */
            $userId = auth('web')->id() ?? 0;

            $this->roundService->deleteRound($roundId, $userId);
            return ApiResponse::success(null, 'Round deleted successfully');
        } catch (RoundNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Get the next round number for a season.
     */
    public function nextRoundNumber(int $seasonId): JsonResponse
    {
        $nextNumber = $this->roundService->getNextRoundNumber($seasonId);
        return ApiResponse::success(['next_round_number' => $nextNumber]);
    }

    /**
     * Mark round as completed.
     * Optionally accepts cross-division results data from frontend.
     */
    public function complete(Request $request, int $roundId): JsonResponse
    {
        try {
            /** @var int $userId */
            $userId = auth('web')->id() ?? 0;

            // Validate and create DTO if data is provided
            $data = null;
            if ($request->hasAny(['qualifying_results', 'race_time_results', 'fastest_lap_results'])) {
                $validated = $request->validate(CompleteRoundData::rules());
                $data = CompleteRoundData::from($validated);
            }

            $round = $this->roundService->completeRound($roundId, $userId, $data);
            return ApiResponse::success($round->toArray(), 'Round marked as completed');
        } catch (RoundNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Mark round as not completed.
     */
    public function uncomplete(int $roundId): JsonResponse
    {
        try {
            /** @var int $userId */
            $userId = auth('web')->id() ?? 0;

            $round = $this->roundService->uncompleteRound($roundId, $userId);
            return ApiResponse::success($round->toArray(), 'Round marked as not completed');
        } catch (RoundNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Get all race results for a round.
     * NOTE: This is a read-only operation, so authorization is not required.
     */
    public function results(int $roundId): JsonResponse
    {
        try {
            $results = $this->roundService->getRoundResults($roundId);
            return ApiResponse::success($results->toArray());
        } catch (RoundNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }
}

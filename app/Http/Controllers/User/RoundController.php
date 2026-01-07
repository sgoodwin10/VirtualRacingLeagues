<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Activity\Services\LeagueActivityLogService;
use App\Application\Competition\Services\RoundApplicationService;
use App\Domain\Competition\Exceptions\RoundNotFoundException;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\CreateRoundRequest;
use App\Http\Requests\User\UpdateRoundRequest;
use App\Http\Requests\User\CompleteRoundRequest;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Round Controller.
 * Thin controller for round CRUD operations (3-5 lines per method).
 */
final class RoundController extends Controller
{
    public function __construct(
        private readonly RoundApplicationService $roundService,
        private readonly LeagueActivityLogService $activityLogService
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
    public function store(CreateRoundRequest $request, int $seasonId): JsonResponse
    {
        $roundData = $this->roundService->createRound(
            $request->toDTO(),
            $seasonId,
            $this->getUserId()
        );

        $this->logRoundCreated($roundData->id);

        return ApiResponse::created($roundData->toArray(), 'Round created successfully');
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
    public function update(UpdateRoundRequest $request, int $roundId): JsonResponse
    {
        $originalData = $this->captureOriginalRoundData($roundId);

        $roundData = $this->roundService->updateRound(
            $roundId,
            $request->toDTO(),
            $this->getUserId(),
            $request->validated()
        );

        $this->logRoundUpdated($roundId, $originalData);

        return ApiResponse::success($roundData->toArray(), 'Round updated successfully');
    }

    /**
     * Delete a round.
     */
    public function destroy(int $roundId): JsonResponse
    {
        try {
            $round = Round::findOrFail($roundId);
            $this->roundService->deleteRound($roundId, $this->getUserId());
            $this->logRoundDeleted($round);

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
     */
    public function complete(CompleteRoundRequest $request, int $roundId): JsonResponse
    {
        try {
            $roundData = $this->roundService->completeRound(
                $roundId,
                $this->getUserId(),
                $request->toDTO()
            );

            $this->logRoundCompleted($roundId);

            return ApiResponse::success($roundData->toArray(), 'Round marked as completed');
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
            $round = $this->roundService->uncompleteRound($roundId, $this->getUserId());
            return ApiResponse::success($round->toArray(), 'Round marked as not completed');
        } catch (RoundNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Get all race results for a round.
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

    /**
     * Get authenticated user ID.
     */
    private function getUserId(): int
    {
        /** @var int|null $userId */
        $userId = auth('web')->id();

        if ($userId === null) {
            throw new UnauthorizedException('User must be authenticated');
        }

        return $userId;
    }

    /**
     * Capture original round data for change tracking.
     *
     * @return array<string, mixed>
     */
    private function captureOriginalRoundData(int $roundId): array
    {
        $round = Round::findOrFail($roundId);
        return $round->only(['name', 'circuit_id', 'start_date', 'end_date']);
    }

    /**
     * Log round created activity.
     */
    private function logRoundCreated(int $roundId): void
    {
        try {
            $user = Auth::user();
            if ($user instanceof UserEloquent) {
                $round = Round::findOrFail($roundId);
                $this->activityLogService->logRoundCreated($user, $round);
            }
        } catch (\Exception $e) {
            Log::error('Failed to log round creation activity', [
                'error' => $e->getMessage(),
                'round_id' => $roundId,
            ]);
        }
    }

    /**
     * Log round updated activity.
     *
     * @param array<string, mixed> $originalData
     */
    private function logRoundUpdated(int $roundId, array $originalData): void
    {
        try {
            $user = Auth::user();
            if ($user instanceof UserEloquent) {
                $round = Round::findOrFail($roundId);
                $newData = $round->only(['name', 'circuit_id', 'start_date', 'end_date']);

                $this->activityLogService->logRoundUpdated($user, $round, [
                    'old' => $originalData,
                    'new' => $newData,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to log round update activity', [
                'error' => $e->getMessage(),
                'round_id' => $roundId,
            ]);
        }
    }

    /**
     * Log round deleted activity.
     */
    private function logRoundDeleted(Round $round): void
    {
        try {
            $user = Auth::user();
            if ($user instanceof UserEloquent) {
                $this->activityLogService->logRoundDeleted($user, $round);
            }
        } catch (\Exception $e) {
            Log::error('Failed to log round deletion activity', [
                'error' => $e->getMessage(),
                'round_id' => $round->id,
            ]);
        }
    }

    /**
     * Log round completed activity.
     */
    private function logRoundCompleted(int $roundId): void
    {
        try {
            $user = Auth::user();
            if ($user instanceof UserEloquent) {
                $round = Round::findOrFail($roundId);
                $this->activityLogService->logRoundCompleted($user, $round);
            }
        } catch (\Exception $e) {
            Log::error('Failed to log round completion activity', [
                'error' => $e->getMessage(),
                'round_id' => $roundId,
            ]);
        }
    }
}

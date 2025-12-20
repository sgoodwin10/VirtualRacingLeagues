<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\CreateRaceData;
use App\Application\Competition\DTOs\UpdateRaceData;
use App\Application\Competition\Services\RaceApplicationService;
use App\Domain\Competition\Exceptions\RaceNotFoundException;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class RaceController extends Controller
{
    public function __construct(
        private readonly RaceApplicationService $raceService,
    ) {
    }

    public function index(int $roundId): JsonResponse
    {
        try {
            $races = $this->raceService->getRacesByRound($roundId);
            return ApiResponse::success($races);
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to retrieve races', null, 500);
        }
    }

    public function store(CreateRaceData $data, int $roundId): JsonResponse
    {
        try {
            /** @var int $userId */
            $userId = auth('web')->id() ?? 0;

            $race = $this->raceService->createRace($data, $roundId, $userId);
            return ApiResponse::created($race->toArray());
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    public function show(int $raceId): JsonResponse
    {
        try {
            $race = $this->raceService->getRace($raceId);
            return ApiResponse::success($race->toArray());
        } catch (RaceNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to retrieve race', null, 500);
        }
    }

    public function update(UpdateRaceData $data, int $raceId): JsonResponse
    {
        try {
            /** @var int $userId */
            $userId = auth('web')->id() ?? 0;

            $race = $this->raceService->updateRace($raceId, $data, $userId);
            return ApiResponse::success($race->toArray());
        } catch (RaceNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    public function destroy(int $raceId): JsonResponse
    {
        try {
            /** @var int $userId */
            $userId = auth('web')->id() ?? 0;

            $this->raceService->deleteRace($raceId, $userId);
            return ApiResponse::success(['message' => 'Race deleted successfully']);
        } catch (RaceNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to delete race', null, 500);
        }
    }

    public function removeOrphanedResults(int $raceId): JsonResponse
    {
        try {
            /** @var int $userId */
            $userId = auth('web')->id() ?? 0;

            $count = $this->raceService->removeOrphanedResults($raceId, $userId);
            return ApiResponse::success(
                ['count' => $count],
                $count === 1
                    ? '1 orphaned result removed'
                    : "{$count} orphaned results removed"
            );
        } catch (RaceNotFoundException $e) {
            return ApiResponse::notFound('Race not found');
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        } catch (\DomainException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to remove orphaned results', null, 500);
        }
    }

    public function getOrphanedResults(int $raceId): JsonResponse
    {
        try {
            /** @var int $userId */
            $userId = auth('web')->id() ?? 0;

            $data = $this->raceService->getOrphanedResults($raceId, $userId);
            return ApiResponse::success($data);
        } catch (RaceNotFoundException $e) {
            return ApiResponse::notFound('Race not found');
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to retrieve orphaned results', null, 500);
        }
    }
}

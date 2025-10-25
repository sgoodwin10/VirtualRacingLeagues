<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\CreateRaceData;
use App\Application\Competition\DTOs\UpdateRaceData;
use App\Application\Competition\Services\RaceApplicationService;
use App\Domain\Competition\Exceptions\RaceNotFoundException;
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
            $race = $this->raceService->createRace($data, $roundId);
            return ApiResponse::created($race->toArray());
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
            $race = $this->raceService->updateRace($raceId, $data);
            return ApiResponse::success($race->toArray());
        } catch (RaceNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    public function destroy(int $raceId): JsonResponse
    {
        try {
            $this->raceService->deleteRace($raceId);
            return ApiResponse::success(['message' => 'Race deleted successfully']);
        } catch (RaceNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to delete race', null, 500);
        }
    }
}

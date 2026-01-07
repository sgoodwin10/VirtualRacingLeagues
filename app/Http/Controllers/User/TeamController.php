<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Team\Services\TeamApplicationService;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Domain\Team\Exceptions\TeamNotFoundException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\AssignDriverTeamRequest;
use App\Http\Requests\User\CreateTeamRequest;
use App\Http\Requests\User\UpdateTeamRequest;
use Illuminate\Http\JsonResponse;

/**
 * Team Controller.
 * Thin controller for team management (3-5 lines per method).
 */
final class TeamController extends Controller
{
    public function __construct(
        private readonly TeamApplicationService $teamService
    ) {
    }

    /**
     * List all teams for a season.
     */
    public function index(int $seasonId): JsonResponse
    {
        $teams = $this->teamService->getTeamsBySeasonId($seasonId);
        return ApiResponse::success($teams);
    }

    /**
     * Create a new team.
     */
    public function store(CreateTeamRequest $request, int $seasonId): JsonResponse
    {
        try {
            $data = $request->toDTO();
            $teamData = $this->teamService->createTeam($data, $seasonId, $request->user()->id);
            return ApiResponse::created($teamData->toArray(), 'Team created successfully');
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Update a team.
     */
    public function update(UpdateTeamRequest $request, int $seasonId, int $teamId): JsonResponse
    {
        try {
            $data = $request->toDTO();
            $teamData = $this->teamService->updateTeam($teamId, $data, $request->user()->id);
            return ApiResponse::success($teamData->toArray(), 'Team updated successfully');
        } catch (TeamNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Delete a team.
     */
    public function destroy(int $seasonId, int $teamId): JsonResponse
    {
        try {
            $userId = (int) auth()->id();
            $this->teamService->deleteTeam($teamId, $userId);
            return ApiResponse::success(null, 'Team deleted successfully');
        } catch (TeamNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Assign a driver to a team.
     */
    public function assignDriver(
        AssignDriverTeamRequest $request,
        int $seasonId,
        int $seasonDriverId
    ): JsonResponse {
        try {
            $data = $request->toDTO();
            $updatedDriver = $this->teamService->assignDriverToTeam(
                $seasonDriverId,
                $data,
                $request->user()->id
            );
            return ApiResponse::success($updatedDriver, 'Driver assigned to team successfully');
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }
}

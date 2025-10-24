<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Team\DTOs\AssignDriverTeamData;
use App\Application\Team\DTOs\CreateTeamData;
use App\Application\Team\DTOs\UpdateTeamData;
use App\Application\Team\Services\TeamApplicationService;
use App\Domain\Team\Exceptions\TeamNotFoundException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
    public function store(Request $request, int $seasonId): JsonResponse
    {
        $validated = $request->validate(CreateTeamData::rules());
        $data = CreateTeamData::from($validated);
        $team = $this->teamService->createTeam($data, $seasonId);

        return ApiResponse::created($team->toArray(), 'Team created successfully');
    }

    /**
     * Update a team.
     */
    public function update(Request $request, int $seasonId, int $teamId): JsonResponse
    {
        try {
            $validated = $request->validate(UpdateTeamData::rules());
            $data = UpdateTeamData::from($validated);
            $team = $this->teamService->updateTeam($teamId, $data);

            return ApiResponse::success($team->toArray(), 'Team updated successfully');
        } catch (TeamNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Delete a team.
     */
    public function destroy(int $seasonId, int $teamId): JsonResponse
    {
        try {
            $this->teamService->deleteTeam($teamId);
            return ApiResponse::success(null, 'Team deleted successfully');
        } catch (TeamNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Assign a driver to a team.
     */
    public function assignDriver(Request $request, int $seasonId, int $seasonDriverId): JsonResponse
    {
        $validated = $request->validate(AssignDriverTeamData::rules());
        $data = AssignDriverTeamData::from($validated);
        $this->teamService->assignDriverToTeam($seasonDriverId, $data);

        return ApiResponse::success(null, 'Driver assigned to team successfully');
    }
}

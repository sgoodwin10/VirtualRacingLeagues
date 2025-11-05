<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\CreateCompetitionData;
use App\Application\Competition\DTOs\UpdateCompetitionData;
use App\Application\Competition\Services\CompetitionApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Competition Controller.
 * Thin controller for competition management (3-5 lines per method).
 */
final class CompetitionController extends Controller
{
    public function __construct(
        private readonly CompetitionApplicationService $competitionService
    ) {
    }

    /**
     * List all competitions for a league.
     */
    public function index(int $leagueId): JsonResponse
    {
        $competitions = $this->competitionService->getLeagueCompetitions($leagueId);
        return ApiResponse::success($competitions);
    }

    /**
     * Create a new competition.
     */
    public function store(Request $request, int $leagueId): JsonResponse
    {
        $validated = $request->validate(CreateCompetitionData::rules());
        $validated['league_id'] = $leagueId;

        $data = CreateCompetitionData::from($validated);
        $competition = $this->competitionService->createCompetition($data, (int) (Auth::id() ?? 0));

        return ApiResponse::created($competition->toArray(), 'Competition created successfully');
    }

    /**
     * Show a single competition.
     */
    public function show(int $id): JsonResponse
    {
        $competition = $this->competitionService->getCompetitionById($id);
        return ApiResponse::success($competition->toArray());
    }

    /**
     * Update a competition.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate(UpdateCompetitionData::rules());

        $data = UpdateCompetitionData::from($validated);
        $competition = $this->competitionService->updateCompetition($id, $data, (int) (Auth::id() ?? 0));

        return ApiResponse::success($competition->toArray(), 'Competition updated successfully');
    }

    /**
     * Delete a competition (soft delete with cascade to seasons and rounds).
     */
    public function destroy(int $id): JsonResponse
    {
        $this->competitionService->deleteCompetition($id, (int) (Auth::id() ?? 0));
        return response()->json(null, 204);
    }

    /**
     * Archive a competition.
     */
    public function archive(int $id): JsonResponse
    {
        $this->competitionService->archiveCompetition($id, (int) (Auth::id() ?? 0));
        return ApiResponse::success(null, 'Competition archived successfully');
    }

    /**
     * Check slug availability for a competition name.
     */
    public function checkSlug(Request $request, int $leagueId): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3|max:100',
            'exclude_id' => 'nullable|integer',
        ]);

        $result = $this->competitionService->checkSlugAvailability(
            $validated['name'],
            $leagueId,
            $validated['exclude_id'] ?? null
        );

        return ApiResponse::success($result);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\CreateCompetitionData;
use App\Application\Competition\DTOs\UpdateCompetitionData;
use App\Application\Competition\Services\CompetitionApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\CreateCompetitionRequest;
use App\Http\Requests\User\UpdateCompetitionRequest;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
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
     * Get the authenticated user.
     */
    private function authenticatedUser(): UserEloquent
    {
        /** @var UserEloquent $user */
        $user = Auth::guard('web')->user();
        assert($user instanceof UserEloquent);

        return $user;
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
    public function store(CreateCompetitionRequest $request, int $leagueId): JsonResponse
    {
        $user = $this->authenticatedUser();
        $validated = array_merge($request->validated(), ['league_id' => $leagueId]);
        $data = CreateCompetitionData::from($validated);
        $competition = $this->competitionService->createCompetition($data, $user->id);

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
    public function update(UpdateCompetitionRequest $request, int $id): JsonResponse
    {
        $user = $this->authenticatedUser();
        $data = UpdateCompetitionData::from($request->validated());
        $competition = $this->competitionService->updateCompetition($id, $data, $user->id);

        return ApiResponse::success($competition->toArray(), 'Competition updated successfully');
    }

    /**
     * Delete a competition (soft delete with cascade to seasons and rounds).
     */
    public function destroy(int $id): JsonResponse
    {
        $user = $this->authenticatedUser();
        $this->competitionService->deleteCompetition($id, $user->id);

        return response()->json(null, 204);
    }

    /**
     * Archive a competition.
     */
    public function archive(int $id): JsonResponse
    {
        $user = $this->authenticatedUser();
        $this->competitionService->archiveCompetition($id, $user->id);

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

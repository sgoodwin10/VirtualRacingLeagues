<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\League\DTOs\CreateLeagueData;
use App\Application\League\DTOs\UpdateLeagueData;
use App\Application\League\Services\LeagueApplicationService;
use App\Domain\League\Exceptions\LeagueLimitReachedException;
use App\Domain\League\Exceptions\LeagueNotFoundException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\CreateLeagueRequest;
use App\Http\Requests\User\UpdateLeagueRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LeagueController extends Controller
{
    public function __construct(
        private readonly LeagueApplicationService $leagueService
    ) {
    }

    /**
     * Get all leagues for the authenticated user.
     */
    public function index(): JsonResponse
    {
        /** @var \App\Infrastructure\Persistence\Eloquent\Models\UserEloquent $user */
        $user = Auth::guard('web')->user();
        assert($user instanceof \App\Infrastructure\Persistence\Eloquent\Models\UserEloquent);

        $leagues = $this->leagueService->getUserLeagues($user->id);
        return ApiResponse::success($leagues);
    }

    /**
     * Create a new league.
     */
    public function store(CreateLeagueRequest $request): JsonResponse
    {
        /** @var \App\Infrastructure\Persistence\Eloquent\Models\UserEloquent $user */
        $user = Auth::guard('web')->user();
        assert($user instanceof \App\Infrastructure\Persistence\Eloquent\Models\UserEloquent);

        try {
            $data = CreateLeagueData::from($request->validated());
            $league = $this->leagueService->createLeague($data, $user->id);
            return ApiResponse::created($league->toArray(), 'League created successfully');
        } catch (LeagueLimitReachedException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    /**
     * Get a specific league.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $league = $this->leagueService->getLeagueById($id);
            return ApiResponse::success($league->toArray());
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::notFound('League not found.');
        }
    }

    /**
     * Update a league.
     */
    public function update(UpdateLeagueRequest $request, int $id): JsonResponse
    {
        /** @var \App\Infrastructure\Persistence\Eloquent\Models\UserEloquent $user */
        $user = Auth::guard('web')->user();
        assert($user instanceof \App\Infrastructure\Persistence\Eloquent\Models\UserEloquent);

        $data = UpdateLeagueData::from($request->validated());
        $league = $this->leagueService->updateLeague($id, $data, $user->id);
        return ApiResponse::success($league->toArray(), 'League updated successfully');
    }

    /**
     * Delete a league.
     */
    public function destroy(int $id): JsonResponse
    {
        /** @var \App\Infrastructure\Persistence\Eloquent\Models\UserEloquent $user */
        $user = Auth::guard('web')->user();
        assert($user instanceof \App\Infrastructure\Persistence\Eloquent\Models\UserEloquent);

        $this->leagueService->deleteLeague($id, $user->id);
        return ApiResponse::success(null, 'League deleted successfully');
    }

    /**
     * Check slug availability (for blur validation).
     */
    public function checkSlug(Request $request): JsonResponse
    {
        $name = $request->input('name');
        if (!$name) {
            return ApiResponse::error('Name is required', null, 400);
        }

        $excludeLeagueId = $request->input('league_id') ? (int) $request->input('league_id') : null;
        $result = $this->leagueService->checkSlugAvailability($name, $excludeLeagueId);
        return ApiResponse::success($result);
    }

    /**
     * Get platforms associated with a league.
     */
    public function platforms(int $id): JsonResponse
    {
        try {
            $platforms = $this->leagueService->getLeaguePlatforms($id);
            return ApiResponse::success($platforms);
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::notFound('League not found.');
        }
    }

    /**
     * Get driver columns for a league's platforms.
     */
    public function driverColumns(int $id): JsonResponse
    {
        try {
            $columns = $this->leagueService->getDriverColumnsForLeague($id);
            return ApiResponse::success($columns);
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::notFound('League not found.');
        }
    }

    /**
     * Get driver form fields for a league's platforms.
     */
    public function driverFormFields(int $id): JsonResponse
    {
        try {
            $formFields = $this->leagueService->getDriverFormFieldsForLeague($id);
            return ApiResponse::success($formFields);
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::notFound('League not found.');
        }
    }

    /**
     * Get driver CSV headers for a league's platforms.
     */
    public function driverCsvHeaders(int $id): JsonResponse
    {
        try {
            $csvHeaders = $this->leagueService->getDriverCsvHeadersForLeague($id);
            return ApiResponse::success($csvHeaders);
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::notFound('League not found.');
        }
    }
}

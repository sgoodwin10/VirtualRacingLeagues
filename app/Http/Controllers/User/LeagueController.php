<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\League\DTOs\CreateLeagueData;
use App\Application\League\DTOs\UpdateLeagueData;
use App\Application\League\Services\LeagueApplicationService;
use App\Domain\League\Exceptions\InvalidPlatformException;
use App\Domain\League\Exceptions\LeagueLimitReachedException;
use App\Domain\League\Exceptions\LeagueNotFoundException;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\CheckSlugRequest;
use App\Http\Requests\User\CreateLeagueRequest;
use App\Http\Requests\User\UpdateLeagueRequest;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

final class LeagueController extends Controller
{
    public function __construct(
        private readonly LeagueApplicationService $leagueService
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
     * Get all leagues for the authenticated user.
     */
    public function index(): JsonResponse
    {
        $user = $this->authenticatedUser();

        $leagues = $this->leagueService->getUserLeagues($user->id);

        return ApiResponse::success($leagues);
    }

    /**
     * Create a new league.
     */
    public function store(CreateLeagueRequest $request): JsonResponse
    {
        try {
            $data = CreateLeagueData::from($request->validated());
            $leagueData = $this->leagueService->createLeagueWithActivityLog(
                $data,
                $this->authenticatedUser()->id,
                $this->authenticatedUser()
            );

            return ApiResponse::created($leagueData->toArray(), 'League created successfully');
        } catch (LeagueLimitReachedException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    /**
     * Get a specific league.
     */
    public function show(int $id): JsonResponse
    {
        $user = $this->authenticatedUser();

        try {
            $league = $this->leagueService->getLeagueById($id, $user->id);

            return ApiResponse::success($league->toArray());
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::notFound('League not found.');
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Update a league.
     */
    public function update(UpdateLeagueRequest $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validated();
            $data = UpdateLeagueData::from($validated);
            $leagueData = $this->leagueService->updateLeagueWithActivityLog(
                $id,
                $data,
                $this->authenticatedUser()->id,
                $this->authenticatedUser(),
                $validated
            );

            return ApiResponse::success($leagueData->toArray(), 'League updated successfully');
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::notFound('League not found.');
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        } catch (InvalidPlatformException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    /**
     * Delete a league (soft delete).
     */
    public function destroy(int $id): JsonResponse
    {
        $user = $this->authenticatedUser();

        try {
            $this->leagueService->deleteLeague($id, $user->id);

            return ApiResponse::success(null, 'League deleted successfully');
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::notFound('League not found.');
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Permanently delete a league and ALL associated data (hard delete).
     * This is a destructive operation that cannot be undone.
     */
    public function hardDelete(int $id): JsonResponse
    {
        $user = $this->authenticatedUser();

        try {
            $this->leagueService->hardDeleteLeague($id, $user->id);

            return ApiResponse::success(null, 'League and all associated data permanently deleted');
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::notFound('League not found.');
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Check slug availability (for blur validation).
     */
    public function checkSlug(CheckSlugRequest $request): JsonResponse
    {
        $user = $this->authenticatedUser();

        $validated = $request->validated();
        $excludeLeagueId = isset($validated['league_id']) ? (int) $validated['league_id'] : null;
        $result = $this->leagueService->checkSlugAvailability($validated['name'], $excludeLeagueId);

        return ApiResponse::success($result);
    }

    /**
     * Get platforms associated with a league.
     */
    public function platforms(int $id): JsonResponse
    {
        $user = $this->authenticatedUser();

        try {
            $platforms = $this->leagueService->getLeaguePlatforms($id, $user->id);

            return ApiResponse::success($platforms);
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::notFound('League not found.');
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Get driver columns for a league's platforms.
     */
    public function driverColumns(int $id): JsonResponse
    {
        $user = $this->authenticatedUser();

        try {
            $columns = $this->leagueService->getDriverColumnsForLeague($id, $user->id);

            return ApiResponse::success($columns);
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::notFound('League not found.');
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Get driver form fields for a league's platforms.
     */
    public function driverFormFields(int $id): JsonResponse
    {
        $user = $this->authenticatedUser();

        try {
            $formFields = $this->leagueService->getDriverFormFieldsForLeague($id, $user->id);

            return ApiResponse::success($formFields);
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::notFound('League not found.');
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Get driver CSV headers for a league's platforms.
     */
    public function driverCsvHeaders(int $id): JsonResponse
    {
        $user = $this->authenticatedUser();

        try {
            $csvHeaders = $this->leagueService->getDriverCsvHeadersForLeague($id, $user->id);

            return ApiResponse::success($csvHeaders);
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::notFound('League not found.');
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }
}

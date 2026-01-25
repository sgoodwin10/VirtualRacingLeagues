<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Division\DTOs\AssignDriverDivisionData;
use App\Application\Division\DTOs\CreateDivisionData;
use App\Application\Division\DTOs\ReorderDivisionsData;
use App\Application\Division\DTOs\UpdateDivisionData;
use App\Application\Division\Services\DivisionApplicationService;
use App\Domain\Division\Exceptions\DivisionNotFoundException;
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\CreateDivisionRequest;
use App\Http\Requests\User\ReorderDivisionsRequest;
use App\Http\Requests\User\UpdateDivisionRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Division Controller.
 * Thin controller for division management (3-5 lines per method).
 */
final class DivisionController extends Controller
{
    public function __construct(
        private readonly DivisionApplicationService $divisionService
    ) {
    }

    /**
     * Get authenticated user ID with validation.
     *
     * @throws UnauthorizedException if user is not authenticated
     */
    private function getAuthenticatedUserId(): int
    {
        $userId = Auth::id();
        if ($userId === null) {
            throw UnauthorizedException::notAuthenticated();
        }

        return (int) $userId;
    }

    /**
     * List all divisions for a season.
     */
    public function index(int $seasonId): JsonResponse
    {
        try {
            $divisions = $this->divisionService->getDivisionsBySeasonId($seasonId, $this->getAuthenticatedUserId());

            return ApiResponse::success($divisions);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Create a new division.
     */
    public function store(CreateDivisionRequest $request, int $seasonId): JsonResponse
    {
        try {
            $data = CreateDivisionData::from($request->validated());
            $divisionData = $this->divisionService->createDivision($data, $seasonId, $this->getAuthenticatedUserId());

            return ApiResponse::created($divisionData->toArray(), 'Division created successfully');
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Update a division.
     */
    public function update(UpdateDivisionRequest $request, int $seasonId, int $divisionId): JsonResponse
    {
        try {
            $data = UpdateDivisionData::from($request->validated());
            $divisionData = $this->divisionService->updateDivision($divisionId, $data, $this->getAuthenticatedUserId());

            return ApiResponse::success($divisionData->toArray(), 'Division updated successfully');
        } catch (DivisionNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Delete a division.
     */
    public function destroy(int $seasonId, int $divisionId): JsonResponse
    {
        try {
            $this->divisionService->deleteDivision($divisionId, $this->getAuthenticatedUserId());

            return ApiResponse::success(null, 'Division deleted successfully');
        } catch (DivisionNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Get driver count for a division.
     */
    public function driverCount(int $seasonId, int $divisionId): JsonResponse
    {
        try {
            $count = $this->divisionService->getDriverCount($divisionId, $this->getAuthenticatedUserId());

            return ApiResponse::success(['count' => $count]);
        } catch (DivisionNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Assign a driver to a division.
     */
    public function assignDriver(AssignDriverDivisionData $data, int $seasonId, int $seasonDriverId): JsonResponse
    {
        try {
            $updatedDriver = $this->divisionService->assignDriverToDivision(
                $seasonDriverId,
                $data,
                $this->getAuthenticatedUserId()
            );

            return ApiResponse::success($updatedDriver, 'Driver assigned to division successfully');
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Reorder divisions for a season.
     */
    public function reorder(ReorderDivisionsRequest $request, int $seasonId): JsonResponse
    {
        try {
            $data = ReorderDivisionsData::from($request->validated());
            $divisions = $this->divisionService->reorderDivisions($seasonId, $data, $this->getAuthenticatedUserId());

            return ApiResponse::success($divisions, 'Divisions reordered successfully');
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }
}

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
            $userId = $this->getAuthenticatedUserId();
            $divisions = $this->divisionService->getDivisionsBySeasonId($seasonId, $userId);
            return ApiResponse::success($divisions);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Create a new division.
     */
    public function store(CreateDivisionData $data, int $seasonId): JsonResponse
    {
        try {
            $userId = $this->getAuthenticatedUserId();
            $division = $this->divisionService->createDivision($data, $seasonId, $userId);
            return ApiResponse::created($division->toArray(), 'Division created successfully');
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Update a division.
     */
    public function update(UpdateDivisionData $data, int $seasonId, int $divisionId): JsonResponse
    {
        try {
            $userId = $this->getAuthenticatedUserId();
            $division = $this->divisionService->updateDivision($divisionId, $data, $userId);
            return ApiResponse::success($division->toArray(), 'Division updated successfully');
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
            $userId = $this->getAuthenticatedUserId();
            $this->divisionService->deleteDivision($divisionId, $userId);
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
            $userId = $this->getAuthenticatedUserId();
            $count = $this->divisionService->getDriverCount($divisionId, $userId);
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
    public function reorder(ReorderDivisionsData $data, int $seasonId): JsonResponse
    {
        try {
            $divisions = $this->divisionService->reorderDivisions($seasonId, $data, $this->getAuthenticatedUserId());
            return ApiResponse::success($divisions, 'Divisions reordered successfully');
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }
}

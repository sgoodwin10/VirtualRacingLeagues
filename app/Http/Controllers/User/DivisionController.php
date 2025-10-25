<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Division\DTOs\AssignDriverDivisionData;
use App\Application\Division\DTOs\CreateDivisionData;
use App\Application\Division\DTOs\UpdateDivisionData;
use App\Application\Division\Services\DivisionApplicationService;
use App\Domain\Division\Exceptions\DivisionNotFoundException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

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
     * List all divisions for a season.
     */
    public function index(int $seasonId): JsonResponse
    {
        $divisions = $this->divisionService->getDivisionsBySeasonId($seasonId);
        return ApiResponse::success($divisions);
    }

    /**
     * Create a new division.
     */
    public function store(CreateDivisionData $data, int $seasonId): JsonResponse
    {
        $division = $this->divisionService->createDivision($data, $seasonId);
        return ApiResponse::created($division->toArray(), 'Division created successfully');
    }

    /**
     * Update a division.
     */
    public function update(UpdateDivisionData $data, int $seasonId, int $divisionId): JsonResponse
    {
        try {
            $division = $this->divisionService->updateDivision($divisionId, $data);
            return ApiResponse::success($division->toArray(), 'Division updated successfully');
        } catch (DivisionNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Delete a division.
     */
    public function destroy(int $seasonId, int $divisionId): JsonResponse
    {
        try {
            $this->divisionService->deleteDivision($divisionId);
            return ApiResponse::success(null, 'Division deleted successfully');
        } catch (DivisionNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Get driver count for a division.
     */
    public function driverCount(int $seasonId, int $divisionId): JsonResponse
    {
        try {
            $count = $this->divisionService->getDriverCount($divisionId);
            return ApiResponse::success(['count' => $count]);
        } catch (DivisionNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Assign a driver to a division.
     */
    public function assignDriver(AssignDriverDivisionData $data, int $seasonId, int $seasonDriverId): JsonResponse
    {
        $updatedDriver = $this->divisionService->assignDriverToDivision($seasonDriverId, $data);
        return ApiResponse::success($updatedDriver, 'Driver assigned to division successfully');
    }
}

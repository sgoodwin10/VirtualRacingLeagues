<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Application\Driver\DTOs\AdminCreateDriverData;
use App\Application\Driver\DTOs\AdminUpdateDriverData;
use App\Application\Driver\Services\DriverApplicationService;
use App\Domain\Driver\Exceptions\DriverNotFoundException;
use App\Domain\Driver\Exceptions\InvalidDriverDataException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexDriversRequest;
use App\Http\Requests\Admin\StoreDriverRequest;
use App\Http\Requests\Admin\UpdateDriverRequest;
use Illuminate\Http\JsonResponse;

/**
 * Admin Driver Controller - manages all drivers globally (Admin context).
 * Thin controller following DDD principles.
 *
 * This controller is different from User/DriverController which manages drivers within leagues.
 */
final class DriverController extends Controller
{
    public function __construct(
        private readonly DriverApplicationService $driverService
    ) {
    }

    /**
     * Display a listing of all drivers (admin context).
     */
    public function index(IndexDriversRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $result = $this->driverService->getAllDrivers(
            search: $validated['search'] ?? null,
            page: (int) ($validated['page'] ?? 1),
            perPage: (int) ($validated['per_page'] ?? 15),
            orderBy: $validated['order_by'] ?? 'created_at',
            orderDirection: $validated['order_direction'] ?? 'desc'
        );

        return ApiResponse::paginated(
            $result['data'],
            [
                'total' => $result['total'],
                'per_page' => $result['per_page'],
                'current_page' => $result['current_page'],
                'last_page' => $result['last_page'],
            ]
        );
    }

    /**
     * Store a newly created driver.
     */
    public function store(StoreDriverRequest $request): JsonResponse
    {
        try {
            $data = AdminCreateDriverData::from($request->validated());
            $driver = $this->driverService->createDriver($data);
            return ApiResponse::created($driver->toArray(), 'Driver created successfully');
        } catch (InvalidDriverDataException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    /**
     * Display the specified driver.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $driver = $this->driverService->getDriverById($id);

            return ApiResponse::success($driver->toArray());
        } catch (DriverNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Display detailed information about a driver including related entities.
     */
    public function details(int $id): JsonResponse
    {
        try {
            $driverDetails = $this->driverService->getDriverDetailsForAdmin($id);

            return ApiResponse::success($driverDetails);
        } catch (DriverNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Update the specified driver.
     */
    public function update(UpdateDriverRequest $request, int $id): JsonResponse
    {
        try {
            $data = AdminUpdateDriverData::from($request->validated());
            $driver = $this->driverService->updateDriver($id, $data);
            return ApiResponse::success($driver->toArray(), 'Driver updated successfully');
        } catch (DriverNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (InvalidDriverDataException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    /**
     * Remove the specified driver.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->driverService->deleteDriver($id);

            return ApiResponse::success(null, 'Driver deleted successfully');
        } catch (DriverNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }
}

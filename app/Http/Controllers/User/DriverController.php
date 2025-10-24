<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Driver\DTOs\CreateDriverData;
use App\Application\Driver\DTOs\ImportDriversData;
use App\Application\Driver\DTOs\UpdateDriverData;
use App\Application\Driver\Services\DriverApplicationService;
use App\Domain\Driver\Exceptions\DriverAlreadyInLeagueException;
use App\Domain\Driver\Exceptions\DriverNotFoundException;
use App\Domain\Driver\Exceptions\InvalidDriverDataException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Driver Controller - manages drivers within leagues (User context).
 * Thin controller following DDD principles.
 */
final class DriverController extends Controller
{
    public function __construct(
        private readonly DriverApplicationService $driverService
    ) {
    }

    /**
     * Display a listing of drivers in a league.
     */
    public function index(Request $request, int $league): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:active,inactive,banned'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $result = $this->driverService->getLeagueDrivers(
            leagueId: $league,
            search: $validated['search'] ?? null,
            status: $validated['status'] ?? null,
            page: (int) ($validated['page'] ?? 1),
            perPage: (int) ($validated['per_page'] ?? 15)
        );

        // Build pagination links
        $baseUrl = $request->url();
        $queryParams = $request->except('page');
        $lastPage = $result->last_page;
        $currentPage = $result->current_page;

        $firstPage = $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => 1]));
        $lastPageUrl = $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $lastPage]));
        $prevPage = $currentPage > 1
            ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage - 1]))
            : null;
        $nextPage = $currentPage < $lastPage
            ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage + 1]))
            : null;

        return ApiResponse::paginated(
            $result->data,
            [
                'total' => $result->total,
                'per_page' => $result->per_page,
                'current_page' => $result->current_page,
                'last_page' => $result->last_page,
            ],
            [
                'first' => $firstPage,
                'last' => $lastPageUrl,
                'prev' => $prevPage,
                'next' => $nextPage,
            ]
        );
    }

    /**
     * Store a newly created driver in a league.
     */
    public function store(Request $request, int $league): JsonResponse
    {
        $validated = $request->validate(CreateDriverData::rules());

        try {
            $data = CreateDriverData::from($validated);
            $leagueDriver = $this->driverService->createDriverForLeague($data, $league);

            return ApiResponse::created($leagueDriver->toArray(), 'Driver added to league successfully');
        } catch (InvalidDriverDataException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        } catch (DriverAlreadyInLeagueException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    /**
     * Display the specified driver in a league.
     */
    public function show(int $league, int $driver): JsonResponse
    {
        try {
            $leagueDriver = $this->driverService->getLeagueDriver($league, $driver);

            return ApiResponse::success($leagueDriver->toArray());
        } catch (DriverNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Update the specified driver's global fields and league settings.
     */
    public function update(Request $request, int $league, int $driver): JsonResponse
    {
        $validated = $request->validate(UpdateDriverData::rules());

        try {
            $data = UpdateDriverData::from($validated);
            $leagueDriver = $this->driverService->updateDriverAndLeagueSettings($data, $league, $driver);

            return ApiResponse::success($leagueDriver->toArray(), 'Driver updated successfully');
        } catch (DriverNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (InvalidDriverDataException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    /**
     * Remove the specified driver from the league.
     */
    public function destroy(int $league, int $driver): JsonResponse
    {
        try {
            $this->driverService->removeDriverFromLeague($league, $driver);

            return ApiResponse::success(null, 'Driver removed from league successfully');
        } catch (DriverNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Import drivers from CSV data.
     */
    public function importCsv(Request $request, int $league): JsonResponse
    {
        $validated = $request->validate(ImportDriversData::rules());

        $data = ImportDriversData::from($validated);
        $result = $this->driverService->importDriversFromCSV($data, $league);

        if ($result->hasErrors()) {
            return ApiResponse::success($result->toArray(), "Imported {$result->success_count} drivers with {$result->errorCount()} errors");
        }

        return ApiResponse::created($result->toArray(), "Successfully imported {$result->success_count} drivers");
    }
}

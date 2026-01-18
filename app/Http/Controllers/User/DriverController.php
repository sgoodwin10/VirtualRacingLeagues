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
use App\Domain\Shared\Exceptions\UnauthorizedException;
use App\Helpers\ApiResponse;
use App\Helpers\PaginationHelper;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

        try {
            $result = $this->driverService->getLeagueDrivers(
                leagueId: $league,
                userId: $this->getAuthenticatedUserId(),
                search: $validated['search'] ?? null,
                status: $validated['status'] ?? null,
                page: (int) ($validated['page'] ?? 1),
                perPage: (int) ($validated['per_page'] ?? 15)
            );

            // Build pagination links
            $links = PaginationHelper::buildLinks(
                $request,
                $result->current_page,
                $result->last_page
            );

            return ApiResponse::paginated(
                $result->data,
                [
                    'total' => $result->total,
                    'per_page' => $result->per_page,
                    'current_page' => $result->current_page,
                    'last_page' => $result->last_page,
                ],
                $links
            );
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Store a newly created driver in a league.
     */
    public function store(Request $request, int $league): JsonResponse
    {
        try {
            $data = CreateDriverData::from($request->validate(CreateDriverData::rules()));
            $leagueDriverData = $this->driverService->createDriverForLeagueWithActivityLog(
                $data,
                $league,
                $this->getAuthenticatedUserId()
            );
            return ApiResponse::created($leagueDriverData->toArray(), 'Driver added to league successfully');
        } catch (InvalidDriverDataException | DriverAlreadyInLeagueException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Display the specified driver in a league.
     */
    public function show(int $league, int $driver): JsonResponse
    {
        try {
            $leagueDriver = $this->driverService->getLeagueDriver($league, $driver, $this->getAuthenticatedUserId());

            return ApiResponse::success($leagueDriver->toArray());
        } catch (DriverNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Update the specified driver's global fields and league settings.
     */
    public function update(Request $request, int $league, int $driver): JsonResponse
    {
        try {
            $data = UpdateDriverData::from($request->validate(UpdateDriverData::rules()));
            $leagueDriverData = $this->driverService->updateDriverAndLeagueSettingsWithActivityLog(
                $data,
                $league,
                $driver,
                $this->getAuthenticatedUserId()
            );
            return ApiResponse::success($leagueDriverData->toArray(), 'Driver updated successfully');
        } catch (DriverNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (InvalidDriverDataException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Remove the specified driver from the league.
     */
    public function destroy(int $league, int $driver): JsonResponse
    {
        try {
            $this->driverService->removeDriverFromLeagueWithActivityLog(
                $league,
                $driver,
                $this->getAuthenticatedUserId()
            );
            return ApiResponse::success(null, 'Driver removed from league successfully');
        } catch (DriverNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Import drivers from CSV data.
     */
    public function importCsv(Request $request, int $league): JsonResponse
    {
        try {
            $data = ImportDriversData::from($request->validate(ImportDriversData::rules()));
            $result = $this->driverService->importDriversFromCSVWithActivityLog(
                $data,
                $league,
                $this->getAuthenticatedUserId()
            );

            // Build response message based on results
            $messageParts = [];
            if ($result->success_count > 0) {
                $messageParts[] = "Imported {$result->success_count} driver" . ($result->success_count === 1 ? '' : 's');
            }
            if ($result->skipped_count > 0) {
                $messageParts[] = "skipped {$result->skipped_count} duplicate" . ($result->skipped_count === 1 ? '' : 's');
            }
            if ($result->hasErrors()) {
                $messageParts[] = "{$result->errorCount()} error" . ($result->errorCount() === 1 ? '' : 's');
            }

            $message = !empty($messageParts) ? ucfirst(implode(', ', $messageParts)) : 'No drivers imported';

            if ($result->hasErrors()) {
                return ApiResponse::success($result->toArray(), $message);
            }

            return ApiResponse::created($result->toArray(), $message);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Get all seasons a league driver is participating in.
     */
    public function seasons(int $league, int $driver): JsonResponse
    {
        try {
            $seasons = $this->driverService->getLeagueDriverSeasons($league, $driver, $this->getAuthenticatedUserId());

            return ApiResponse::success(array_map(fn ($season) => $season->toArray(), $seasons));
        } catch (DriverNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Application\League\Services\LeagueApplicationService;
use App\Domain\League\Exceptions\LeagueNotFoundException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin League Controller.
 * Thin controller that delegates to the application service.
 */
final class AdminLeagueController extends Controller
{
    public function __construct(
        private readonly LeagueApplicationService $leagueService,
    ) {
    }

    /**
     * Display a listing of all leagues (admin view).
     */
    public function index(Request $request): JsonResponse
    {
        // Validate input parameters
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'visibility' => ['nullable', 'in:public,private,unlisted'],
            'status' => ['nullable', 'in:active,archived'],
            'platform_ids' => ['nullable', 'array'],
            'platform_ids.*' => ['integer', 'exists:platforms,id'],
            'sort_by' => ['nullable', 'in:id,name,visibility,status,created_at,updated_at'],
            'sort_direction' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        // Build filters array
        $filters = [];

        if (!empty($validated['search'])) {
            $filters['search'] = $validated['search'];
        }

        if (!empty($validated['visibility'])) {
            $filters['visibility'] = $validated['visibility'];
        }

        if (!empty($validated['status'])) {
            $filters['status'] = $validated['status'];
        }

        if (!empty($validated['platform_ids'])) {
            $filters['platform_ids'] = array_map('intval', $validated['platform_ids']);
        }

        if (!empty($validated['sort_by'])) {
            $filters['sort_by'] = $validated['sort_by'];
        }

        if (!empty($validated['sort_direction'])) {
            $filters['sort_direction'] = $validated['sort_direction'];
        }

        $perPage = (int) ($validated['per_page'] ?? 15);
        $page = (int) ($validated['page'] ?? 1);

        // Get paginated leagues from application service
        $result = $this->leagueService->getAllLeaguesForAdmin($page, $perPage, $filters);

        // Convert Data objects to arrays
        $data = array_map(fn($item) => $item->toArray(), $result['data']);

        // Build pagination links
        $baseUrl = $request->url();
        $queryParams = $request->except('page');
        $lastPage = $result['last_page'];
        $currentPage = $result['current_page'];

        $firstPage = $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => 1]));
        $lastPageUrl = $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $lastPage]));
        $prevPage = $currentPage > 1
            ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage - 1]))
            : null;
        $nextPage = $currentPage < $lastPage
            ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage + 1]))
            : null;

        // Return paginated response
        return ApiResponse::paginated(
            data: $data,
            meta: [
                'total' => $result['total'],
                'per_page' => $result['per_page'],
                'current_page' => $result['current_page'],
                'last_page' => $result['last_page'],
            ],
            links: [
                'first' => $firstPage,
                'last' => $lastPageUrl,
                'prev' => $prevPage,
                'next' => $nextPage,
            ]
        );
    }

    /**
     * Display the specified league (admin view).
     */
    public function show(int $id): JsonResponse
    {
        try {
            $leagueData = $this->leagueService->getLeagueForAdmin($id);
            return ApiResponse::success($leagueData->toArray());
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Archive the specified league.
     */
    public function archive(int $id): JsonResponse
    {
        try {
            $leagueData = $this->leagueService->archiveLeague($id);
            return ApiResponse::success($leagueData->toArray(), 'League archived successfully');
        } catch (LeagueNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Remove the specified league (placeholder - does nothing for now).
     * TODO: Implement permanent delete for archived leagues.
     */
    public function destroy(int $id): JsonResponse
    {
        // Placeholder - just return 204 No Content for now
        return ApiResponse::noContent();
    }
}

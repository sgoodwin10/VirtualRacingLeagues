<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Application\League\Services\LeagueApplicationService;
use App\Domain\League\Exceptions\LeagueNotFoundException;
use App\Helpers\ApiResponse;
use App\Helpers\FilterBuilder;
use App\Helpers\PaginationHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexLeaguesRequest;
use Illuminate\Http\JsonResponse;

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
    public function index(IndexLeaguesRequest $request): JsonResponse
    {
        $filters = FilterBuilder::build($request->validated());

        // Ensure platform_ids are integers if provided
        if (isset($filters['platform_ids'])) {
            $filters['platform_ids'] = array_map('intval', $filters['platform_ids']);
        }

        $perPage = (int) ($request->validated()['per_page'] ?? 15);
        $page = (int) ($request->validated()['page'] ?? 1);

        $result = $this->leagueService->getAllLeaguesForAdmin($page, $perPage, $filters);

        $links = PaginationHelper::buildLinks($request, $result['current_page'], $result['last_page']);

        return ApiResponse::paginated(
            data: array_map(fn($item) => $item->toArray(), $result['data']),
            meta: [
                'total' => $result['total'],
                'per_page' => $result['per_page'],
                'current_page' => $result['current_page'],
                'last_page' => $result['last_page'],
            ],
            links: $links
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

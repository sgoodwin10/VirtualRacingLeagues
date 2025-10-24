<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

/**
 * Controller for managing activity logs in the admin dashboard.
 */
class AdminActivityLogController extends Controller
{
    public function __construct(
        private readonly ActivityLogService $activityLogService
    ) {
    }

    /**
     * Get all activities (both user and admin).
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'log_name' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $perPage = $validated['per_page'] ?? 15;
        $logName = $validated['log_name'] ?? null;
        $page = $validated['page'] ?? 1;

        /** @phpstan-var \Illuminate\Database\Eloquent\Builder<Activity> $query */
        $query = Activity::query();

        $query = $query->with('causer', 'subject')
            ->orderBy('created_at', 'desc');

        if ($logName !== null) {
            $query->where('log_name', $logName);
        }

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        // Build pagination links
        $baseUrl = $request->url();
        $queryParams = $request->except('page');
        $lastPage = $paginator->lastPage();
        $currentPage = $paginator->currentPage();

        $firstPage = $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => 1]));
        $lastPageUrl = $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $lastPage]));
        $prevPage = $currentPage > 1
            ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage - 1]))
            : null;
        $nextPage = $currentPage < $lastPage
            ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage + 1]))
            : null;

        return ApiResponse::paginated(
            $paginator->items(),
            [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
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
     * Get user activities only.
     */
    public function userActivities(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $perPage = $validated['per_page'] ?? 15;
        $page = $validated['page'] ?? 1;

        /** @phpstan-var \Illuminate\Database\Eloquent\Builder<Activity> $query */
        $query = Activity::query();

        $query = $query->with('causer', 'subject')
            ->where('log_name', 'user')
            ->orderBy('created_at', 'desc');

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        // Build pagination links
        $baseUrl = $request->url();
        $queryParams = $request->except('page');
        $lastPage = $paginator->lastPage();
        $currentPage = $paginator->currentPage();

        $firstPage = $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => 1]));
        $lastPageUrl = $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $lastPage]));
        $prevPage = $currentPage > 1
            ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage - 1]))
            : null;
        $nextPage = $currentPage < $lastPage
            ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage + 1]))
            : null;

        return ApiResponse::paginated(
            $paginator->items(),
            [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
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
     * Get admin activities only.
     */
    public function adminActivities(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $perPage = $validated['per_page'] ?? 15;
        $page = $validated['page'] ?? 1;

        /** @phpstan-var \Illuminate\Database\Eloquent\Builder<Activity> $query */
        $query = Activity::query();

        $query = $query->with('causer', 'subject')
            ->where('log_name', 'admin')
            ->orderBy('created_at', 'desc');

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        // Build pagination links
        $baseUrl = $request->url();
        $queryParams = $request->except('page');
        $lastPage = $paginator->lastPage();
        $currentPage = $paginator->currentPage();

        $firstPage = $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => 1]));
        $lastPageUrl = $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $lastPage]));
        $prevPage = $currentPage > 1
            ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage - 1]))
            : null;
        $nextPage = $currentPage < $lastPage
            ? $baseUrl . '?' . http_build_query(array_merge($queryParams, ['page' => $currentPage + 1]))
            : null;

        return ApiResponse::paginated(
            $paginator->items(),
            [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
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
     * Get activities for a specific user.
     */
    public function userActivity(int $userId): JsonResponse
    {
        /** @var User $user */
        $user = User::findOrFail($userId);
        $activities = $this->activityLogService->getActivitiesForCauser($user);

        return ApiResponse::success($activities);
    }

    /**
     * Get activities for a specific admin.
     */
    public function adminActivity(int $adminId): JsonResponse
    {
        /** @var Admin $admin */
        $admin = Admin::findOrFail($adminId);
        $activities = $this->activityLogService->getActivitiesForCauser($admin);

        return ApiResponse::success($activities);
    }

    /**
     * Get activity details by ID.
     */
    public function show(int $id): JsonResponse
    {
        /** @phpstan-var \Illuminate\Database\Eloquent\Builder<Activity> $query */
        $query = Activity::query();

        /** @var Activity $activity */
        $activity = $query->with('causer', 'subject')->findOrFail($id);

        return ApiResponse::success($activity);
    }

    /**
     * Clean old activity logs.
     */
    public function clean(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'days' => ['nullable', 'integer', 'min:1', 'max:3650'],
        ]);

        $days = $validated['days'] ?? 365;
        $deletedCount = $this->activityLogService->deleteOldActivities($days);

        return ApiResponse::success(
            ['deleted_count' => $deletedCount],
            "Deleted {$deletedCount} old activity logs"
        );
    }
}

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
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
            'log_name' => ['nullable', 'string', 'max:255'],
        ]);

        $limit = $validated['limit'] ?? 50;
        $logName = $validated['log_name'] ?? null;

        /** @phpstan-var \Illuminate\Database\Eloquent\Builder<Activity> $query */
        $query = Activity::query();

        $query = $query->with('causer', 'subject')
            ->orderBy('created_at', 'desc');

        if ($logName !== null) {
            $query->where('log_name', $logName);
        }

        $activities = $query->limit($limit)->get();

        return ApiResponse::success($activities);
    }

    /**
     * Get user activities only.
     */
    public function userActivities(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $limit = $validated['limit'] ?? 50;
        $activities = $this->activityLogService->getUserActivities($limit);

        return ApiResponse::success($activities);
    }

    /**
     * Get admin activities only.
     */
    public function adminActivities(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $limit = $validated['limit'] ?? 50;
        $activities = $this->activityLogService->getAdminActivities($limit);

        return ApiResponse::success($activities);
    }

    /**
     * Get activities for a specific user.
     */
    public function userActivity(int $userId): JsonResponse
    {
        /** @var User $user */
        $user = User::query()->findOrFail($userId);
        $activities = $this->activityLogService->getActivitiesForCauser($user);

        return ApiResponse::success($activities);
    }

    /**
     * Get activities for a specific admin.
     */
    public function adminActivity(int $adminId): JsonResponse
    {
        /** @var Admin $admin */
        $admin = Admin::query()->findOrFail($adminId);
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

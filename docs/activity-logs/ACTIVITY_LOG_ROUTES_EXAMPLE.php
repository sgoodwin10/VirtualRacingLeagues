<?php

/**
 * Activity Log API Routes
 *
 * Add these routes to your routes/web.php file under the admin API prefix.
 * These routes are protected by the 'auth:admin' and 'admin.authenticate' middleware.
 */

use App\Http\Controllers\Admin\AdminActivityLogController;

// Example of how to add these routes to routes/web.php:
/*
Route::prefix('admin/api')->middleware(['auth:admin', 'admin.authenticate'])->group(function () {
    // ... existing admin routes ...

    // Activity Log Routes
    Route::prefix('activities')->group(function () {
        // Get all activities (both user and admin)
        // Query params: ?limit=50&log_name=user
        Route::get('/', [AdminActivityLogController::class, 'index']);

        // Get user activities only
        // Query params: ?limit=50
        Route::get('/users', [AdminActivityLogController::class, 'userActivities']);

        // Get admin activities only
        // Query params: ?limit=50
        Route::get('/admins', [AdminActivityLogController::class, 'adminActivities']);

        // Get activities for a specific user
        Route::get('/user/{userId}', [AdminActivityLogController::class, 'userActivity']);

        // Get activities for a specific admin
        Route::get('/admin/{adminId}', [AdminActivityLogController::class, 'adminActivity']);

        // Get activity details by ID
        Route::get('/{id}', [AdminActivityLogController::class, 'show']);

        // Clean old activity logs
        // Body: { "days": 365 }
        Route::post('/clean', [AdminActivityLogController::class, 'clean']);
    });
});
*/

/**
 * API Endpoint Examples:
 *
 * 1. Get all activities:
 *    GET /admin/api/activities?limit=50
 *
 * 2. Get user activities only:
 *    GET /admin/api/activities/users?limit=50
 *
 * 3. Get admin activities only:
 *    GET /admin/api/activities/admins?limit=50
 *
 * 4. Get activities for a specific user:
 *    GET /admin/api/activities/user/1
 *
 * 5. Get activities for a specific admin:
 *    GET /admin/api/activities/admin/1
 *
 * 6. Get activity by ID:
 *    GET /admin/api/activities/123
 *
 * 7. Clean old logs:
 *    POST /admin/api/activities/clean
 *    Body: { "days": 365 }
 */

/**
 * Example Response Format:
 *
 * {
 *     "success": true,
 *     "data": [
 *         {
 *             "id": 1,
 *             "log_name": "user",
 *             "description": "User account created",
 *             "subject_type": "App\\Models\\User",
 *             "subject_id": 1,
 *             "causer_type": null,
 *             "causer_id": null,
 *             "properties": {
 *                 "attributes": {
 *                     "first_name": "John",
 *                     "last_name": "Doe",
 *                     "email": "john@example.com"
 *                 }
 *             },
 *             "event": "created",
 *             "batch_uuid": null,
 *             "created_at": "2025-10-14T08:57:00.000000Z",
 *             "updated_at": "2025-10-14T08:57:00.000000Z"
 *         }
 *     ]
 * }
 */

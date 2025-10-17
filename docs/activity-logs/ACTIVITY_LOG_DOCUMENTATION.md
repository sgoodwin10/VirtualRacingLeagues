# Activity Log Documentation

This document provides comprehensive guidance on using the `spatie/laravel-activitylog` package (v4) in this Laravel application to track both user and admin activities.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Model Setup](#model-setup)
- [Usage Examples](#usage-examples)
- [Service Layer](#service-layer)
- [Controller Integration](#controller-integration)
- [Querying Activity Logs](#querying-activity-logs)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Maintenance](#maintenance)

## Overview

Activity logging has been configured to automatically track changes to User and Admin models, as well as support custom activity logging for specific actions.

**Key Features:**
- Automatic logging of model creation, updates, and deletion
- Separate log names for users (`user`) and admins (`admin`)
- Only dirty (changed) attributes are logged
- Custom activity logging for specific actions
- Query activities by causer, subject, or log name
- Comprehensive service layer for activity management

## Installation

The package has been installed and configured:

```bash
composer require spatie/laravel-activitylog
php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider" --tag="activitylog-migrations"
php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider" --tag="activitylog-config"
php artisan migrate
```

## Configuration

Configuration file: `/var/www/config/activitylog.php`

**Key Configuration Options:**
- `enabled`: Enable/disable activity logging (default: `true`)
- `delete_records_older_than_days`: Days to keep logs (default: `365`)
- `default_log_name`: Default log name (default: `'default'`)
- `activity_model`: Activity model class
- `table_name`: Database table name (default: `'activity_log'`)

## Model Setup

### User Model

File: `/var/www/app/Models/User.php`

```php
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\CausesActivity;
use Spatie\Activitylog\Traits\LogsActivity;

class User extends Authenticatable
{
    use HasFactory, Notifiable, LogsActivity, CausesActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'first_name',
                'last_name',
                'email',
                'alias',
                'status',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('user')
            ->setDescriptionForEvent(fn (string $eventName) => match ($eventName) {
                'created' => 'User account created',
                'updated' => 'User profile updated',
                'deleted' => 'User account deleted',
                default => "User {$eventName}",
            });
    }
}
```

### Admin Model

File: `/var/www/app/Models/Admin.php`

```php
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\CausesActivity;
use Spatie\Activitylog\Traits\LogsActivity;

class Admin extends Authenticatable
{
    use HasFactory, Notifiable, LogsActivity, CausesActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'first_name',
                'last_name',
                'email',
                'role',
                'status',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('admin')
            ->setDescriptionForEvent(fn (string $eventName) => match ($eventName) {
                'created' => 'Admin account created',
                'updated' => 'Admin account updated',
                'deleted' => 'Admin account deleted',
                default => "Admin {$eventName}",
            });
    }
}
```

**Key Features:**
- `LogsActivity` trait: Enables automatic logging of model changes
- `CausesActivity` trait: Marks the model as capable of causing activities
- `logOnly()`: Specifies which attributes to log (excludes password)
- `logOnlyDirty()`: Only logs attributes that actually changed
- `dontSubmitEmptyLogs()`: Prevents empty logs when nothing changed
- `useLogName()`: Sets the log name for filtering
- `setDescriptionForEvent()`: Customizes event descriptions

## Usage Examples

### 1. Automatic Logging

Model changes are logged automatically:

```php
// Creating a user - automatically logged
$user = User::create([
    'first_name' => 'John',
    'last_name' => 'Doe',
    'email' => 'john@example.com',
    'password' => 'password123',
]);
// Activity log: "User account created"

// Updating a user - automatically logged
$user->status = 'inactive';
$user->save();
// Activity log: "User profile updated"

// Only changed attributes are logged
$user->first_name = 'Jane'; // Changed
$user->last_name = 'Doe';   // Not changed
$user->save();
// Only first_name change is logged
```

### 2. Custom Activity Logging

#### Using the Activity Helper

```php
// Log a custom activity
activity()
    ->causedBy($user)
    ->performedOn($someModel)
    ->withProperties(['key' => 'value'])
    ->log('Custom description');

// Log a user login
activity('user')
    ->causedBy($user)
    ->log('User logged in');

// Log a password change
activity('user')
    ->causedBy($user)
    ->performedOn($user)
    ->withProperties(['ip_address' => request()->ip()])
    ->log('User changed password');
```

#### Using the ActivityLogService

```php
use App\Services\ActivityLogService;

$activityLogService = app(ActivityLogService::class);

// Log user activity
$activityLogService->logUserActivity(
    $user,
    'User completed onboarding',
    $user,
    ['steps_completed' => 5]
);

// Log admin activity
$activityLogService->logAdminActivity(
    $admin,
    'Admin banned user',
    $user,
    [
        'reason' => 'Violation of terms',
        'duration' => '30 days',
    ]
);
```

### 3. Context-Specific Logging

#### Authentication Events

```php
// In your AuthController
public function login(Request $request)
{
    // ... authentication logic ...

    activity('user')
        ->causedBy($user)
        ->withProperties([
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ])
        ->log('User logged in');

    return response()->json(['success' => true]);
}
```

#### Password Changes

```php
public function updatePassword(Request $request)
{
    $user = auth()->user();

    // ... password update logic ...

    activity('user')
        ->causedBy($user)
        ->performedOn($user)
        ->withProperties([
            'ip_address' => $request->ip(),
            'changed_at' => now(),
        ])
        ->log('User changed password');

    return response()->json(['success' => true]);
}
```

#### Admin Actions on Users

```php
public function banUser(Request $request, int $userId)
{
    $admin = auth()->guard('admin')->user();
    $user = User::findOrFail($userId);

    $user->status = 'banned';
    $user->save();

    activity('admin')
        ->causedBy($admin)
        ->performedOn($user)
        ->withProperties([
            'reason' => $request->input('reason'),
            'duration' => $request->input('duration'),
            'admin_name' => $admin->name,
        ])
        ->log("Admin banned user: {$user->name}");

    return response()->json(['success' => true]);
}
```

## Service Layer

The `ActivityLogService` provides convenient methods for activity management.

File: `/var/www/app/Services/ActivityLogService.php`

### Available Methods

#### Log Activities

```php
// Generic logging
$activityLogService->log(
    $causer,           // User or Admin model
    $description,      // Activity description
    $subject,          // Subject model (optional)
    $properties,       // Additional properties (optional)
    $logName          // Log name (optional, default: 'default')
);

// User-specific logging
$activityLogService->logUserActivity(
    $user,
    'User performed action',
    $subject,
    ['key' => 'value']
);

// Admin-specific logging
$activityLogService->logAdminActivity(
    $admin,
    'Admin performed action',
    $subject,
    ['key' => 'value']
);
```

#### Query Activities

```php
// Get activities for a specific user/admin
$activities = $activityLogService->getActivitiesForCauser($user);
$activities = $activityLogService->getActivitiesForCauser($admin, 10); // Limit to 10

// Get activities for a specific subject (model)
$activities = $activityLogService->getActivitiesForSubject($model);

// Get activities by log name
$userActivities = $activityLogService->getUserActivities(50);
$adminActivities = $activityLogService->getAdminActivities(50);

// Get activities by custom log name
$activities = $activityLogService->getActivitiesByLogName('custom_log');
```

#### Maintenance

```php
// Delete old activities (older than specified days)
$deletedCount = $activityLogService->deleteOldActivities(365);
```

## Controller Integration

### Example: AdminUserController

File: `/var/www/app/Http/Controllers/Admin/AdminUserController.php`

```php
use App\Services\ActivityLogService;

class AdminUserController extends Controller
{
    public function __construct(
        private readonly ActivityLogService $activityLogService
    ) {
    }

    public function store(CreateAdminData $data): JsonResponse
    {
        $currentAdmin = Auth::guard('admin')->user();

        $admin = Admin::create([
            'first_name' => $data->first_name,
            'last_name' => $data->last_name,
            'email' => $data->email,
            'password' => $password,
            'role' => $data->role,
            'status' => 'active',
        ]);

        // Log the activity
        $this->activityLogService->logAdminActivity(
            $currentAdmin,
            "Created admin user: {$admin->name} (Role: {$admin->role})",
            $admin,
            [
                'admin_id' => $admin->id,
                'admin_email' => $admin->email,
                'admin_role' => $admin->role,
                'created_by' => $currentAdmin->name,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Admin user created successfully.',
            'data' => DetailedAdminData::from($admin),
        ], 201);
    }

    public function update(UpdateAdminUserRequest $request, int $id): JsonResponse
    {
        $currentAdmin = Auth::guard('admin')->user();
        $admin = Admin::findOrFail($id);

        // Store original values for logging
        $originalValues = $admin->only(array_keys($validated));

        $admin->fill($validated);
        $admin->save();

        // Log the activity
        $this->activityLogService->logAdminActivity(
            $currentAdmin,
            "Updated admin user: {$admin->name}",
            $admin,
            [
                'admin_id' => $admin->id,
                'updated_fields' => array_keys($validated),
                'original_values' => $originalValues,
                'new_values' => $admin->only(array_keys($validated)),
                'updated_by' => $currentAdmin->name,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Admin user updated successfully.',
            'data' => DetailedAdminData::from($admin),
        ], 200);
    }
}
```

## Querying Activity Logs

### Using Eloquent

```php
use Spatie\Activitylog\Models\Activity;

// Get all activities
$activities = Activity::all();

// Get activities for a specific user
$activities = Activity::where('causer_type', User::class)
    ->where('causer_id', $userId)
    ->orderBy('created_at', 'desc')
    ->get();

// Get activities for a specific subject
$activities = Activity::where('subject_type', User::class)
    ->where('subject_id', $userId)
    ->get();

// Get activities by log name
$userActivities = Activity::where('log_name', 'user')->get();
$adminActivities = Activity::where('log_name', 'admin')->get();

// Get activities within a date range
$activities = Activity::whereBetween('created_at', [
    now()->subDays(7),
    now(),
])->get();

// Get activities with specific properties
$activities = Activity::where('properties->key', 'value')->get();
```

### Activity Model Relationships

```php
// Get the causer (user/admin who performed the action)
$activity = Activity::find(1);
$causer = $activity->causer; // Returns User or Admin model

// Get the subject (model that was acted upon)
$subject = $activity->subject;

// Check causer type
if ($activity->causer instanceof User) {
    // Action performed by a user
} elseif ($activity->causer instanceof Admin) {
    // Action performed by an admin
}
```

### Accessing Activity Properties

```php
$activity = Activity::find(1);

// Description
$description = $activity->description;

// Properties (stored as JSON)
$properties = $activity->properties; // Collection

// Get specific property
$ipAddress = $activity->properties['ip_address'] ?? null;

// Get all changes
$attributes = $activity->properties->get('attributes'); // New values
$old = $activity->properties->get('old'); // Old values

// Check what changed
$changes = $activity->changes(); // Returns both old and new values
```

## API Endpoints

### Activity Log Controller

File: `/var/www/app/Http/Controllers/Admin/AdminActivityLogController.php`

Add these routes to `/var/www/routes/web.php`:

```php
Route::prefix('admin/api')->middleware(['auth:admin', 'admin.authenticate'])->group(function () {
    // Activity logs
    Route::get('/activities', [AdminActivityLogController::class, 'index']);
    Route::get('/activities/users', [AdminActivityLogController::class, 'userActivities']);
    Route::get('/activities/admins', [AdminActivityLogController::class, 'adminActivities']);
    Route::get('/activities/user/{userId}', [AdminActivityLogController::class, 'userActivity']);
    Route::get('/activities/admin/{adminId}', [AdminActivityLogController::class, 'adminActivity']);
    Route::get('/activities/{id}', [AdminActivityLogController::class, 'show']);
    Route::post('/activities/clean', [AdminActivityLogController::class, 'clean']);
});
```

### API Usage Examples

#### Get All Activities

```bash
GET /admin/api/activities?limit=50&log_name=user
```

Response:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "log_name": "user",
            "description": "User account created",
            "subject_type": "App\\Models\\User",
            "subject_id": 1,
            "causer_type": null,
            "causer_id": null,
            "properties": {},
            "created_at": "2025-10-14T08:57:00.000000Z"
        }
    ]
}
```

#### Get User-Specific Activities

```bash
GET /admin/api/activities/user/1
```

#### Get Admin-Specific Activities

```bash
GET /admin/api/activities/admin/1
```

#### Clean Old Activities

```bash
POST /admin/api/activities/clean
Content-Type: application/json

{
    "days": 365
}
```

Response:
```json
{
    "success": true,
    "message": "Deleted 150 old activity logs",
    "deleted_count": 150
}
```

## Testing

Comprehensive tests have been created in `/var/www/tests/Feature/ActivityLogTest.php`.

### Run Tests

```bash
# Run all activity log tests
php artisan test --filter=ActivityLogTest

# Run specific test
php artisan test --filter=test_user_creation_is_logged
```

### Test Coverage

- User creation logging
- User update logging
- Admin creation logging
- Admin update logging
- Custom user activity logging
- Custom admin activity logging
- Retrieving activities for users
- Retrieving activities for admins
- Filtering activities by log name
- Limiting activity results
- Only dirty attributes logging
- Password exclusion from logs

## Maintenance

### Clean Old Activity Logs

#### Using the Service

```php
$activityLogService = app(ActivityLogService::class);
$deletedCount = $activityLogService->deleteOldActivities(365); // Keep last 365 days
```

#### Using Artisan Command

Create a custom artisan command for scheduled cleanup:

```php
// app/Console/Commands/CleanActivityLogs.php
namespace App\Console\Commands;

use App\Services\ActivityLogService;
use Illuminate\Console\Command;

class CleanActivityLogs extends Command
{
    protected $signature = 'activitylog:clean {--days=365}';
    protected $description = 'Clean old activity logs';

    public function handle(ActivityLogService $activityLogService): int
    {
        $days = (int) $this->option('days');
        $deletedCount = $activityLogService->deleteOldActivities($days);

        $this->info("Deleted {$deletedCount} old activity logs (older than {$days} days)");

        return 0;
    }
}
```

#### Schedule Regular Cleanup

Add to `/var/www/app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule): void
{
    // Clean activity logs older than 1 year, daily at 2 AM
    $schedule->command('activitylog:clean --days=365')->dailyAt('02:00');
}
```

### Database Indexing

For better query performance on large activity logs, consider adding indexes:

```php
// In a migration file
Schema::table('activity_log', function (Blueprint $table) {
    $table->index(['causer_type', 'causer_id']);
    $table->index(['subject_type', 'subject_id']);
    $table->index('log_name');
    $table->index('created_at');
});
```

## Best Practices

1. **Be Descriptive**: Use clear, human-readable descriptions for activities
2. **Include Context**: Add relevant properties (IP address, user agent, etc.)
3. **Use Log Names**: Separate user and admin activities with distinct log names
4. **Exclude Sensitive Data**: Never log passwords or sensitive information
5. **Regular Cleanup**: Schedule regular cleanup of old activity logs
6. **Test Thoroughly**: Write tests for critical activity logging
7. **Monitor Performance**: Index frequently queried columns
8. **Use Service Layer**: Utilize `ActivityLogService` for consistency
9. **Document Custom Activities**: Keep track of custom activity types
10. **Review Regularly**: Periodically review activity logs for anomalies

## Database Schema

The `activity_log` table structure:

```sql
CREATE TABLE `activity_log` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `log_name` varchar(255) DEFAULT NULL,
    `description` text NOT NULL,
    `subject_type` varchar(255) DEFAULT NULL,
    `subject_id` bigint unsigned DEFAULT NULL,
    `causer_type` varchar(255) DEFAULT NULL,
    `causer_id` bigint unsigned DEFAULT NULL,
    `properties` json DEFAULT NULL,
    `event` varchar(255) DEFAULT NULL,
    `batch_uuid` char(36) DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `subject` (`subject_type`, `subject_id`),
    KEY `causer` (`causer_type`, `causer_id`),
    KEY `activity_log_log_name_index` (`log_name`)
);
```

## Additional Resources

- [Spatie Activity Log Documentation](https://spatie.be/docs/laravel-activitylog/v4/introduction)
- [Laravel Eloquent Documentation](https://laravel.com/docs/eloquent)
- [Laravel Testing Documentation](https://laravel.com/docs/testing)

## Support

For issues or questions:
1. Review this documentation
2. Check the official Spatie documentation
3. Review test cases for examples
4. Consult the service layer implementation

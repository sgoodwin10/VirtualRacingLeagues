# Activity Log Quick Reference Guide

## Quick Start

### 1. Automatic Logging (Already Configured)

User and Admin models automatically log changes:

```php
// User creation - automatically logged
$user = User::create([...]);

// User update - automatically logged
$user->status = 'inactive';
$user->save();
```

### 2. Manual Activity Logging

#### Using the Helper Function

```php
// Simple log
activity('user')
    ->causedBy($user)
    ->log('User logged in');

// With subject and properties
activity('admin')
    ->causedBy($admin)
    ->performedOn($user)
    ->withProperties(['reason' => 'Banned', 'duration' => '30 days'])
    ->log('Admin banned user');
```

#### Using the Service

```php
use App\Services\ActivityLogService;

$service = app(ActivityLogService::class);

// Log user activity
$service->logUserActivity(
    $user,
    'User completed action',
    $targetModel,
    ['key' => 'value']
);

// Log admin activity
$service->logAdminActivity(
    $admin,
    'Admin performed action',
    $targetModel,
    ['key' => 'value']
);
```

## Querying Activities

### Using the Service

```php
$service = app(ActivityLogService::class);

// Get activities for a user/admin
$activities = $service->getActivitiesForCauser($user);
$activities = $service->getActivitiesForCauser($admin, 10); // limit to 10

// Get activities by log name
$userActivities = $service->getUserActivities(50);
$adminActivities = $service->getAdminActivities(50);

// Get activities for a subject
$activities = $service->getActivitiesForSubject($model);
```

### Using Eloquent

```php
use Spatie\Activitylog\Models\Activity;

// Get all user activities
Activity::where('log_name', 'user')->get();

// Get activities for specific user
Activity::where('causer_type', User::class)
    ->where('causer_id', $userId)
    ->orderBy('created_at', 'desc')
    ->get();

// Get recent activities
Activity::where('created_at', '>=', now()->subDays(7))->get();
```

## Common Use Cases

### 1. Login Activity

```php
activity('user')
    ->causedBy($user)
    ->withProperties([
        'ip_address' => request()->ip(),
        'user_agent' => request()->userAgent(),
    ])
    ->log('User logged in');
```

### 2. Password Change

```php
activity('user')
    ->causedBy($user)
    ->performedOn($user)
    ->withProperties(['ip_address' => request()->ip()])
    ->log('User changed password');
```

### 3. Admin Action on User

```php
activity('admin')
    ->causedBy($admin)
    ->performedOn($user)
    ->withProperties([
        'action' => 'status_change',
        'old_status' => $oldStatus,
        'new_status' => $newStatus,
        'admin_name' => $admin->name,
    ])
    ->log("Admin updated user status");
```

### 4. Data Export

```php
activity('user')
    ->causedBy($user)
    ->withProperties([
        'export_type' => 'csv',
        'records_count' => $count,
    ])
    ->log('User exported data');
```

## API Endpoints (Add to routes/web.php)

```php
Route::prefix('admin/api/activities')->middleware(['auth:admin'])->group(function () {
    Route::get('/', [AdminActivityLogController::class, 'index']);
    Route::get('/users', [AdminActivityLogController::class, 'userActivities']);
    Route::get('/admins', [AdminActivityLogController::class, 'adminActivities']);
    Route::get('/user/{userId}', [AdminActivityLogController::class, 'userActivity']);
    Route::get('/admin/{adminId}', [AdminActivityLogController::class, 'adminActivity']);
    Route::get('/{id}', [AdminActivityLogController::class, 'show']);
    Route::post('/clean', [AdminActivityLogController::class, 'clean']);
});
```

## Artisan Commands

```bash
# Clean old activity logs (keep last 365 days)
php artisan activitylog:clean

# Clean old activity logs (custom days)
php artisan activitylog:clean --days=180

# Run tests
php artisan test --filter=ActivityLogTest
```

## Accessing Activity Data

```php
$activity = Activity::find(1);

// Basic info
$activity->description;        // "User logged in"
$activity->log_name;          // "user"
$activity->event;             // "created", "updated", "deleted"
$activity->created_at;        // Carbon timestamp

// Relationships
$activity->causer;            // User or Admin who caused the activity
$activity->subject;           // Model that was acted upon

// Properties (JSON data)
$activity->properties;                      // Collection
$activity->properties['ip_address'];       // Get specific property
$activity->properties->get('key');         // Alternative syntax

// Changes
$activity->properties->get('attributes');  // New values
$activity->properties->get('old');         // Old values
```

## Configuration

### Logged Attributes

Edit models to control what's logged:

```php
public function getActivitylogOptions(): LogOptions
{
    return LogOptions::defaults()
        ->logOnly(['first_name', 'last_name', 'email', 'status'])
        ->logOnlyDirty()           // Only log changed attributes
        ->dontSubmitEmptyLogs()    // Don't log if nothing changed
        ->useLogName('user');      // Set log name
}
```

### Config File

Location: `/var/www/config/activitylog.php`

```php
'enabled' => env('ACTIVITY_LOGGER_ENABLED', true),
'delete_records_older_than_days' => 365,
'default_log_name' => 'default',
```

## Best Practices

1. **Use descriptive log names**: `user`, `admin`, `system`
2. **Include context**: IP address, user agent, timestamps
3. **Don't log sensitive data**: Passwords, tokens, etc.
4. **Clean regularly**: Schedule cleanup command
5. **Index for performance**: Add indexes on frequently queried columns
6. **Test thoroughly**: Write tests for critical logging

## Files Created

- `/var/www/app/Services/ActivityLogService.php` - Service layer
- `/var/www/app/Http/Controllers/Admin/AdminActivityLogController.php` - API controller
- `/var/www/app/Console/Commands/CleanActivityLogs.php` - Cleanup command
- `/var/www/tests/Feature/ActivityLogTest.php` - Tests
- `/var/www/ACTIVITY_LOG_DOCUMENTATION.md` - Full documentation

## Example Controller Integration

```php
use App\Services\ActivityLogService;

class MyController extends Controller
{
    public function __construct(
        private readonly ActivityLogService $activityLogService
    ) {}

    public function myAction(Request $request)
    {
        $user = auth()->user();

        // Perform your action...

        // Log the activity
        $this->activityLogService->logUserActivity(
            $user,
            'Description of action',
            $targetModel,
            ['additional' => 'properties']
        );

        return response()->json(['success' => true]);
    }
}
```

## Testing Example

```php
public function test_activity_is_logged(): void
{
    $user = User::factory()->create();

    activity('user')
        ->causedBy($user)
        ->log('Test activity');

    $this->assertDatabaseHas('activity_log', [
        'causer_type' => User::class,
        'causer_id' => $user->id,
        'description' => 'Test activity',
        'log_name' => 'user',
    ]);
}
```

## Troubleshooting

### Activities not being logged?
- Check `config/activitylog.php` - ensure `enabled` is `true`
- Verify models have `LogsActivity` trait
- Check `getActivitylogOptions()` method configuration

### Performance issues?
- Add database indexes
- Schedule regular cleanup
- Limit query results
- Consider archiving old logs

### Testing issues?
- Use `RefreshDatabase` trait
- Clear activities between tests: `Activity::query()->delete()`
- Check database state after operations

## Additional Resources

- Full Documentation: `/var/www/ACTIVITY_LOG_DOCUMENTATION.md`
- Route Examples: `/var/www/ACTIVITY_LOG_ROUTES_EXAMPLE.php`
- Official Docs: https://spatie.be/docs/laravel-activitylog/v4

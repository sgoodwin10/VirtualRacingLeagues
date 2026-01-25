# Delete Driver Feature - Backend Implementation Plan

## Overview

Change the driver deletion behavior from deleting `league_drivers` relationship to soft-deleting the driver record while preserving all relationships.

## Current Flow Analysis

### Current `removeDriverFromLeague()` Flow:
```
User clicks "Remove Driver"
    ↓
DriverController::destroy()
    ↓
DriverApplicationService::removeDriverFromLeagueWithActivityLog()
    ↓
DriverApplicationService::removeDriverFromLeague()
    ↓
DriverRepository::removeFromLeague()
    ↓
DELETE FROM league_drivers WHERE league_id = ? AND driver_id = ?  ← PROBLEM!
```

### Desired Flow (Delete):
```
User clicks "Delete Driver" (renamed action)
    ↓
DriverController::destroy()
    ↓
DriverApplicationService::deleteDriverFromLeagueWithActivityLog()
    ↓
DriverApplicationService::deleteDriverFromLeague()
    ↓
DriverRepository::softDeleteDriver() (new method)
    ↓
UPDATE drivers SET deleted_at = NOW() WHERE id = ?  ← CORRECT!
```

### Desired Flow (Restore):
```
User clicks "Restore Driver" (new action, visible for deleted drivers)
    ↓
DriverController::restore() (new method)
    ↓
DriverApplicationService::restoreDriverWithActivityLog()
    ↓
DriverApplicationService::restoreDriver()
    ↓
DriverRepository::restoreDriver() (new method)
    ↓
UPDATE drivers SET deleted_at = NULL WHERE id = ?
```

## Implementation Steps

### Step 1: Update Domain Layer

**File: `app/Domain/Driver/Entities/Driver.php`**
- Verify `delete()` method exists and sets `deletedAt` timestamp
- Already exists: `markAsDeleted()` or similar

**File: `app/Domain/Driver/Events/DriverDeleted.php`** (if needed)
- Create event for driver soft-deletion if activity logging needs it

**File: `app/Domain/Driver/Events/DriverRestored.php`** (new)
- Create event for driver restoration for activity logging

### Step 2: Update Repository Layer

**File: `app/Domain/Driver/Repositories/DriverRepositoryInterface.php`**
- Add method signature: `softDeleteDriver(int $driverId): void`
- Add method signature: `restoreDriver(int $driverId): void` (new)
- Keep `removeFromLeague()` for potential future "remove from league but don't delete driver" use case

**File: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentDriverRepository.php`**

Current method (line 380-386):
```php
public function removeFromLeague(int $leagueId, int $driverId): void
{
    DB::table('league_drivers')
        ->where('league_id', $leagueId)
        ->where('driver_id', $driverId)
        ->delete();
}
```

Add new methods:
```php
public function softDeleteDriver(int $driverId): void
{
    DriverEloquent::where('id', $driverId)
        ->update(['deleted_at' => now()]);
}

public function restoreDriver(int $driverId): void
{
    DriverEloquent::withTrashed()
        ->where('id', $driverId)
        ->update(['deleted_at' => null]);
}
```

**Update getLeagueDrivers() query (line 196-199)**:
- Current: `->whereNull('drivers.deleted_at')` - filters OUT deleted
- Change: Add optional `includeDeleted` parameter or filter parameter
- When fetching for list view: filter by status
- When fetching for results/standings: include all

### Step 3: Update Application Layer

**File: `app/Application/Driver/Services/DriverApplicationService.php`**

Change `removeDriverFromLeague()` (lines 318-338):
```php
// BEFORE: Removes league_drivers relationship
public function removeDriverFromLeague(int $leagueId, int $driverId, int $userId): void
{
    $this->authorizeLeagueAccess($leagueId, $userId);
    DB::transaction(function () use ($leagueId, $driverId) {
        $result = $this->driverRepository->getLeagueDriver($leagueId, $driverId);
        $driver = $result['driver'];
        $this->driverRepository->removeFromLeague($leagueId, $driverId);  // ← DELETE
        Event::dispatch(new DriverRemovedFromLeague(...));
    });
}

// AFTER: Soft-deletes the driver, preserves relationships
public function deleteDriverFromLeague(int $leagueId, int $driverId, int $userId): void
{
    $this->authorizeLeagueAccess($leagueId, $userId);
    DB::transaction(function () use ($leagueId, $driverId) {
        $result = $this->driverRepository->getLeagueDriver($leagueId, $driverId);
        $driver = $result['driver'];

        // Soft delete the driver (preserves league_drivers relationship)
        $driver->delete();  // Sets deletedAt
        $this->driverRepository->save($driver);

        Event::dispatch(new DriverDeleted(
            driverId: $driverId,
            displayName: $driver->name()->displayName()
        ));
    });
}
```

**Update `getLeagueDrivers()` (lines 137-166)**:
- Add `?string $deletedStatus = 'active'` parameter
- Values: `'active'` (default), `'deleted'`, `'all'`
- Modify repository call to pass filter

**Update activity log method** `removeDriverFromLeagueWithActivityLog()`:
- Rename to `deleteDriverFromLeagueWithActivityLog()`
- Update logging message from "removed from league" to "deleted"

**Add new restore methods:**
```php
/**
 * Restore a soft-deleted driver.
 */
public function restoreDriver(int $leagueId, int $driverId, int $userId): void
{
    $this->authorizeLeagueAccess($leagueId, $userId);

    DB::transaction(function () use ($driverId) {
        $driver = $this->driverRepository->findById($driverId);  // withTrashed

        if ($driver->deletedAt() === null) {
            throw new \InvalidArgumentException('Driver is not deleted');
        }

        $driver->restore();  // Clears deletedAt
        $this->driverRepository->save($driver);

        Event::dispatch(new DriverRestored(
            driverId: $driverId,
            displayName: $driver->name()->displayName()
        ));
    });
}

/**
 * Restore driver with activity logging.
 */
public function restoreDriverWithActivityLog(int $leagueId, int $driverId, int $userId): void
{
    $this->restoreDriver($leagueId, $driverId, $userId);

    // Log activity
    try {
        $user = Auth::user();
        if ($user instanceof UserEloquent) {
            $driver = $this->driverRepository->findById($driverId);
            $this->activityLogService->logDriverRestored($user, $leagueId, $driver);
        }
    } catch (\Exception $e) {
        Log::error('Failed to log driver restore activity', [...]);
    }
}
```

### Step 4: Update Controller Layer

**File: `app/Http/Controllers/User/DriverController.php`**

Update `index()` method (lines 50-89):
- Add `'deleted_status'` validation: `['nullable', 'in:active,deleted,all']`
- Default to `'active'`
- Pass to application service

Update `destroy()` method (lines 153-167):
- Change method call from `removeDriverFromLeagueWithActivityLog` to `deleteDriverFromLeagueWithActivityLog`
- Update success message to "Driver deleted successfully"

**Add new `restore()` method:**
```php
/**
 * Restore a soft-deleted driver.
 */
public function restore(int $league, int $driver): JsonResponse
{
    try {
        $this->driverService->restoreDriverWithActivityLog(
            $league,
            $driver,
            $this->getAuthenticatedUserId()
        );
        return ApiResponse::success(null, 'Driver restored successfully');
    } catch (DriverNotFoundException $e) {
        return ApiResponse::error($e->getMessage(), null, 404);
    } catch (UnauthorizedException $e) {
        return ApiResponse::error($e->getMessage(), null, 403);
    } catch (\InvalidArgumentException $e) {
        return ApiResponse::error($e->getMessage(), null, 422);
    }
}
```

### Step 5: Update Queries for Historical Data

**Identify all queries that fetch drivers for results/standings**:

Search for locations that need to include deleted drivers:
1. Race results queries
2. Standings calculations
3. Championship points
4. Division/team assignments
5. Public site data fetching

**File: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentDriverRepository.php`**

Update methods that need to include deleted drivers:
- `getLeagueDriver()` - Should use `withTrashed()` for single lookups
- `getLeagueDrivers()` - Add parameter to control deleted filtering
- Any methods used for results/standings

**File: `app/Application/Competition/Services/*` (if applicable)**
- Verify standing calculations include deleted drivers
- Verify result queries include deleted drivers

### Step 6: Verify Query Behavior

Queries that SHOULD filter deleted (default):
- League driver list (user management view)
- Driver search/autocomplete (when adding to season)
- Available drivers dropdown

Queries that should NOT filter deleted:
- Race results display
- Championship standings
- Historical season data
- Admin global driver list (already correct)

### Step 7: Update Tests

**File: `tests/Feature/Http/Controllers/User/DriverControllerTest.php`**
- Update existing delete tests to verify soft-delete behavior
- Add test: deleted driver still appears in race results
- Add test: deleted driver filtered from active list
- Add test: deleted driver shows in deleted filter

**File: `tests/Unit/Application/Driver/Services/DriverApplicationServiceTest.php`** (if exists)
- Test soft-delete logic
- Test relationship preservation

## API Changes

### Updated Endpoint: `GET /api/leagues/{league}/drivers`

**New Query Parameter:**
```
deleted_status: 'active' | 'deleted' | 'all' (default: 'active')
```

**Request Example:**
```
GET /api/leagues/1/drivers?deleted_status=deleted
```

### Updated Endpoint: `DELETE /api/leagues/{league}/drivers/{driver}`

**Behavior Change:**
- Before: Deleted `league_drivers` row
- After: Sets `deleted_at` on `drivers` row

**Response (unchanged):**
```json
{
  "success": true,
  "message": "Driver deleted successfully"
}
```

### New Endpoint: `POST /api/leagues/{league}/drivers/{driver}/restore`

**Purpose:** Restore a soft-deleted driver

**Request:** No body required

**Response:**
```json
{
  "success": true,
  "message": "Driver restored successfully"
}
```

**Error Responses:**
- `404`: Driver not found
- `403`: Unauthorized (not league owner)
- `422`: Driver is not deleted (cannot restore active driver)

## Route Configuration

**File: `routes/subdomain.php`**

Add new route for restore endpoint in the app subdomain section:
```php
Route::post('/leagues/{league}/drivers/{driver}/restore', [DriverController::class, 'restore'])
    ->name('leagues.drivers.restore');
```

## Migration Considerations

No database migration needed - the `deleted_at` column already exists on `drivers` table.

However, consider:
1. Any drivers previously "removed" have lost their `league_drivers` records
2. This is historical data that cannot be recovered without backups
3. Going forward, the new behavior will preserve relationships

## Testing Checklist

### Delete Functionality
- [ ] Deleting driver sets `deleted_at` timestamp
- [ ] Deleting driver preserves `league_drivers` record
- [ ] Deleting driver preserves `season_drivers` record
- [ ] Deleted driver appears in race results
- [ ] Deleted driver appears in standings
- [ ] Active filter shows only non-deleted drivers
- [ ] Deleted filter shows only deleted drivers
- [ ] All filter shows all drivers
- [ ] Activity log records deletion correctly
- [ ] Admin can still see/manage deleted drivers

### Restore Functionality
- [ ] Restoring driver clears `deleted_at` timestamp
- [ ] Restoring driver preserves all relationships
- [ ] Restored driver appears in active driver list
- [ ] Cannot restore an already active driver (returns 422)
- [ ] Activity log records restoration correctly
- [ ] Only league owner can restore drivers (auth check)
- [ ] Restore endpoint returns correct success message

## Files to Modify

| File | Change Type |
|------|-------------|
| `app/Domain/Driver/Entities/Driver.php` | Add `restore()` method if not exists |
| `app/Domain/Driver/Events/DriverDeleted.php` | Create (if needed) |
| `app/Domain/Driver/Events/DriverRestored.php` | Create (new) |
| `app/Domain/Driver/Repositories/DriverRepositoryInterface.php` | Add methods |
| `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentDriverRepository.php` | Add methods, modify queries |
| `app/Application/Driver/Services/DriverApplicationService.php` | Modify deletion logic, add restore logic |
| `app/Application/Activity/Services/LeagueActivityLogService.php` | Add `logDriverRestored()` method |
| `app/Http/Controllers/User/DriverController.php` | Add filter param, update destroy, add restore |
| `routes/subdomain.php` | Add restore route |
| `tests/Feature/Http/Controllers/User/DriverControllerTest.php` | Update tests, add restore tests |
| `tests/Unit/Application/Driver/DTOs/` | May need updates |

## Agent Assignment

**Use `dev-be` agent for:**
1. All repository changes
2. All application service changes
3. Controller modifications
4. Backend test updates
5. Query verification for results/standings

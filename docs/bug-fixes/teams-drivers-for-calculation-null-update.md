# Bug Fix: teams_drivers_for_calculation NULL Update Issue

## Problem Description

When updating a season's `teams_drivers_for_calculation` field:
- Saving an integer value (e.g., 2) worked correctly
- Changing it back to "All" (which should save NULL) did NOT update the database record
- The value remained as the previous integer value instead of being set to NULL

## Root Cause

The issue was in `SeasonApplicationService::updateSeason()` at line 239 (original):

```php
// 5f. Handle teams drivers for calculation update
if ($data->teams_drivers_for_calculation !== null) {
    $season->updateTeamsDriversForCalculation($data->teams_drivers_for_calculation);
}
```

**The problem**: This condition only updates when the value is NOT null. When the user selects "All" (which sends `null`), the condition evaluates to `false` and skips the update entirely.

**The challenge**: Laravel Data (Spatie) doesn't distinguish between:
- Field not present in request (should skip update)
- Field present with `null` value (should update to null)

Both cases result in `$data->teams_drivers_for_calculation === null`.

## Solution

We implemented a key-existence check to distinguish between "field not provided" and "field provided with null value":

### 1. Updated Application Service Method Signature

**File**: `/var/www/app/Application/Competition/Services/SeasonApplicationService.php`

```php
public function updateSeason(int $id, UpdateSeasonData $data, int $userId, array $requestData = []): SeasonData
```

Added `array $requestData = []` parameter to access the original request data.

### 2. Updated Condition Logic

Changed from:
```php
if ($data->teams_drivers_for_calculation !== null) {
    $season->updateTeamsDriversForCalculation($data->teams_drivers_for_calculation);
}
```

To:
```php
// Check if field was present in request (not just non-null)
// This allows us to distinguish between "not provided" and "provided as null"
if (array_key_exists('teams_drivers_for_calculation', $requestData)) {
    $season->updateTeamsDriversForCalculation($data->teams_drivers_for_calculation);
}
```

### 3. Updated Controller to Pass Request Data

**File**: `/var/www/app/Http/Controllers/User/SeasonController.php`

```php
public function update(Request $request, int $id): JsonResponse
{
    $validated = $request->validate(UpdateSeasonData::rules());
    $data = UpdateSeasonData::from($validated);
    $season = $this->seasonService->updateSeason($id, $data, $this->getAuthenticatedUserId(), $validated);
    return ApiResponse::success($season->toArray(), 'Season updated successfully');
}
```

Passed `$validated` as the fourth parameter to the service method.

## Testing

Added three comprehensive tests to verify the fix:

### Test 1: Update from Integer to NULL
```php
test_user_can_update_teams_drivers_for_calculation_to_null()
```
- Creates season with `teams_drivers_for_calculation = 2`
- Updates to `null` (meaning "All")
- Verifies database contains `null`
- Verifies API response contains `null`

### Test 2: Update from NULL to Integer
```php
test_user_can_update_teams_drivers_for_calculation_from_null_to_integer()
```
- Creates season with `teams_drivers_for_calculation = null`
- Updates to `3`
- Verifies database contains `3`
- Verifies API response contains `3`

### Test 3: Field Not Provided Preserves Existing Value
```php
test_updating_season_without_teams_drivers_for_calculation_does_not_change_existing_value()
```
- Creates season with `teams_drivers_for_calculation = 2`
- Updates other fields WITHOUT including `teams_drivers_for_calculation`
- Verifies database still contains `2` (unchanged)

## Test Results

All tests pass successfully:

```
✓ user can update teams drivers for calculation to null
✓ user can update teams drivers for calculation from null to integer
✓ updating season without teams drivers for calculation does not change existing value
```

Full test suite also passes (17 tests, 55 assertions).

## Code Quality Checks

- **PHPStan Level 8**: ✅ No errors
- **PHPCS PSR-12**: ✅ No errors on changed lines
- **All existing tests**: ✅ Pass

## Files Modified

1. `/var/www/app/Application/Competition/Services/SeasonApplicationService.php`
   - Updated `updateSeason()` method signature
   - Updated condition for `teams_drivers_for_calculation` update

2. `/var/www/app/Http/Controllers/User/SeasonController.php`
   - Updated `update()` method to pass validated request data

3. `/var/www/tests/Feature/Http/Controllers/User/SeasonControllerTest.php`
   - Added 3 new tests for the NULL update behavior

## Alternative Solutions Considered

### Option 1: Use Optional DTO Pattern
Create a wrapper class to track whether a value was provided:
```php
class Optional {
    public static function present($value): array {
        return ['present' => true, 'value' => $value];
    }
    public static function absent(): array {
        return ['present' => false, 'value' => null];
    }
}
```
**Rejected**: Too complex for this use case.

### Option 2: Use Present Keys Check (Selected)
Check if the key exists in the original request data using `array_key_exists()`.
**Selected**: Simplest and most pragmatic solution.

### Option 3: Use Sentinel Value
Use a special value like `-1` to represent "All".
**Rejected**: Violates domain model (NULL is the correct representation for "All").

## Impact

This fix resolves the issue where users could not change `teams_drivers_for_calculation` from a specific number back to "All" (NULL). The fix:

- ✅ Allows updating from integer to NULL
- ✅ Allows updating from NULL to integer
- ✅ Preserves existing value when field is not provided
- ✅ Maintains backward compatibility
- ✅ Follows DDD principles
- ✅ Has comprehensive test coverage

## Related Domain Logic

The `Season` entity's `updateTeamsDriversForCalculation()` method correctly handles NULL values:

```php
public function updateTeamsDriversForCalculation(?int $count): void
{
    if ($this->status->isArchived()) {
        throw SeasonIsArchivedException::withId($this->id ?? 0);
    }

    if ($this->teamsDriversForCalculation !== $count) {
        $oldCount = $this->teamsDriversForCalculation;
        $this->teamsDriversForCalculation = $count;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new SeasonUpdated(
            seasonId: $this->id ?? 0,
            competitionId: $this->competitionId,
            changes: ['teams_drivers_for_calculation' => ['old' => $oldCount, 'new' => $count]],
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }
}
```

The domain entity correctly accepts `?int $count` (nullable integer) and handles NULL values properly. The bug was solely in the application service layer's conditional logic.

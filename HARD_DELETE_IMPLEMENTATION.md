# Hard Delete Implementation for Rounds

## Overview
Implemented hard delete functionality for rounds with cascade deletion of all related races and race results. This replaces the previous soft delete behavior.

## Changes Made

### 1. Repository Layer (`EloquentRoundRepository.php`)
- **Changed**: Updated `delete()` method to use `forceDelete()` instead of soft delete
- **Added**: `withTrashed()` query to ensure soft-deleted records can also be force-deleted
- **Documentation**: Updated method documentation to clarify hard delete behavior

```php
public function delete(Round $round): void
{
    if ($round->id() === null) {
        return;
    }

    /** @var RoundEloquent|null $eloquent */
    $eloquent = RoundEloquent::withTrashed()->find($round->id());
    if ($eloquent !== null) {
        $eloquent->forceDelete(); // Hard delete - cascades to races and race_results
    }
}
```

### 2. Repository Interface (`RoundRepositoryInterface.php`)
- **Updated**: Documentation to reflect hard delete behavior and cascade deletion

### 3. Domain Entity (`Round.php`)
- **Updated**: Documentation for `delete()` method to clarify it records domain event only
- **Note**: Actual deletion is performed by repository

### 4. Application Service (`RoundApplicationService.php`)
- **Updated**: Documentation for `deleteRound()` method to clarify hard delete with cascade behavior
- **Behavior**: Uses database transactions for atomicity

### 5. Controller (`RoundController.php`)
- **Added**: Exception handling for `UnauthorizedException` (returns 403 Forbidden)
- **Added**: Import for `UnauthorizedException` class
- **Maintains**: Existing `RoundNotFoundException` handling (returns 404 Not Found)

### 6. Tests (`RoundControllerTest.php`)
Added comprehensive test coverage for hard delete functionality:

- ✅ `test_can_delete_round()` - Basic deletion functionality
- ✅ `test_deleting_round_cascades_to_races_and_race_results()` - Verifies cascade deletion
- ✅ `test_cannot_delete_round_without_authorization()` - Authorization check
- ✅ `test_deleting_nonexistent_round_returns_404()` - Error handling
- ✅ `test_unauthenticated_user_cannot_delete_round()` - Authentication check

## Database Cascade Behavior

The cascade deletion works automatically via database foreign key constraints:

```
Round (deleted)
  └─> races (CASCADE DELETE)
       └─> race_results (CASCADE DELETE)
```

### Migration Configuration:
- `races.round_id` → `onDelete('cascade')`
- `race_results.race_id` → `cascadeOnDelete()`

## API Endpoint

```
DELETE /api/rounds/{roundId}
```

### Authorization:
- Only the league owner can delete rounds
- Returns 403 Forbidden if user is not the league owner

### Response Codes:
- `200 OK` - Round successfully deleted
- `403 Forbidden` - User not authorized (not league owner)
- `404 Not Found` - Round does not exist
- `401 Unauthorized` - User not authenticated

### Response Example:
```json
{
    "success": true,
    "message": "Round deleted successfully",
    "data": null
}
```

## Testing Results

All tests pass (23 tests, 90 assertions):
- ✅ PHPStan: Level 8 - No errors
- ✅ PHPCS: PSR-12 compliance - No errors (only pre-existing line length warnings)
- ✅ PHPUnit: All 23 tests passing

## Key Features

1. **Hard Delete**: Completely removes records from database (no soft delete)
2. **Cascade Deletion**: Automatically deletes all related races and race results
3. **Transactional**: Uses database transactions for data integrity
4. **Authorization**: Only league owners can delete rounds
5. **Domain Events**: Records RoundDeleted event before deletion
6. **Comprehensive Tests**: Full test coverage including cascade behavior

## Backward Compatibility

⚠️ **Breaking Change**: This changes the deletion behavior from soft delete to hard delete.
- Previously deleted rounds (soft deleted) remain in the database with `deleted_at` timestamp
- New deletions will be permanent and cascade to related records
- No data migration is needed

## Usage Example

From the frontend (RoundsPanel.vue):

```javascript
async function deleteRound(roundId) {
  try {
    await seasonService.deleteRound(roundId);
    // Round and all related races/results are permanently deleted
    // Refresh the rounds list
  } catch (error) {
    // Handle error (403 if not authorized, 404 if not found)
  }
}
```

## Files Modified

1. `/var/www/app/Infrastructure/Persistence/Eloquent/Repositories/EloquentRoundRepository.php`
2. `/var/www/app/Domain/Competition/Repositories/RoundRepositoryInterface.php`
3. `/var/www/app/Domain/Competition/Entities/Round.php`
4. `/var/www/app/Application/Competition/Services/RoundApplicationService.php`
5. `/var/www/app/Http/Controllers/User/RoundController.php`
6. `/var/www/tests/Feature/Http/Controllers/User/RoundControllerTest.php`

## Next Steps

The hard delete functionality is fully implemented and tested. The frontend can now use the existing DELETE endpoint with confidence that:
1. The round will be completely removed from the database
2. All related races will be deleted
3. All related race results will be deleted
4. The operation is atomic (all or nothing)
5. Proper authorization checks are in place

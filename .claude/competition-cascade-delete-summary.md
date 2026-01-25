# Competition Cascade Delete Implementation Summary

## Overview

Enhanced the existing DELETE endpoint for competitions to properly cascade delete all related data. The endpoint was already present but the cascade deletion logic has been improved to ensure complete cleanup of all related records and files.

## Endpoint Details

- **URL**: `DELETE /api/competitions/{id}`
- **Subdomain**: `app.virtualracingleagues.localhost`
- **Authentication**: Required (`auth:web`, `user.authenticate`)
- **Authorization**: Only league owner can delete competitions
- **Response**: 204 No Content on success

## Implementation

### 1. Enhanced Repository Delete Method

**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentCompetitionRepository.php`

**Cascade Deletion Order**:
1. Race results (for all races in all rounds)
2. Races (for all rounds in all seasons)
3. Season drivers (for all seasons)
4. Season round tiebreaker rules (if table exists)
5. Rounds (force delete to bypass soft deletes)
6. Seasons (force delete to bypass soft deletes)
7. Media files (logo collection)
8. Competition record

**Key Features**:
- Uses database transaction for atomicity
- Force deletes soft-deleted models (seasons, rounds)
- Properly handles cascade through the relationship hierarchy
- Cleans up media files using Spatie Media Library
- Checks for table existence before deleting tiebreaker rules

### 2. Enhanced Application Service

**File**: `app/Application/Competition/Services/CompetitionApplicationService.php`

**Enhancements**:
- Added comprehensive docblock documenting all cascaded deletions
- Logs activity before deletion
- Deletes legacy logo files (stored via Storage facade) after transaction commits
- Uses `DB::afterCommit()` to ensure file deletion only happens after successful DB transaction
- Dispatches domain events for audit trail

### 3. Controller

**File**: `app/Http/Controllers/User/CompetitionController.php`

The controller was already properly implemented as a thin controller (3-5 lines) following DDD principles. No changes were needed.

## Data Cascade

When a competition is deleted, the following related data is automatically removed:

```
Competition
├── Seasons
│   ├── Season Drivers
│   ├── Season Round Tiebreaker Rules
│   └── Rounds
│       └── Races
│           └── Race Results
├── Logo (Storage file)
└── Logo (Media Library)
```

## Authorization

The endpoint enforces strict authorization:
- User must be authenticated
- User must be the league owner
- Returns 403 Forbidden if user doesn't own the league
- Returns 404 Not Found if competition doesn't exist

## Testing

### Test Coverage

**File**: `tests/Feature/Http/Controllers/User/CompetitionControllerTest.php`

Added comprehensive tests:

1. **test_deleting_competition_cascades_to_all_related_data()**
   - Creates complete data hierarchy (competition → season → drivers → round → race → results)
   - Verifies all records are deleted
   - Verifies logo file is removed
   - Ensures league drivers are NOT deleted (proper cascade boundary)

2. **test_deleting_competition_with_logo_removes_media_files()**
   - Tests logo file cleanup
   - Verifies both Storage and Media Library cleanup

3. **test_deleting_competition_cascades_to_seasons_and_rounds()**
   - Tests basic cascade to seasons and rounds
   - Verifies hard deletion (no soft delete records remain)

### Test Results

All tests pass:
- 47 total tests in CompetitionControllerTest
- 257 assertions
- All new cascade delete tests pass
- No regressions in existing tests

## Code Quality

- PHPStan Level 8: ✅ Passes
- PSR-12 Code Style: ✅ Passes
- Test Coverage: ✅ Comprehensive

## Database Relationships

The cascade leverages both database-level cascades and application-level cleanup:

**Database Cascades** (defined in migrations):
- `competitions.id` → `seasons.competition_id` (CASCADE)
- `seasons.id` → `rounds.season_id` (CASCADE)
- `seasons.id` → `season_drivers.season_id` (CASCADE)
- `rounds.id` → `races.round_id` (CASCADE)
- `races.id` → `race_results.race_id` (CASCADE)

**Application-Level Cleanup**:
- Soft deleted models (seasons, rounds) require force delete
- Race results and season drivers are explicitly deleted
- Media files are cleaned up via Spatie Media Library
- Legacy storage files are cleaned up via Storage facade

## Error Handling

- **Transaction Safety**: All deletions wrapped in database transaction
- **Rollback**: Any failure rolls back entire deletion operation
- **File Cleanup**: Files only deleted after transaction commits successfully
- **Logging**: Activity logged before deletion for audit trail
- **Graceful Degradation**: File deletion failures are logged but don't fail the request

## Performance Considerations

- **Bulk Operations**: Uses bulk deletes where possible (whereIn queries)
- **Batch Loading**: Loads all IDs first, then performs bulk deletes
- **Single Transaction**: All deletions happen in one transaction
- **Minimal Queries**: Optimized to minimize database round-trips

## Example Usage

```bash
# Delete a competition and all related data
curl -X DELETE \
  http://app.virtualracingleagues.localhost/api/competitions/123 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"

# Response: 204 No Content
```

## Related Files

- `app/Domain/Competition/Entities/Competition.php` - Entity with delete() method
- `app/Domain/Competition/Events/CompetitionDeleted.php` - Domain event
- `app/Http/Controllers/User/CompetitionController.php` - HTTP controller
- `routes/subdomain.php` - Route definition (line 168)

## Migration Considerations

- No new migrations required
- Uses existing database cascade relationships
- Compatible with existing data structure

## Notes

- The endpoint was already present, this work enhanced the cascade deletion logic
- Follows DDD architecture patterns throughout
- Maintains separation of concerns (Domain, Application, Infrastructure, Interface layers)
- All business logic in domain entities, orchestration in application service
- Repository handles persistence details
- Controller remains thin (3-5 lines per method)

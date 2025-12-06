# Penalty System - Backend Implementation Plan

**Agent**: `dev-be`

## Overview

This plan implements a penalty system where:
- Database column `race_time` is renamed to `original_race_time`
- `penalties` column remains unchanged
- Application layer calculates `final_race_time = original_race_time + penalties`
- All three values are returned in DTOs

---

## 1. Database Migration

### File: `database/migrations/YYYY_MM_DD_HHMMSS_rename_race_time_to_original_race_time.php`

**Action**: Create new migration

**Changes**:
- Rename column `race_time` to `original_race_time` in `race_results` table
- Use `renameColumn()` method
- Include proper rollback in `down()` method

**Notes**:
- Must run BEFORE code changes
- Existing data will be preserved
- No data transformation required

---

## 2. Domain Layer Changes

### 2.1 RaceResult Entity

**File**: `app/Domain/Competition/Entities/RaceResult.php`

**Changes**:

| Location | Change |
|----------|--------|
| Property (line ~26) | Rename `$raceTime` to `$originalRaceTime` |
| Constructor | Rename parameter `raceTime` to `originalRaceTime` |
| `create()` method | Rename parameter, update named parameter in constructor call |
| `reconstitute()` method | Rename parameter, update named parameter in constructor call |
| Getter method | Rename `raceTime()` to `originalRaceTime()` |
| `update()` method | Rename parameter, update variable names, update change tracking key |

**New Method to Add**:
```php
public function finalRaceTime(): RaceTime
{
    // Calculate: original_race_time + penalties
    // Handle null cases appropriately
}
```

### 2.2 RaceTime Value Object

**File**: `app/Domain/Competition/ValueObjects/RaceTime.php`

**Changes**: NONE
- Existing `add()` method already supports adding two RaceTime values
- Will be used to calculate `final_race_time`

---

## 3. Infrastructure Layer Changes

### 3.1 Eloquent Model

**File**: `app/Infrastructure/Persistence/Eloquent/Models/RaceResult.php`

**Changes**:

| Location | Change |
|----------|--------|
| PHPDoc property | Rename `@property string|null $race_time` to `@property string|null $original_race_time` |
| `$fillable` array | Rename `'race_time'` to `'original_race_time'` |

### 3.2 Eloquent Repository

**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentRaceResultRepository.php`

**Changes**:

| Method | Change |
|--------|--------|
| `save()` | Rename `$model->race_time` to `$model->original_race_time` |
| `toEntity()` | Rename parameter in `reconstitute()` call from `raceTime:` to `originalRaceTime:` |

---

## 4. Application Layer Changes

### 4.1 Output DTO

**File**: `app/Application/Competition/DTOs/RaceResultData.php`

**Changes**:

| Change | Details |
|--------|---------|
| Rename property | `$race_time` to `$original_race_time` |
| Add property | `$final_race_time` (calculated) |
| Update `fromEntity()` | Use `originalRaceTime()` and add `finalRaceTime()` call |

**New Structure**:
```php
public ?string $original_race_time,
public ?string $final_race_time,  // NEW
public ?string $race_time_difference,
public ?string $fastest_lap,
public ?string $penalties,
```

### 4.2 Input DTO

**File**: `app/Application/Competition/DTOs/CreateRaceResultData.php`

**Changes**:

| Change | Details |
|--------|---------|
| Rename property | `$race_time` to `$original_race_time` |

**Note**: Input DTO does NOT need `final_race_time` (calculated field)

### 4.3 Application Service

**File**: `app/Application/Competition/Services/RaceResultApplicationService.php`

**Changes**:

| Method | Change |
|--------|--------|
| `saveResults()` | Update parameter passed to `RaceResult::create()`: `raceTime:` to `originalRaceTime:` |

### 4.4 Round Application Service (CRITICAL)

**File**: `app/Application/Competition/Services/RoundApplicationService.php`

**IMPORTANT**: This file has MANY references to `race_time`. Each occurrence needs review:

**Key Decisions**:
- **Standings calculations**: Use `final_race_time` (post-penalty)
- **Gap calculations**: Use `final_race_time`
- **Sorting by time**: Use `final_race_time`

**Locations to Update** (approximate lines):
- Line ~645: `buildCompleteRaceResults()` - update field names
- Lines ~841, 908, 910, 976, 1066-1071: Race time calculations for sorting
- Array keys in round results: Review each occurrence

---

## 5. Interface Layer Changes

### 5.1 Form Request Validation

**File**: `app/Http/Requests/User/BulkRaceResultsRequest.php`

**Changes**:
- Rename validation rule `race_time` to `original_race_time`
- Ensure time format validation remains intact

### 5.2 Controller

**File**: `app/Http/Controllers/User/RaceResultController.php`

**Changes**: NONE expected
- Controller is thin, delegates to application service
- DTO changes flow through automatically

---

## 6. Testing Changes

### 6.1 Unit Tests - Entity

**File**: `tests/Unit/Domain/Competition/Entities/RaceResultTest.php`

**Changes**:
- Update all `raceTime()` method calls to `originalRaceTime()`
- Add new tests for `finalRaceTime()` method:

**New Test Cases**:
```
test_calculates_final_race_time_without_penalties()
test_calculates_final_race_time_with_penalties()
test_final_race_time_is_null_when_original_is_null()
test_final_race_time_equals_original_when_penalties_are_null()
```

### 6.2 Feature Tests

**File**: `tests/Feature/Http/Controllers/User/RaceResultControllerTest.php`

**Changes**:
- Update test data: `race_time` to `original_race_time`
- Update assertions to check for:
  - `original_race_time`
  - `final_race_time`
  - `penalties`

**New Test Cases**:
```
test_response_includes_original_race_time()
test_response_includes_final_race_time()
test_final_race_time_includes_penalties()
```

### 6.3 Repository Tests

**File**: `tests/Unit/Infrastructure/Persistence/Eloquent/Repositories/EloquentRaceResultRepositoryTest.php`

**Changes** (if exists):
- Update test data column references
- Update assertions checking saved data

---

## 7. Implementation Checklist

### Phase 1: Domain Layer
- [ ] Update `RaceResult` entity (rename property, methods)
- [ ] Add `finalRaceTime()` method to entity
- [ ] Write unit tests for `finalRaceTime()` calculation
- [ ] Run: `composer test -- --filter=RaceResult`

### Phase 2: Infrastructure Layer
- [ ] Create database migration
- [ ] Update Eloquent model (PHPDoc, fillable)
- [ ] Update Eloquent repository (`save` and `toEntity` methods)
- [ ] Run migration locally: `php artisan migrate`
- [ ] Run: `composer test -- --filter=EloquentRaceResultRepository`

### Phase 3: Application Layer
- [ ] Update `CreateRaceResultData` (input DTO)
- [ ] Update `RaceResultData` (output DTO - add `final_race_time`)
- [ ] Update `RaceResultApplicationService`
- [ ] **CRITICAL**: Review and update `RoundApplicationService` calculations
- [ ] Run: `composer test -- --filter=RaceResult`

### Phase 4: Interface Layer
- [ ] Update `BulkRaceResultsRequest` validation rules
- [ ] Verify controller (should need no changes)
- [ ] Update feature tests
- [ ] Run: `composer test -- --filter=RaceResultController`

### Phase 5: Code Quality
- [ ] Run PHPStan: `composer phpstan`
- [ ] Run PHPCS: `composer phpcs`
- [ ] Fix any issues: `composer phpcbf`
- [ ] Run full test suite: `composer test`

---

## 8. Backward Compatibility

### API Response Changes (BREAKING)

**Old Response**:
```json
{
  "race_time": "01:23:45.678",
  "penalties": "00:00:05.000"
}
```

**New Response**:
```json
{
  "original_race_time": "01:23:45.678",
  "final_race_time": "01:23:50.678",
  "penalties": "00:00:05.000"
}
```

### Deployment Order
1. Run database migration (renames column)
2. Deploy backend changes (updated code references)
3. Clear application cache: `php artisan cache:clear`
4. Deploy frontend changes (updated field names)

### Cache Considerations
- Clear Redis/cache after deployment
- Consider clearing queue: `php artisan queue:clear`

---

## 9. Rollback Plan

### Immediate Rollback
1. Revert code deployment
2. Run reverse migration: `php artisan migrate:rollback --step=1`
3. Clear cache: `php artisan cache:clear`

### Data Preservation
- Migration includes `down()` method to reverse column rename
- No data loss - column rename preserves all data

---

## 10. Files Summary

### New Files
| File | Action |
|------|--------|
| `database/migrations/YYYY_MM_DD_rename_race_time_to_original_race_time.php` | CREATE |

### Modified Files
| File | Impact |
|------|--------|
| `app/Domain/Competition/Entities/RaceResult.php` | HIGH |
| `app/Application/Competition/Services/RoundApplicationService.php` | HIGH |
| `app/Application/Competition/DTOs/RaceResultData.php` | MEDIUM |
| `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentRaceResultRepository.php` | MEDIUM |
| `app/Application/Competition/DTOs/CreateRaceResultData.php` | LOW |
| `app/Infrastructure/Persistence/Eloquent/Models/RaceResult.php` | LOW |
| `app/Application/Competition/Services/RaceResultApplicationService.php` | LOW |
| `app/Http/Requests/User/BulkRaceResultsRequest.php` | LOW |

### Test Files
| File | Action |
|------|--------|
| `tests/Unit/Domain/Competition/Entities/RaceResultTest.php` | UPDATE + ADD |
| `tests/Feature/Http/Controllers/User/RaceResultControllerTest.php` | UPDATE + ADD |

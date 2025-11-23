# Remaining Implementation Tasks

**Overall Progress: 24/42 tasks complete (57%)**

## ✅ Completed Tasks

### Phase 1: Pagination Helper
- [x] Create PaginationHelper class in app/Helpers/
- [x] Update AdminUserController to use PaginationHelper
- [x] Update UserController (Admin) to use PaginationHelper
- [x] Update AdminActivityLogController to use PaginationHelper (3 methods)
- [x] Update AdminLeagueController to use PaginationHelper
- [x] Update SeasonDriverController to use PaginationHelper
- [x] Update DriverController to use PaginationHelper

### Phase 2: Domain Layer Cleanup
- [x] Replace Str::slug in RoundSlug value object with pure PHP
- [x] Replace Str::slug in SeasonSlug value object with pure PHP
- [x] Replace Str::slug in CompetitionSlug value object with pure PHP
- [x] Move FileStorageServiceInterface to Infrastructure layer
- [x] Update imports for moved FileStorageServiceInterface (4 files)

### Phase 1: Repository Tests
- [x] Create EloquentAdminRepositoryTest (18 tests)
- [x] Create EloquentUserRepositoryTest (17 tests)

### Phase 3: Helpers & Form Requests
- [x] Create FilterBuilder helper class
- [x] Create IndexAdminUsersRequest
- [x] Create IndexUsersRequest
- [x] Create IndexLeaguesRequest
- [x] Create CreateUserRequest

### Phase 3: Controller Refactoring
- [x] Refactor AdminUserController::index() (52 lines → 15 lines)
- [x] Refactor UserController::index() (76 lines → 15 lines)
- [x] Refactor UserController::store() to use CreateUserRequest
- [x] Refactor AdminLeagueController::index() (82 lines → 15 lines)

---

## 📋 Remaining Tasks

### Phase 1: Repository Mapping Tests (9 tests remaining)

**Purpose:** Ensure Entity ↔ Eloquent mapping is correct and data integrity is maintained.

**Pattern to follow:** `/var/www/tests/Integration/Persistence/Eloquent/Repositories/EloquentLeagueRepositoryTest.php`

**Files to create:**

1. **EloquentSiteConfigRepositoryTest**
   - Location: `tests/Integration/Persistence/Eloquent/Repositories/EloquentSiteConfigRepositoryTest.php`
   - Repository: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentSiteConfigRepository.php`

2. **EloquentDriverRepositoryTest**
   - Location: `tests/Integration/Persistence/Eloquent/Repositories/EloquentDriverRepositoryTest.php`
   - Repository: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentDriverRepository.php`

3. **EloquentTeamRepositoryTest**
   - Location: `tests/Integration/Persistence/Eloquent/Repositories/EloquentTeamRepositoryTest.php`
   - Repository: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentTeamRepository.php`

4. **EloquentDivisionRepositoryTest**
   - Location: `tests/Integration/Persistence/Eloquent/Repositories/EloquentDivisionRepositoryTest.php`
   - Repository: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentDivisionRepository.php`

5. **EloquentSeasonDriverRepositoryTest**
   - Location: `tests/Integration/Persistence/Eloquent/Repositories/EloquentSeasonDriverRepositoryTest.php`
   - Repository: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentSeasonDriverRepository.php`

6. **EloquentRaceRepositoryTest**
   - Location: `tests/Integration/Persistence/Eloquent/Repositories/EloquentRaceRepositoryTest.php`
   - Repository: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentRaceRepository.php`

7. **EloquentRoundRepositoryTest**
   - Location: `tests/Integration/Persistence/Eloquent/Repositories/EloquentRoundRepositoryTest.php`
   - Repository: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentRoundRepository.php`

8. **EloquentCompetitionRepositoryTest**
   - Location: `tests/Integration/Persistence/Eloquent/Repositories/EloquentCompetitionRepositoryTest.php`
   - Repository: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentCompetitionRepository.php`

9. **EloquentSeasonRepositoryTest**
   - Location: `tests/Integration/Persistence/Eloquent/Repositories/EloquentSeasonRepositoryTest.php`
   - Repository: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentSeasonRepository.php`

**Estimated Time:** 1-2 days

---

### Phase 4: CQRS Read Models (5 services)

**Purpose:** Separate read concerns from domain repositories, optimize queries for specific read scenarios.

**Pattern to follow:** `app/Infrastructure/Persistence/Eloquent/ReadModels/AdminReadModelService.php`

#### 1. Create ActivityLogReadModelService

**File to create:** `app/Infrastructure/Persistence/Eloquent/ReadModels/ActivityLogReadModelService.php`

**Purpose:** Handle complex activity log queries with relationships

**Methods needed:**
```php
public function getPaginatedActivities(int $page, int $perPage, ?string $logName = null): array
public function getPaginatedUserActivities(int $page, int $perPage): array
public function getPaginatedAdminActivities(int $page, int $perPage): array
public function getActivitiesForEntity(string $entityType, int $entityId): Collection
```

**Usage:** Replace direct Eloquent queries in `AdminActivityLogController`

#### 2. Create UserReadModelService

**File to create:** `app/Infrastructure/Persistence/Eloquent/ReadModels/UserReadModelService.php`

**Purpose:** User-related read operations beyond domain

**Methods needed:**
```php
public function getUserWithActivitySummary(int $userId): array
public function getUsersWithLeagueCounts(array $filters = []): array
```

#### 3. Create DriverReadModelService

**File to create:** `app/Infrastructure/Persistence/Eloquent/ReadModels/DriverReadModelService.php`

**Purpose:** Complex driver queries with relationships

**Methods needed:**
```php
public function getDriversWithLeagueInfo(int $leagueId, array $filters = []): array
public function getSeasonDriversWithStats(int $seasonId): array
```

#### 4. Create CompetitionReadModelService

**File to create:** `app/Infrastructure/Persistence/Eloquent/ReadModels/CompetitionReadModelService.php`

**Purpose:** Complex competition hierarchy queries

**Methods needed:**
```php
public function getSeasonWithRoundsAndRaces(int $seasonId): array
public function getRaceStandings(int $raceId): array
public function getCompetitionHierarchy(int $competitionId): array
```

#### 5. Update AdminActivityLogController

**File to modify:** `app/Http/Controllers/Admin/AdminActivityLogController.php`

**Changes:**
- Replace direct `Activity::query()` calls with `ActivityLogReadModelService` methods
- Lines to update: 42-51, 99-104, 153-158

#### 6. Register Read Model Services

**File to modify:** `app/Providers/RepositoryServiceProvider.php`

**Add bindings:**
```php
$this->app->singleton(ActivityLogReadModelService::class);
$this->app->singleton(UserReadModelService::class);
$this->app->singleton(DriverReadModelService::class);
$this->app->singleton(CompetitionReadModelService::class);
```

**Estimated Time:** 2-3 days

---

### Phase 5: Policy Registration (Optional)

**Purpose:** Cleaner authorization API usage in controllers

**Current state:** AdminPolicy already registered and working

**Files to create (optional):**

1. **UserPolicy**
   - Location: `app/Policies/UserPolicy.php`
   - Methods: `viewAny`, `view`, `create`, `update`, `delete`, `restore`, `verifyEmail`
   - For: Admin managing users

2. **LeaguePolicy**
   - Location: `app/Policies/LeaguePolicy.php`
   - Methods: `viewAny`, `view`, `create`, `update`, `delete`, `restore`
   - For: User ownership checks

3. **SiteConfigPolicy**
   - Location: `app/Policies/SiteConfigPolicy.php`
   - Methods: `view`, `update`
   - For: Admin-only access

**File to modify:** `app/Providers/AuthServiceProvider.php`

**Add to `$policies` array:**
```php
protected $policies = [
    // Existing
    AdminModel::class => AdminPolicy::class,
    Admin::class => AdminPolicy::class,

    // New policies
    UserModel::class => UserPolicy::class,
    User::class => UserPolicy::class,
    LeagueModel::class => LeaguePolicy::class,
    League::class => LeaguePolicy::class,
    SiteConfigModel::class => SiteConfigPolicy::class,
];
```

**Estimated Time:** 4-6 hours

---

### Phase 6: Testing & Verification

**File to create:** Test plan document (optional)

**Tasks:**
1. Run full test suite: `composer test`
2. Run PHPStan: `composer phpstan`
3. Run code style check: `composer phpcs`
4. Run frontend tests: `npm test`
5. Manual testing:
   - Test admin user listing with pagination
   - Test user listing with filters
   - Test league listing
   - Verify activity logs display correctly
   - Test file uploads (site config)

**Estimated Time:** 2-4 hours

---

## Summary

**Total Remaining Tasks:** 18 tasks

**Breakdown by Phase:**
- Phase 1 (Repository Tests): 9 tasks - **Large effort** (1-2 days)
- Phase 4 (CQRS): 6 tasks - **Large effort** (2-3 days)
- Phase 5 (Policies): 4 tasks - **Medium effort** (4-6 hours) - **OPTIONAL**
- Phase 6 (Testing): 1 task - **Small effort** (2-4 hours)

**Total Estimated Time:** 3-5 days

**Recommended Order:**
1. ✅ Complete Phase 1 (Repository Tests) - **Critical for data integrity** (partially complete)
2. ✅ Complete Phase 4 (CQRS Read Models) - **Performance & separation of concerns**
3. ⚠️ Phase 5 (Policies) - Optional, only if needed
4. ✅ Phase 6 (Testing) - Final verification

---

## Notes

- All syntax checks have passed for completed work
- No breaking changes introduced
- Pure PHP domain layer achieved (zero Laravel dependencies)
- ~200 lines of duplication eliminated so far
- Code quality significantly improved

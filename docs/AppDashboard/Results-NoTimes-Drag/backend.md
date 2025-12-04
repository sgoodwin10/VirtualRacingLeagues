# Race Results Without Times - Backend Implementation Plan

## Overview

This document outlines the backend changes required to support the `race_times_required` feature on seasons.

## Architecture Summary

Following the existing DDD architecture:
- **Domain Layer**: Update Season entity
- **Application Layer**: Update DTOs and services
- **Infrastructure Layer**: Migration and Eloquent model update
- **Interface Layer**: Controller updates (minimal)

---

## Phase 1: Database Migration

### File: `database/migrations/YYYY_MM_DD_HHMMSS_add_race_times_required_to_seasons_table.php`

```php
<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->boolean('race_times_required')
                ->default(true)
                ->after('race_divisions_enabled')
                ->comment('When false, race times are not required and positions are set by order');
        });
    }

    public function down(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->dropColumn('race_times_required');
        });
    }
};
```

**Notes:**
- Default `true` maintains existing behavior
- Placed after `race_divisions_enabled` for logical grouping
- No data migration needed for existing seasons

---

## Phase 2: Domain Layer Updates

### 2.1 Update Season Entity

**File:** `app/Domain/Competition/Entities/Season.php`

Add property and accessor:

```php
private bool $raceTimesRequired;

// In constructor
$this->raceTimesRequired = $raceTimesRequired;

// Add accessor
public function raceTimesRequired(): bool
{
    return $this->raceTimesRequired;
}

// Update create() factory method signature
public static function create(
    SeasonName $name,
    SeasonSlug $slug,
    int $competitionId,
    int $createdByUserId,
    bool $teamChampionshipEnabled = false,
    bool $raceDivisionsEnabled = false,
    bool $raceTimesRequired = true, // Add this parameter
    ?string $carClass = null,
    ?string $description = null,
    ?string $technicalSpecs = null,
    ?string $logoPath = null,
    ?string $bannerPath = null
): self

// Update reconstitute() method signature
public static function reconstitute(
    int $id,
    SeasonName $name,
    SeasonSlug $slug,
    int $competitionId,
    int $createdByUserId,
    bool $teamChampionshipEnabled,
    bool $raceDivisionsEnabled,
    bool $raceTimesRequired, // Add this parameter
    SeasonStatus $status,
    ?string $carClass,
    ?string $description,
    ?string $technicalSpecs,
    ?string $logoPath,
    ?string $bannerPath,
    DateTimeImmutable $createdAt,
    DateTimeImmutable $updatedAt
): self
```

### 2.2 Update Season Methods

If there's an `update()` method, add `raceTimesRequired` parameter:

```php
public function update(
    SeasonName $name,
    SeasonSlug $slug,
    bool $teamChampionshipEnabled,
    bool $raceDivisionsEnabled,
    bool $raceTimesRequired, // Add this
    ?string $carClass,
    ?string $description,
    ?string $technicalSpecs,
    ?string $logoPath,
    ?string $bannerPath
): void {
    // ... existing update logic
    $this->raceTimesRequired = $raceTimesRequired;
    // ... record update event
}
```

---

## Phase 3: Infrastructure Layer Updates

### 3.1 Update Eloquent Model

**File:** `app/Infrastructure/Persistence/Eloquent/Models/SeasonEloquent.php`

Add to `$fillable` array:

```php
protected $fillable = [
    // ... existing fields
    'race_times_required',
];

protected $casts = [
    // ... existing casts
    'race_times_required' => 'boolean',
];
```

### 3.2 Update Season Repository

**File:** `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentSeasonRepository.php`

Update the `toDomainEntity()` method:

```php
private function toDomainEntity(SeasonEloquent $model): Season
{
    return Season::reconstitute(
        $model->id,
        SeasonName::fromString($model->name),
        SeasonSlug::fromString($model->slug),
        $model->competition_id,
        $model->created_by_user_id,
        $model->team_championship_enabled,
        $model->race_divisions_enabled,
        $model->race_times_required, // Add this
        SeasonStatus::fromString($model->status),
        $model->car_class,
        $model->description,
        $model->technical_specs,
        $model->logo_path,
        $model->banner_path,
        new DateTimeImmutable($model->created_at),
        new DateTimeImmutable($model->updated_at)
    );
}
```

Update the `save()` method:

```php
public function save(Season $season): Season
{
    $model = SeasonEloquent::updateOrCreate(
        ['id' => $season->id()],
        [
            // ... existing fields
            'race_times_required' => $season->raceTimesRequired(),
        ]
    );

    return $this->toDomainEntity($model);
}
```

---

## Phase 4: Application Layer Updates

### 4.1 Update DTOs

**File:** `app/Application/Competition/DTOs/CreateSeasonData.php`

```php
#[MapInputName(SnakeCaseMapper::class)]
final class CreateSeasonData extends Data
{
    public function __construct(
        // ... existing fields
        public readonly bool $raceTimesRequired = true,
    ) {}
}
```

**File:** `app/Application/Competition/DTOs/UpdateSeasonData.php`

```php
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateSeasonData extends Data
{
    public function __construct(
        // ... existing fields
        public readonly bool $raceTimesRequired = true,
    ) {}
}
```

**File:** `app/Application/Competition/DTOs/SeasonData.php`

Add to the response DTO:

```php
#[MapOutputName(SnakeCaseMapper::class)]
final class SeasonData extends Data
{
    public function __construct(
        // ... existing fields
        public readonly bool $raceTimesRequired,
    ) {}

    public static function fromEntity(Season $season): self
    {
        return new self(
            // ... existing mappings
            raceTimesRequired: $season->raceTimesRequired(),
        );
    }
}
```

### 4.2 Update Application Service

**File:** `app/Application/Competition/Services/SeasonApplicationService.php`

Update `createSeason()` method:

```php
public function createSeason(CreateSeasonData $data): SeasonData
{
    return DB::transaction(function () use ($data) {
        $season = Season::create(
            // ... existing parameters
            raceTimesRequired: $data->raceTimesRequired,
        );

        // ... rest of method
    });
}
```

Update `updateSeason()` method:

```php
public function updateSeason(int $seasonId, UpdateSeasonData $data): SeasonData
{
    return DB::transaction(function () use ($seasonId, $data) {
        $season = $this->seasonRepository->findById($seasonId);

        $season->update(
            // ... existing parameters
            raceTimesRequired: $data->raceTimesRequired,
        );

        // ... rest of method
    });
}
```

---

## Phase 5: Race Result Service Updates

### 5.1 Update saveResults Method

**File:** `app/Application/Competition/Services/RaceResultApplicationService.php`

The existing `saveResults()` method already handles position assignment. When `race_times_required` is false, the frontend will:
1. Send results in the correct order (as arranged via drag-and-drop)
2. Include position values derived from array index

**Modification needed:** Update fastest lap calculation to skip auto-calculation when times not available:

```php
public function saveResults(int $raceId, BulkRaceResultsData $data): array
{
    return DB::transaction(function () use ($raceId, $data) {
        // ... existing delete logic

        $results = [];
        $race = $this->raceRepository->findById($raceId);
        $season = $this->getSeasonForRace($race);

        foreach ($data->results as $index => $resultData) {
            // If position is provided, use it; otherwise calculate from index
            $position = $resultData->position ?? ($index + 1);

            $result = RaceResult::create(
                raceId: $raceId,
                driverId: $resultData->driver_id,
                divisionId: $resultData->division_id,
                position: $position,
                raceTime: RaceTime::fromString($resultData->race_time),
                raceTimeDifference: RaceTime::fromString($resultData->race_time_difference),
                fastestLap: RaceTime::fromString($resultData->fastest_lap),
                penalties: RaceTime::fromString($resultData->penalties),
                hasFastestLap: $resultData->has_fastest_lap,
                hasPole: $resultData->has_pole,
                dnf: $resultData->dnf
            );

            $results[] = $this->resultRepository->save($result);
        }

        // Only auto-calculate fastest laps if times are required AND not a qualifier
        if ($season->raceTimesRequired() && !$race->is_qualifier) {
            $this->calculateFastestLaps($results);
        }

        return array_map(
            fn($result) => RaceResultData::fromEntity($result),
            $results
        );
    });
}

private function getSeasonForRace(Race $race): Season
{
    // Get season through: race -> round -> season
    $round = $this->roundRepository->findById($race->round_id);
    return $this->seasonRepository->findById($round->season_id);
}
```

---

## Phase 6: API Updates

### 6.1 Season API Responses

The existing season endpoints should automatically include `race_times_required` once DTOs are updated.

**Endpoints affected:**
- `GET /api/seasons/{id}` - Returns SeasonData with new field
- `POST /api/seasons` - Accepts CreateSeasonData with new field
- `PUT /api/seasons/{id}` - Accepts UpdateSeasonData with new field

### 6.2 Race Result Context

Consider adding `race_times_required` to the race result fetch response for frontend convenience:

**Option A: Include in race endpoint**
```php
// In RaceData DTO or RaceController response
'season' => [
    'race_times_required' => $season->raceTimesRequired(),
]
```

**Option B: Separate endpoint/param**
Frontend can fetch season settings separately if needed.

**Recommended:** Option A for convenience.

---

## Phase 7: Form Request Validation

### 7.1 Create Season Request

**File:** `app/Http/Requests/CreateSeasonRequest.php` (or similar)

```php
public function rules(): array
{
    return [
        // ... existing rules
        'race_times_required' => ['sometimes', 'boolean'],
    ];
}
```

### 7.2 Update Season Request

**File:** `app/Http/Requests/UpdateSeasonRequest.php` (or similar)

```php
public function rules(): array
{
    return [
        // ... existing rules
        'race_times_required' => ['sometimes', 'boolean'],
    ];
}
```

---

## Testing Plan

### Unit Tests

1. **Season Entity Tests**
   - Test `raceTimesRequired()` accessor
   - Test `create()` with `raceTimesRequired` parameter
   - Test `update()` changes `raceTimesRequired`
   - Test `reconstitute()` with `raceTimesRequired`

2. **Season Repository Tests**
   - Test saving season with `race_times_required = true`
   - Test saving season with `race_times_required = false`
   - Test retrieving season preserves `race_times_required` value

3. **RaceResultApplicationService Tests**
   - Test fastest lap auto-calculation is skipped when `race_times_required = false`
   - Test position assignment uses provided positions
   - Test results saved in correct order

### Feature Tests

1. **Season API Tests**
   - Test create season with `race_times_required = true`
   - Test create season with `race_times_required = false`
   - Test create season without `race_times_required` (defaults to true)
   - Test update season changes `race_times_required`
   - Test get season includes `race_times_required` in response

2. **Race Result API Tests**
   - Test saving results for season with `race_times_required = false`
   - Test positions are saved as provided
   - Test fastest lap flag is preserved (not overwritten by calculation)

---

## Migration Checklist

- [ ] Create migration file
- [ ] Update Season domain entity
- [ ] Update SeasonEloquent model
- [ ] Update EloquentSeasonRepository
- [ ] Update CreateSeasonData DTO
- [ ] Update UpdateSeasonData DTO
- [ ] Update SeasonData DTO
- [ ] Update SeasonApplicationService
- [ ] Update RaceResultApplicationService
- [ ] Update form request validation
- [ ] Write unit tests
- [ ] Write feature tests
- [ ] Run `php artisan migrate`
- [ ] Run test suite
- [ ] Run PHPStan

---

## Commands to Run

```bash
# Generate migration
php artisan make:migration add_race_times_required_to_seasons_table

# Run migration
php artisan migrate

# Run tests
composer test

# Run static analysis
composer phpstan

# Run code style check
composer phpcs
```

---

## Rollback Plan

If issues occur:
1. Roll back migration: `php artisan migrate:rollback`
2. Revert code changes
3. The feature is isolated and should not affect existing functionality

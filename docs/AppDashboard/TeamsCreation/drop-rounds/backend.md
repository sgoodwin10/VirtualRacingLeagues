# Teams Drop Rounds Feature - Backend Implementation Plan

## Overview

This document details the Laravel backend implementation for adding team drop rounds and drivers-for-calculation settings to seasons.

---

## 1. Database Migration

### File: `database/migrations/YYYY_MM_DD_HHMMSS_add_team_championship_settings_to_seasons_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            // Number of drivers whose points count for team round score
            // NULL = All drivers, 1-16 = specific count
            $table->unsignedTinyInteger('teams_drivers_for_calculation')
                ->nullable()
                ->after('team_championship_enabled')
                ->comment('Number of top driver results to count for team score (NULL = all)');

            // Enable drop rounds for team championship
            $table->boolean('teams_drop_rounds')
                ->default(false)
                ->after('teams_drivers_for_calculation')
                ->comment('Enable drop round feature for team standings');

            // Number of rounds to drop for team standings
            $table->unsignedTinyInteger('teams_total_drop_rounds')
                ->nullable()
                ->after('teams_drop_rounds')
                ->comment('Number of worst rounds to drop from team standings');
        });
    }

    public function down(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->dropColumn([
                'teams_drivers_for_calculation',
                'teams_drop_rounds',
                'teams_total_drop_rounds',
            ]);
        });
    }
};
```

---

## 2. Domain Layer Updates

### 2.1 Season Entity (`app/Domain/Competition/Entities/Season.php`)

#### Add Properties

```php
private function __construct(
    // ... existing properties ...
    private bool $teamChampionshipEnabled,
    private ?int $teamsDriversForCalculation,      // NEW
    private bool $teamsDropRounds,                  // NEW
    private ?int $teamsDropRoundsTotal,            // NEW (renamed for clarity)
    private bool $raceDivisionsEnabled,
    // ... rest of properties ...
) {
```

#### Add to `create()` Method

```php
public static function create(
    // ... existing parameters ...
    bool $teamChampionshipEnabled = false,
    ?int $teamsDriversForCalculation = null,      // NEW
    bool $teamsDropRounds = false,                 // NEW
    int $teamsDropRoundsTotal = 0,                // NEW
    bool $raceDivisionsEnabled = false,
    // ... rest ...
): self {
    // Validation: teamsDriversForCalculation only valid when team championship enabled
    if (!$teamChampionshipEnabled && $teamsDriversForCalculation !== null) {
        throw new \InvalidArgumentException(
            'Cannot set teams drivers for calculation when team championship is disabled'
        );
    }

    // Validation: teams drop rounds only valid when team championship enabled
    if (!$teamChampionshipEnabled && $teamsDropRounds) {
        throw new \InvalidArgumentException(
            'Cannot enable teams drop rounds when team championship is disabled'
        );
    }

    // Validation: teamsDriversForCalculation must be 1-16 if set
    if ($teamsDriversForCalculation !== null && ($teamsDriversForCalculation < 1 || $teamsDriversForCalculation > 16)) {
        throw new \InvalidArgumentException(
            'Teams drivers for calculation must be between 1 and 16'
        );
    }

    // ... existing creation logic ...
}
```

#### Add Getters

```php
public function teamsDriversForCalculation(): ?int
{
    return $this->teamsDriversForCalculation;
}

public function hasTeamsDropRounds(): bool
{
    return $this->teamsDropRounds;
}

public function teamsDropRoundsTotal(): ?int
{
    return $this->teamsDropRoundsTotal;
}
```

#### Add Business Logic Methods

```php
/**
 * Update teams drivers for calculation setting.
 *
 * @throws SeasonIsArchivedException if season is archived
 * @throws \InvalidArgumentException if team championship not enabled or value out of range
 */
public function updateTeamsDriversForCalculation(?int $count): void
{
    if ($this->status->isArchived()) {
        throw SeasonIsArchivedException::withId($this->id ?? 0);
    }

    if (!$this->teamChampionshipEnabled) {
        throw new \InvalidArgumentException(
            'Cannot set teams drivers for calculation when team championship is disabled'
        );
    }

    if ($count !== null && ($count < 1 || $count > 16)) {
        throw new \InvalidArgumentException(
            'Teams drivers for calculation must be between 1 and 16, or null for all'
        );
    }

    if ($this->teamsDriversForCalculation !== $count) {
        $oldValue = $this->teamsDriversForCalculation;
        $this->teamsDriversForCalculation = $count;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new SeasonUpdated(
            seasonId: $this->id ?? 0,
            competitionId: $this->competitionId,
            changes: ['teams_drivers_for_calculation' => ['old' => $oldValue, 'new' => $count]],
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }
}

/**
 * Enable teams drop rounds.
 *
 * @throws SeasonIsArchivedException if season is archived
 * @throws \InvalidArgumentException if team championship not enabled
 */
public function enableTeamsDropRounds(): void
{
    if ($this->status->isArchived()) {
        throw SeasonIsArchivedException::withId($this->id ?? 0);
    }

    if (!$this->teamChampionshipEnabled) {
        throw new \InvalidArgumentException(
            'Cannot enable teams drop rounds when team championship is disabled'
        );
    }

    if (!$this->teamsDropRounds) {
        $this->teamsDropRounds = true;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new SeasonUpdated(
            seasonId: $this->id ?? 0,
            competitionId: $this->competitionId,
            changes: ['teams_drop_rounds' => ['old' => false, 'new' => true]],
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }
}

/**
 * Disable teams drop rounds.
 * Automatically resets teamsDropRoundsTotal to null.
 *
 * @throws SeasonIsArchivedException if season is archived
 */
public function disableTeamsDropRounds(): void
{
    if ($this->status->isArchived()) {
        throw SeasonIsArchivedException::withId($this->id ?? 0);
    }

    if ($this->teamsDropRounds) {
        $changes = ['teams_drop_rounds' => ['old' => true, 'new' => false]];

        $this->teamsDropRounds = false;

        // Reset total when disabled
        if ($this->teamsDropRoundsTotal !== null && $this->teamsDropRoundsTotal > 0) {
            $changes['teams_total_drop_rounds'] = ['old' => $this->teamsDropRoundsTotal, 'new' => null];
            $this->teamsDropRoundsTotal = null;
        }

        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new SeasonUpdated(
            seasonId: $this->id ?? 0,
            competitionId: $this->competitionId,
            changes: $changes,
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }
}

/**
 * Update the number of rounds to drop for teams.
 *
 * @throws SeasonIsArchivedException if season is archived
 * @throws \InvalidArgumentException if teams drop rounds not enabled or value invalid
 */
public function updateTeamsDropRoundsTotal(int $total): void
{
    if ($this->status->isArchived()) {
        throw SeasonIsArchivedException::withId($this->id ?? 0);
    }

    if (!$this->teamsDropRounds && $total > 0) {
        throw new \InvalidArgumentException(
            'Cannot set teams drop rounds total when teams drop rounds is disabled. Enable it first.'
        );
    }

    if ($this->teamsDropRoundsTotal !== $total) {
        $oldTotal = $this->teamsDropRoundsTotal;
        $this->teamsDropRoundsTotal = $total;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new SeasonUpdated(
            seasonId: $this->id ?? 0,
            competitionId: $this->competitionId,
            changes: ['teams_total_drop_rounds' => ['old' => $oldTotal, 'new' => $total]],
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }
}
```

#### Update `disableTeamChampionship()` Method

When team championship is disabled, clear the team-specific settings:

```php
public function disableTeamChampionship(): void
{
    if ($this->status->isArchived()) {
        throw SeasonIsArchivedException::withId($this->id ?? 0);
    }

    if ($this->teamChampionshipEnabled) {
        $changes = ['team_championship_enabled' => ['old' => true, 'new' => false]];

        $this->teamChampionshipEnabled = false;

        // Reset team championship settings when disabled
        if ($this->teamsDriversForCalculation !== null) {
            $changes['teams_drivers_for_calculation'] = ['old' => $this->teamsDriversForCalculation, 'new' => null];
            $this->teamsDriversForCalculation = null;
        }

        if ($this->teamsDropRounds) {
            $changes['teams_drop_rounds'] = ['old' => true, 'new' => false];
            $this->teamsDropRounds = false;
        }

        if ($this->teamsDropRoundsTotal !== null && $this->teamsDropRoundsTotal > 0) {
            $changes['teams_total_drop_rounds'] = ['old' => $this->teamsDropRoundsTotal, 'new' => null];
            $this->teamsDropRoundsTotal = null;
        }

        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new SeasonUpdated(
            seasonId: $this->id ?? 0,
            competitionId: $this->competitionId,
            changes: $changes,
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }
}
```

---

## 3. Application Layer Updates

### 3.1 CreateSeasonData DTO

**File**: `app/Application/Competition/DTOs/CreateSeasonData.php`

```php
public function __construct(
    // ... existing properties ...
    public bool $team_championship_enabled = false,
    public ?int $teams_drivers_for_calculation = null,    // NEW
    public bool $teams_drop_rounds = false,                // NEW
    public int $teams_total_drop_rounds = 0,               // NEW
    public bool $race_divisions_enabled = false,
    // ... rest ...
) {
}

public static function rules(): array
{
    return [
        // ... existing rules ...
        'team_championship_enabled' => ['boolean'],
        'teams_drivers_for_calculation' => ['nullable', 'integer', 'min:1', 'max:16'],
        'teams_drop_rounds' => ['boolean'],
        'teams_total_drop_rounds' => [
            'nullable',
            'integer',
            'min:0',
            'max:20',
            new ValidateTeamsDropRounds(),  // NEW custom validation rule
        ],
        // ... rest ...
    ];
}
```

### 3.2 UpdateSeasonData DTO

**File**: `app/Application/Competition/DTOs/UpdateSeasonData.php`

```php
public function __construct(
    // ... existing properties ...
    public ?bool $team_championship_enabled = null,
    public ?int $teams_drivers_for_calculation = null,    // NEW - null means "don't change", use 0 or special value for "set to null/All"
    public ?bool $teams_drop_rounds = null,                // NEW
    public ?int $teams_total_drop_rounds = null,           // NEW
    // ... rest ...
) {
}

public static function rules(): array
{
    return [
        // ... existing rules ...
        'team_championship_enabled' => ['nullable', 'boolean'],
        'teams_drivers_for_calculation' => ['nullable', 'integer', 'min:0', 'max:16'],  // 0 = "All"
        'teams_drop_rounds' => ['nullable', 'boolean'],
        'teams_total_drop_rounds' => ['nullable', 'integer', 'min:0', 'max:20'],
        // ... rest ...
    ];
}
```

### 3.3 SeasonData Output DTO

**File**: `app/Application/Competition/DTOs/SeasonData.php`

Add the new fields to the output DTO:

```php
public function __construct(
    // ... existing properties ...
    public bool $team_championship_enabled,
    public ?int $teams_drivers_for_calculation,      // NEW
    public bool $teams_drop_rounds,                   // NEW
    public ?int $teams_total_drop_rounds,            // NEW
    public bool $race_divisions_enabled,
    // ... rest ...
) {
}
```

### 3.4 Custom Validation Rule

**File**: `app/Rules/ValidateTeamsDropRounds.php`

```php
<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates that teams_total_drop_rounds is only set when teams_drop_rounds is enabled.
 */
class ValidateTeamsDropRounds implements ValidationRule, DataAwareRule
{
    /** @var array<string, mixed> */
    protected array $data = [];

    /**
     * @param array<string, mixed> $data
     */
    public function setData(array $data): static
    {
        $this->data = $data;
        return $this;
    }

    /**
     * @param Closure(string): \Illuminate\Translation\PotentiallyTranslatedString $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $teamsDropRoundsEnabled = filter_var(
            $this->data['teams_drop_rounds'] ?? false,
            FILTER_VALIDATE_BOOLEAN
        );

        if (!$teamsDropRoundsEnabled && $value !== null && $value > 0) {
            $fail('Cannot set teams drop rounds when the teams drop rounds feature is disabled.');
        }
    }
}
```

---

## 4. Infrastructure Layer Updates

### 4.1 Eloquent Model

**File**: `app/Infrastructure/Persistence/Eloquent/Models/SeasonEloquent.php`

```php
protected $fillable = [
    // ... existing fillable ...
    'team_championship_enabled',
    'teams_drivers_for_calculation',    // NEW
    'teams_drop_rounds',                 // NEW
    'teams_total_drop_rounds',          // NEW
    'race_divisions_enabled',
    // ... rest ...
];

protected $casts = [
    // ... existing casts ...
    'team_championship_enabled' => 'boolean',
    'teams_drivers_for_calculation' => 'integer',    // NEW
    'teams_drop_rounds' => 'boolean',                 // NEW
    'teams_total_drop_rounds' => 'integer',          // NEW
    // ... rest ...
];
```

### 4.2 Repository

**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentSeasonRepository.php`

#### Update `toEntity()` Method

```php
private function toEntity(SeasonEloquent $model): Season
{
    return Season::reconstitute(
        id: $model->id,
        competitionId: $model->competition_id,
        name: new SeasonName($model->name),
        slug: new SeasonSlug($model->slug),
        createdByUserId: $model->created_by_user_id,
        status: SeasonStatus::from($model->status),
        createdAt: new DateTimeImmutable($model->created_at),
        updatedAt: new DateTimeImmutable($model->updated_at),
        carClass: $model->car_class,
        description: $model->description,
        technicalSpecs: $model->technical_specs,
        logoPath: $model->logo_path,
        bannerPath: $model->banner_path,
        teamChampionshipEnabled: $model->team_championship_enabled,
        teamsDriversForCalculation: $model->teams_drivers_for_calculation,    // NEW
        teamsDropRounds: $model->teams_drop_rounds,                           // NEW
        teamsDropRoundsTotal: $model->teams_total_drop_rounds,               // NEW
        raceDivisionsEnabled: $model->race_divisions_enabled,
        raceTimesRequired: $model->race_times_required,
        dropRound: $model->drop_round,
        totalDropRounds: $model->total_drop_rounds,
        deletedAt: $model->deleted_at ? new DateTimeImmutable($model->deleted_at) : null,
    );
}
```

#### Update `save()` Method

```php
public function save(Season $season): void
{
    $data = [
        // ... existing fields ...
        'team_championship_enabled' => $season->teamChampionshipEnabled(),
        'teams_drivers_for_calculation' => $season->teamsDriversForCalculation(),    // NEW
        'teams_drop_rounds' => $season->hasTeamsDropRounds(),                         // NEW
        'teams_total_drop_rounds' => $season->teamsDropRoundsTotal(),                // NEW
        'race_divisions_enabled' => $season->raceDivisionsEnabled(),
        // ... rest ...
    ];

    // ... save logic ...
}
```

---

## 5. Application Service Updates

**File**: `app/Application/Competition/Services/SeasonApplicationService.php`

### Update `createSeason()` Method

```php
public function createSeason(CreateSeasonData $data): SeasonData
{
    // ... existing validation and logic ...

    $season = Season::create(
        competitionId: $data->competition_id,
        name: new SeasonName($data->name),
        slug: $slug,
        createdByUserId: $userId,
        carClass: $data->car_class,
        description: $data->description,
        technicalSpecs: $data->technical_specs,
        logoPath: $logoPath,
        bannerPath: $bannerPath,
        teamChampionshipEnabled: $data->team_championship_enabled,
        teamsDriversForCalculation: $data->teams_drivers_for_calculation,    // NEW
        teamsDropRounds: $data->teams_drop_rounds,                           // NEW
        teamsDropRoundsTotal: $data->teams_total_drop_rounds,               // NEW
        raceDivisionsEnabled: $data->race_divisions_enabled,
        raceTimesRequired: $data->race_times_required,
        dropRound: $data->drop_round,
        totalDropRounds: $data->total_drop_rounds,
    );

    // ... rest of method ...
}
```

### Update `updateSeason()` Method

```php
public function updateSeason(int $seasonId, UpdateSeasonData $data): SeasonData
{
    // ... existing logic ...

    // Handle teams_drivers_for_calculation
    if ($data->teams_drivers_for_calculation !== null) {
        // Special case: 0 means "All" (set to null)
        $value = $data->teams_drivers_for_calculation === 0 ? null : $data->teams_drivers_for_calculation;
        $season->updateTeamsDriversForCalculation($value);
    }

    // Handle teams_drop_rounds toggle
    if ($data->teams_drop_rounds !== null) {
        if ($data->teams_drop_rounds) {
            $season->enableTeamsDropRounds();
        } else {
            $season->disableTeamsDropRounds();
        }
    }

    // Handle teams_total_drop_rounds
    if ($data->teams_total_drop_rounds !== null) {
        $season->updateTeamsDropRoundsTotal($data->teams_total_drop_rounds);
    }

    // ... rest of method ...
}
```

---

## 6. Testing

### 6.1 Unit Tests for Season Entity

**File**: `tests/Unit/Domain/Competition/Entities/SeasonTeamSettingsTest.php`

```php
<?php

namespace Tests\Unit\Domain\Competition\Entities;

use App\Domain\Competition\Entities\Season;
use App\Domain\Competition\ValueObjects\SeasonName;
use App\Domain\Competition\ValueObjects\SeasonSlug;
use PHPUnit\Framework\TestCase;

class SeasonTeamSettingsTest extends TestCase
{
    public function test_can_set_teams_drivers_for_calculation_when_team_championship_enabled(): void
    {
        $season = $this->createSeasonWithTeamChampionship();

        $season->updateTeamsDriversForCalculation(2);

        $this->assertEquals(2, $season->teamsDriversForCalculation());
    }

    public function test_cannot_set_teams_drivers_for_calculation_when_team_championship_disabled(): void
    {
        $season = $this->createSeasonWithoutTeamChampionship();

        $this->expectException(\InvalidArgumentException::class);
        $season->updateTeamsDriversForCalculation(2);
    }

    public function test_teams_drivers_for_calculation_rejects_invalid_values(): void
    {
        $season = $this->createSeasonWithTeamChampionship();

        $this->expectException(\InvalidArgumentException::class);
        $season->updateTeamsDriversForCalculation(17); // Max is 16
    }

    public function test_can_enable_teams_drop_rounds(): void
    {
        $season = $this->createSeasonWithTeamChampionship();

        $season->enableTeamsDropRounds();

        $this->assertTrue($season->hasTeamsDropRounds());
    }

    public function test_disabling_teams_drop_rounds_resets_total(): void
    {
        $season = $this->createSeasonWithTeamChampionship();
        $season->enableTeamsDropRounds();
        $season->updateTeamsDropRoundsTotal(3);

        $season->disableTeamsDropRounds();

        $this->assertFalse($season->hasTeamsDropRounds());
        $this->assertNull($season->teamsDropRoundsTotal());
    }

    public function test_disabling_team_championship_resets_all_team_settings(): void
    {
        $season = $this->createSeasonWithTeamChampionship();
        $season->updateTeamsDriversForCalculation(2);
        $season->enableTeamsDropRounds();
        $season->updateTeamsDropRoundsTotal(3);

        $season->disableTeamChampionship();

        $this->assertNull($season->teamsDriversForCalculation());
        $this->assertFalse($season->hasTeamsDropRounds());
        $this->assertNull($season->teamsDropRoundsTotal());
    }

    // Helper methods to create test seasons...
}
```

### 6.2 Feature Tests for API

**File**: `tests/Feature/SeasonTeamSettingsApiTest.php`

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SeasonTeamSettingsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_season_with_team_settings(): void
    {
        $user = $this->createAuthenticatedUser();
        $competition = $this->createCompetition($user);

        $response = $this->postJson("/api/competitions/{$competition->id}/seasons", [
            'name' => 'Test Season',
            'team_championship_enabled' => true,
            'teams_drivers_for_calculation' => 2,
            'teams_drop_rounds' => true,
            'teams_total_drop_rounds' => 3,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.teams_drivers_for_calculation', 2);
        $response->assertJsonPath('data.teams_drop_rounds', true);
        $response->assertJsonPath('data.teams_total_drop_rounds', 3);
    }

    public function test_teams_settings_ignored_when_team_championship_disabled(): void
    {
        $user = $this->createAuthenticatedUser();
        $competition = $this->createCompetition($user);

        $response = $this->postJson("/api/competitions/{$competition->id}/seasons", [
            'name' => 'Test Season',
            'team_championship_enabled' => false,
            'teams_drivers_for_calculation' => 2,  // Should be ignored
            'teams_drop_rounds' => true,           // Should be ignored
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.teams_drivers_for_calculation', null);
        $response->assertJsonPath('data.teams_drop_rounds', false);
    }

    public function test_can_update_season_team_settings(): void
    {
        // ... test update endpoint ...
    }

    public function test_existing_seasons_have_default_team_settings(): void
    {
        // Test migration defaults for existing data
    }
}
```

---

## 7. Implementation Checklist

### Phase 1: Database
- [ ] Create migration for new fields
- [ ] Run migration on development environment
- [ ] Verify existing seasons have correct defaults

### Phase 2: Domain Layer
- [ ] Update Season entity constructor
- [ ] Add new properties to `create()` method
- [ ] Add new properties to `reconstitute()` method
- [ ] Add getter methods
- [ ] Add business logic methods for updating settings
- [ ] Update `disableTeamChampionship()` to reset team settings
- [ ] Add validation rules

### Phase 3: Application Layer
- [ ] Create `ValidateTeamsDropRounds` validation rule
- [ ] Update `CreateSeasonData` DTO
- [ ] Update `UpdateSeasonData` DTO
- [ ] Update `SeasonData` output DTO
- [ ] Update `SeasonApplicationService::createSeason()`
- [ ] Update `SeasonApplicationService::updateSeason()`

### Phase 4: Infrastructure Layer
- [ ] Update `SeasonEloquent` model fillable and casts
- [ ] Update `EloquentSeasonRepository::toEntity()`
- [ ] Update `EloquentSeasonRepository::save()`

### Phase 5: Testing
- [ ] Write unit tests for Season entity
- [ ] Write feature tests for API endpoints
- [ ] Test validation rules
- [ ] Test edge cases (disable team championship, etc.)

---

## 8. Notes for Implementation

1. **Null vs 0 for "All" drivers**: Use `null` in the database to represent "All drivers". The frontend should send `null` or a special value (like 0) that the backend converts to `null`.

2. **Cascading Resets**: When team championship is disabled, all team-specific settings should be reset to their defaults.

3. **Validation Order**: Validate that team championship is enabled before allowing team-specific settings.

4. **Backward Compatibility**: Existing seasons will have `null` for all new fields, which represents the default behavior (all drivers, no drop rounds).

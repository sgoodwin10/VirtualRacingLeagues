# Season Creation MVP - Backend Architecture Plan

**Version**: 1.1
**Last Updated**: October 23, 2025
**Status**: Requirements Confirmed - Ready for Implementation
**Author**: Backend Development Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Domain Model](#domain-model)
4. [Database Schema](#database-schema)
5. [Domain Layer Design](#domain-layer-design)
6. [Application Layer Design](#application-layer-design)
7. [Infrastructure Layer Design](#infrastructure-layer-design)
8. [Interface Layer Design](#interface-layer-design)
9. [API Endpoints Specification](#api-endpoints-specification)
10. [Business Rules & Validation](#business-rules--validation)
11. [Error Handling Strategy](#error-handling-strategy)
12. [Testing Strategy](#testing-strategy)
13. [Implementation Roadmap](#implementation-roadmap)
14. [Future Enhancements](#future-enhancements)

---

## Executive Summary

### Purpose

This document defines the backend architecture for the **Season Creation MVP**, which enables users to create and manage racing seasons within competitions. The MVP focuses on core CRUD operations and driver management while deferring advanced features like divisions, teams, and rounds to future iterations.

### Key Requirements

**In Scope (MVP)**:
- ✅ Core season CRUD (create, read, update, delete with soft deletes)
- ✅ Season-driver association (add/remove drivers from league's driver pool at any time)
- ✅ Driver status management (active, reserve, withdrawn) with promotion capability
- ✅ Driver notes for season-specific information
- ✅ Unique slug generation per league+competition+season
- ✅ Basic season settings (team championship toggle)
- ✅ Season branding (logo 500x500px/2MB, banner 1920x400px/5MB)
- ✅ Authorization (league owners and league admins only)
- ✅ Soft deletion with driver cascade (preserves league drivers)

**Out of Scope (Future)**:
- ❌ Divisions (skill-based groupings)
- ❌ Teams (team championship structure)
- ❌ Rounds (race calendar)
- ❌ CSV import for drivers
- ❌ Bulk operations
- ❌ Season templates/cloning

### Critical Architecture Decision

**THE KEY CHANGE**: Drivers are NOT created at the season level. Drivers already exist at the **league level** via the `league_drivers` pivot table. A season must **reference existing league drivers** through a new `season_drivers` pivot table.

**Hierarchy**:
```
League
  └─ League Drivers (existing - league_drivers table)
      └─ Competition
          └─ Season
              └─ Season Drivers (NEW - references league drivers)
```

### Confirmed Business Rules

All stakeholder requirements have been confirmed:

1. **Season Lifecycle**:
   - Seasons CAN be deleted even with drivers assigned (soft delete only)
   - Deletion cascades to `season_drivers` pivot but preserves league drivers
   - Archived seasons CANNOT be edited while archived (must restore to `completed` first)

2. **Driver Management**:
   - NO maximum number of drivers per season
   - Drivers CAN be removed at any time (for MVP)
   - Reserve drivers CAN be promoted to active at any time

3. **Naming & Validation**:
   - Duplicate season names ARE allowed in same competition (slugs handle uniqueness)
   - NO profanity filtering required (any name allowed)
   - Logo: 500x500px max, 2MB limit, PNG/JPG
   - Banner: 1920x400px max, 5MB limit, PNG/JPG

4. **Access Control**:
   - Only league owners and league admins can create/edit/view/delete seasons
   - NO view-only permission for MVP

---

## Architecture Overview

### DDD Four-Layer Architecture

Following the established DDD pattern in this Laravel 12 application:

```
┌─────────────────────────────────────────────────────────┐
│  Interface Layer (HTTP Controllers)                     │
│  - SeasonController (thin, 3-5 lines per method)        │
│  - SeasonDriverController (manage driver associations)  │
│  - Form Requests for validation                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Application Layer (Use Case Orchestration)             │
│  - SeasonApplicationService                             │
│  - SeasonDriverApplicationService                       │
│  - DTOs (CreateSeasonData, UpdateSeasonData, etc.)      │
│  - Transactions & event dispatching                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Domain Layer (Pure Business Logic)                     │
│  - Entities: Season, SeasonDriver                       │
│  - Value Objects: SeasonName, SeasonSlug, SeasonStatus  │
│  - Events: SeasonCreated, SeasonUpdated, etc.           │
│  - Exceptions: SeasonNotFoundException, etc.            │
│  - Repository Interfaces (NO implementations)           │
└─────────────────────────────────────────────────────────┘
                          ↑
┌─────────────────────────────────────────────────────────┐
│  Infrastructure Layer (Persistence & External)          │
│  - Eloquent Models: SeasonEloquent, SeasonDriverEloquent│
│  - Repository Implementations                           │
│  - Entity ↔ Eloquent mapping                            │
│  - Event listeners                                      │
└─────────────────────────────────────────────────────────┘
```

### Bounded Context

Seasons belong to the **Competition** bounded context (not a separate context):

- **Location**: `app/Domain/Competition/`, `app/Application/Competition/`
- **Rationale**: Seasons are part of the competition lifecycle and cannot exist without a competition
- **Alignment**: Follows existing pattern where `Competition` entity already exists

---

## Domain Model

### Entities

#### 1. Season Entity

**File**: `app/Domain/Competition/Entities/Season.php`

**Responsibilities**:
- Season lifecycle management (create, update, archive, delete)
- Slug generation and uniqueness validation
- Team championship setting
- Branding management (logo, banner)
- Business rule enforcement

**Aggregate Root**: YES (manages its own state and season-driver associations)

**Identity**: Integer ID (auto-increment)

**Key Properties**:
```php
- id: ?int
- competitionId: int (foreign key, immutable)
- name: SeasonName (value object)
- slug: SeasonSlug (value object)
- carClass: ?string (optional car restrictions)
- description: ?string (rich text)
- technicalSpecs: ?string (rich text)
- logoPath: ?string (inherits from competition if null)
- bannerPath: ?string
- teamChampionshipEnabled: bool
- status: SeasonStatus (enum: setup, active, completed, archived)
- createdByUserId: int
- createdAt: DateTimeImmutable
- updatedAt: DateTimeImmutable
- deletedAt: ?DateTimeImmutable
```

**Business Logic Methods**:
```php
+ create(): self (static factory)
+ reconstitute(): self (static factory from persistence)
+ recordCreationEvent(): void (called after ID set)
+ updateDetails(name, carClass, description, technicalSpecs): void
+ updateBranding(logoPath, bannerPath): void
+ enableTeamChampionship(): void
+ disableTeamChampionship(): void
+ changeStatus(SeasonStatus): void
+ archive(): void
+ activate(): void
+ complete(): void
+ delete(): void
+ isActive(): bool
+ isArchived(): bool
+ isDeleted(): bool
```

#### 2. SeasonDriver Entity

**File**: `app/Domain/Competition/Entities/SeasonDriver.php`

**Responsibilities**:
- Associate league drivers with seasons
- Manage driver status within season (active, reserve, withdrawn)
- Store season-specific driver notes

**Aggregate Root**: NO (part of Season aggregate, but has its own repository)

**Identity**: Integer ID (auto-increment)

**Key Properties**:
```php
- id: ?int
- seasonId: int (foreign key)
- leagueDriverId: int (foreign key to league_drivers, NOT drivers)
- status: SeasonDriverStatus (enum: active, reserve, withdrawn)
- notes: ?string (season-specific driver notes)
- addedAt: DateTimeImmutable
- updatedAt: DateTimeImmutable
```

**Business Logic Methods**:
```php
+ create(seasonId, leagueDriverId, status, notes): self (static factory)
+ reconstitute(): self (static factory)
+ updateStatus(SeasonDriverStatus): void
+ updateNotes(notes): void
+ activate(): void
+ markAsReserve(): void
+ markAsWithdrawn(): void
+ isActive(): bool
+ isReserve(): bool
+ isWithdrawn(): bool
```

### Value Objects

#### 1. SeasonName

**File**: `app/Domain/Competition/ValueObjects/SeasonName.php`

**Validation Rules**:
- Required: YES
- Min length: 3 characters
- Max length: 100 characters
- Cannot be empty or whitespace-only

**Methods**:
```php
+ from(string): self (static factory)
+ value(): string
+ equals(SeasonName): bool
```

#### 2. SeasonSlug

**File**: `app/Domain/Competition/ValueObjects/SeasonSlug.php`

**Generation Logic**:
- Source: Season name
- Format: Lowercase, hyphenated (e.g., "winter-2025")
- Uniqueness: Per league + competition + season combination
- Conflict resolution: Append incrementing number (e.g., "winter-2025-01")

**Validation Rules**:
- Max length: 150 characters
- Pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$` (lowercase alphanumeric with hyphens)

**Methods**:
```php
+ from(string): self (static factory)
+ generate(string $name): self (static factory with slug generation)
+ value(): string
+ equals(SeasonSlug): bool
```

#### 3. SeasonStatus (Enum)

**File**: `app/Domain/Competition/ValueObjects/SeasonStatus.php`

**Values**:
```php
enum SeasonStatus: string
{
    case SETUP = 'setup';         // Initial state, building structure
    case ACTIVE = 'active';       // Races happening
    case COMPLETED = 'completed'; // All races finished
    case ARCHIVED = 'archived';   // Historical record
}
```

**Methods**:
```php
+ isSetup(): bool
+ isActive(): bool
+ isCompleted(): bool
+ isArchived(): bool
```

#### 4. SeasonDriverStatus (Enum)

**File**: `app/Domain/Competition/ValueObjects/SeasonDriverStatus.php`

**Values**:
```php
enum SeasonDriverStatus: string
{
    case ACTIVE = 'active';       // Actively competing
    case RESERVE = 'reserve';     // Reserve/backup driver
    case WITHDRAWN = 'withdrawn'; // Withdrawn from season
}
```

**Methods**:
```php
+ isActive(): bool
+ isReserve(): bool
+ isWithdrawn(): bool
```

### Domain Events

#### 1. SeasonCreated

**File**: `app/Domain/Competition/Events/SeasonCreated.php`

**Payload**:
```php
public readonly int $seasonId;
public readonly int $competitionId;
public readonly int $leagueId;
public readonly string $name;
public readonly string $slug;
public readonly int $createdByUserId;
public readonly string $occurredAt;
```

**Purpose**: Log season creation, trigger notifications, update analytics

#### 2. SeasonUpdated

**File**: `app/Domain/Competition/Events/SeasonUpdated.php`

**Payload**:
```php
public readonly int $seasonId;
public readonly int $competitionId;
public readonly array $changes; // ['field' => ['old' => ..., 'new' => ...]]
public readonly string $occurredAt;
```

**Purpose**: Activity logging, audit trail

#### 3. SeasonArchived

**File**: `app/Domain/Competition/Events/SeasonArchived.php`

**Payload**:
```php
public readonly int $seasonId;
public readonly int $competitionId;
public readonly string $occurredAt;
```

#### 4. SeasonDeleted

**File**: `app/Domain/Competition/Events/SeasonDeleted.php`

**Payload**:
```php
public readonly int $seasonId;
public readonly int $competitionId;
public readonly string $occurredAt;
```

#### 5. SeasonDriverAdded

**File**: `app/Domain/Competition/Events/SeasonDriverAdded.php`

**Payload**:
```php
public readonly int $seasonDriverId;
public readonly int $seasonId;
public readonly int $leagueDriverId;
public readonly int $driverId; // Original driver ID
public readonly string $status;
public readonly string $occurredAt;
```

#### 6. SeasonDriverRemoved

**File**: `app/Domain/Competition/Events/SeasonDriverRemoved.php`

**Payload**:
```php
public readonly int $seasonDriverId;
public readonly int $seasonId;
public readonly int $leagueDriverId;
public readonly string $occurredAt;
```

#### 7. SeasonDriverStatusChanged

**File**: `app/Domain/Competition/Events/SeasonDriverStatusChanged.php`

**Payload**:
```php
public readonly int $seasonDriverId;
public readonly string $oldStatus;
public readonly string $newStatus;
public readonly string $occurredAt;
```

### Domain Exceptions

#### 1. SeasonNotFoundException

**File**: `app/Domain/Competition/Exceptions/SeasonNotFoundException.php`

```php
+ withId(int $id): self
+ withSlug(string $slug, int $competitionId): self
```

#### 2. SeasonAlreadyExistsException

**File**: `app/Domain/Competition/Exceptions/SeasonAlreadyExistsException.php`

```php
+ withSlug(string $slug, int $competitionId): self
```

#### 3. SeasonIsArchivedException

**File**: `app/Domain/Competition/Exceptions/SeasonIsArchivedException.php`

**Message**: "Cannot modify archived season"

#### 4. SeasonDriverAlreadyExistsException

**File**: `app/Domain/Competition/Exceptions/SeasonDriverAlreadyExistsException.php`

```php
+ withLeagueDriver(int $leagueDriverId, int $seasonId): self
```

#### 5. SeasonDriverNotFoundException

**File**: `app/Domain/Competition/Exceptions/SeasonDriverNotFoundException.php`

```php
+ withId(int $id): self
+ withLeagueDriver(int $leagueDriverId, int $seasonId): self
```

#### 6. InvalidSeasonSlugException

**File**: `app/Domain/Competition/Exceptions/InvalidSeasonSlugException.php`

```php
+ withValue(string $value): self
```

#### 7. LeagueDriverNotInLeagueException

**File**: `app/Domain/Competition/Exceptions/LeagueDriverNotInLeagueException.php`

**Message**: "League driver does not belong to the competition's league"

### Repository Interfaces

#### 1. SeasonRepositoryInterface

**File**: `app/Domain/Competition/Repositories/SeasonRepositoryInterface.php`

```php
interface SeasonRepositoryInterface
{
    /**
     * Save a season (create or update).
     *
     * @throws \Exception
     */
    public function save(Season $season): void;

    /**
     * Find season by ID.
     *
     * @throws SeasonNotFoundException
     */
    public function findById(int $id): Season;

    /**
     * Find season by ID including soft-deleted.
     *
     * @throws SeasonNotFoundException
     */
    public function findByIdWithTrashed(int $id): Season;

    /**
     * Find season by slug and competition.
     *
     * @throws SeasonNotFoundException
     */
    public function findBySlug(string $slug, int $competitionId): Season;

    /**
     * Get all seasons for a competition.
     *
     * @return array<Season>
     */
    public function findByCompetitionId(int $competitionId): array;

    /**
     * Get paginated seasons for a competition.
     *
     * @param array{search?: string, status?: string, include_deleted?: bool} $filters
     * @return array{data: array<Season>, total: int, per_page: int, current_page: int, last_page: int}
     */
    public function paginate(
        int $competitionId,
        int $page,
        int $perPage,
        array $filters = []
    ): array;

    /**
     * Check if season exists by slug.
     */
    public function existsBySlug(string $slug, int $competitionId): bool;

    /**
     * Generate unique slug for season.
     * Attempts base slug, then appends -01, -02, etc. until unique.
     */
    public function generateUniqueSlug(string $baseSlug, int $competitionId): string;

    /**
     * Delete season (soft delete).
     */
    public function delete(Season $season): void;

    /**
     * Permanently delete season.
     */
    public function forceDelete(Season $season): void;

    /**
     * Restore soft-deleted season.
     */
    public function restore(Season $season): void;
}
```

#### 2. SeasonDriverRepositoryInterface

**File**: `app/Domain/Competition/Repositories/SeasonDriverRepositoryInterface.php`

```php
interface SeasonDriverRepositoryInterface
{
    /**
     * Save a season-driver association.
     */
    public function save(SeasonDriver $seasonDriver): void;

    /**
     * Find season driver by ID.
     *
     * @throws SeasonDriverNotFoundException
     */
    public function findById(int $id): SeasonDriver;

    /**
     * Find season driver by season and league driver.
     *
     * @throws SeasonDriverNotFoundException
     */
    public function findBySeasonAndLeagueDriver(int $seasonId, int $leagueDriverId): SeasonDriver;

    /**
     * Get all drivers for a season.
     *
     * @return array<SeasonDriver>
     */
    public function findBySeasonId(int $seasonId): array;

    /**
     * Get drivers for season with filters.
     *
     * @param array{status?: string, search?: string} $filters
     * @return array<SeasonDriver>
     */
    public function findBySeasonIdWithFilters(int $seasonId, array $filters = []): array;

    /**
     * Check if league driver is already in season.
     */
    public function existsBySeasonAndLeagueDriver(int $seasonId, int $leagueDriverId): bool;

    /**
     * Delete season driver association.
     */
    public function delete(SeasonDriver $seasonDriver): void;

    /**
     * Get count of drivers in season by status.
     *
     * @return array{total: int, active: int, reserve: int, withdrawn: int}
     */
    public function getDriverCountsByStatus(int $seasonId): array;

    /**
     * Bulk add drivers to season.
     *
     * @param array<int> $leagueDriverIds
     */
    public function bulkAdd(int $seasonId, array $leagueDriverIds, string $status = 'active'): void;

    /**
     * Bulk remove drivers from season.
     *
     * @param array<int> $leagueDriverIds
     */
    public function bulkRemove(int $seasonId, array $leagueDriverIds): void;
}
```

---

## Database Schema

### 1. seasons Table

**Migration**: `YYYY_MM_DD_HHMMSS_create_seasons_table.php`

```php
Schema::create('seasons', function (Blueprint $table) {
    $table->id();

    // Foreign keys
    $table->foreignId('competition_id')
        ->constrained('competitions')
        ->cascadeOnDelete();
    $table->foreignId('created_by_user_id')
        ->constrained('users')
        ->restrictOnDelete();

    // Core fields
    $table->string('name', 100);
    $table->string('slug', 150);
    $table->string('car_class', 150)->nullable();
    $table->text('description')->nullable(); // Rich text
    $table->text('technical_specs')->nullable(); // Rich text

    // Branding
    $table->string('logo_path')->nullable(); // Inherits from competition if null
    $table->string('banner_path')->nullable();

    // Settings
    $table->boolean('team_championship_enabled')->default(false);

    // Status
    $table->enum('status', ['setup', 'active', 'completed', 'archived'])
        ->default('setup')
        ->index();

    // Timestamps
    $table->timestamps();
    $table->softDeletes();

    // Indexes
    $table->unique(['competition_id', 'slug']); // Slug unique per competition
    $table->index(['competition_id', 'status']);
    $table->index('created_by_user_id');
});
```

**Key Constraints**:
- `competition_id` + `slug` must be unique
- Cascade delete: Delete season when competition is deleted
- Restrict delete: Cannot delete user who created seasons

### 2. season_drivers Table (NEW)

**Migration**: `YYYY_MM_DD_HHMMSS_create_season_drivers_table.php`

```php
Schema::create('season_drivers', function (Blueprint $table) {
    $table->id();

    // Foreign keys
    $table->foreignId('season_id')
        ->constrained('seasons')
        ->cascadeOnDelete();
    $table->foreignId('league_driver_id')
        ->constrained('league_drivers')
        ->cascadeOnDelete();

    // Season-specific driver data
    $table->enum('status', ['active', 'reserve', 'withdrawn'])
        ->default('active')
        ->index();
    $table->text('notes')->nullable(); // Season-specific driver notes

    // Timestamps
    $table->timestamp('added_at')->useCurrent();
    $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

    // Constraints
    $table->unique(['season_id', 'league_driver_id'], 'unique_season_driver');

    // Indexes
    $table->index('status');
});
```

**Key Constraints**:
- `season_id` + `league_driver_id` must be unique (driver can only be added once per season)
- Cascade delete: Remove associations when season or league driver is deleted

**Relationship Chain**:
```
season_drivers.league_driver_id
  → league_drivers.id
    → league_drivers.driver_id
      → drivers.id
```

This ensures we only add drivers that belong to the competition's league.

### Database Relationships Diagram

```
leagues (id)
  ↓
league_drivers (league_id, driver_id) ← drivers (id)
  ↓
competitions (league_id)
  ↓
seasons (competition_id)
  ↓
season_drivers (season_id, league_driver_id) → league_drivers (id)
```

**Validation Flow**:
1. User creates season in competition
2. User adds driver to season by selecting from league drivers
3. Backend validates: `league_drivers.league_id = competitions.league_id`
4. If valid, create `season_drivers` record linking to `league_driver_id`

---

## Domain Layer Design

### File Structure

```
app/Domain/Competition/
├── Entities/
│   ├── Competition.php (existing)
│   ├── Season.php (NEW)
│   └── SeasonDriver.php (NEW)
├── ValueObjects/
│   ├── CompetitionName.php (existing)
│   ├── CompetitionSlug.php (existing)
│   ├── CompetitionStatus.php (existing)
│   ├── SeasonName.php (NEW)
│   ├── SeasonSlug.php (NEW)
│   ├── SeasonStatus.php (NEW)
│   └── SeasonDriverStatus.php (NEW)
├── Events/
│   ├── CompetitionCreated.php (existing)
│   ├── CompetitionUpdated.php (existing)
│   ├── SeasonCreated.php (NEW)
│   ├── SeasonUpdated.php (NEW)
│   ├── SeasonArchived.php (NEW)
│   ├── SeasonDeleted.php (NEW)
│   ├── SeasonDriverAdded.php (NEW)
│   ├── SeasonDriverRemoved.php (NEW)
│   └── SeasonDriverStatusChanged.php (NEW)
├── Exceptions/
│   ├── CompetitionNotFoundException.php (existing)
│   ├── SeasonNotFoundException.php (NEW)
│   ├── SeasonAlreadyExistsException.php (NEW)
│   ├── SeasonIsArchivedException.php (NEW)
│   ├── SeasonDriverAlreadyExistsException.php (NEW)
│   ├── SeasonDriverNotFoundException.php (NEW)
│   ├── InvalidSeasonSlugException.php (NEW)
│   └── LeagueDriverNotInLeagueException.php (NEW)
└── Repositories/
    ├── CompetitionRepositoryInterface.php (existing)
    ├── SeasonRepositoryInterface.php (NEW)
    └── SeasonDriverRepositoryInterface.php (NEW)
```

### Season Entity Implementation Outline

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Entities;

use App\Domain\Competition\Events\SeasonCreated;
use App\Domain\Competition\Events\SeasonUpdated;
use App\Domain\Competition\Events\SeasonArchived;
use App\Domain\Competition\Events\SeasonDeleted;
use App\Domain\Competition\Exceptions\SeasonIsArchivedException;
use App\Domain\Competition\ValueObjects\SeasonName;
use App\Domain\Competition\ValueObjects\SeasonSlug;
use App\Domain\Competition\ValueObjects\SeasonStatus;
use DateTimeImmutable;

final class Season
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private int $competitionId,
        private SeasonName $name,
        private SeasonSlug $slug,
        private ?string $carClass,
        private ?string $description,
        private ?string $technicalSpecs,
        private ?string $logoPath,
        private ?string $bannerPath,
        private bool $teamChampionshipEnabled,
        private SeasonStatus $status,
        private int $createdByUserId,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
        private ?DateTimeImmutable $deletedAt,
    ) {
    }

    public static function create(
        int $competitionId,
        SeasonName $name,
        SeasonSlug $slug,
        int $createdByUserId,
        ?string $carClass = null,
        ?string $description = null,
        ?string $technicalSpecs = null,
        ?string $logoPath = null,
        ?string $bannerPath = null,
        bool $teamChampionshipEnabled = false,
    ): self {
        // Factory method with business logic
        // Event recorded after ID set
    }

    public static function reconstitute(/* params */): self {
        // Reconstitute from persistence
    }

    public function recordCreationEvent(): void {
        // Called by application service after save()
    }

    // Business logic methods:
    public function updateDetails(/* params */): void;
    public function updateBranding(/* params */): void;
    public function enableTeamChampionship(): void;
    public function disableTeamChampionship(): void;
    public function archive(): void;
    public function activate(): void;
    public function complete(): void;
    public function delete(): void;

    // Status checks
    public function isActive(): bool;
    public function isArchived(): bool;
    public function isDeleted(): bool;
    public function canBeModified(): bool; // !archived && !deleted

    // Getters (all immutable except via business methods)
    public function id(): ?int;
    public function competitionId(): int;
    public function name(): SeasonName;
    public function slug(): SeasonSlug;
    // ... etc
}
```

### SeasonDriver Entity Implementation Outline

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Entities;

use App\Domain\Competition\ValueObjects\SeasonDriverStatus;
use DateTimeImmutable;

final class SeasonDriver
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private int $seasonId,
        private int $leagueDriverId,
        private SeasonDriverStatus $status,
        private ?string $notes,
        private DateTimeImmutable $addedAt,
        private DateTimeImmutable $updatedAt,
    ) {
    }

    public static function create(
        int $seasonId,
        int $leagueDriverId,
        ?SeasonDriverStatus $status = null,
        ?string $notes = null,
    ): self {
        // Factory method
        // Default status: ACTIVE
    }

    public static function reconstitute(/* params */): self;

    // Business logic
    public function updateStatus(SeasonDriverStatus $status): void;
    public function updateNotes(?string $notes): void;
    public function activate(): void;
    public function markAsReserve(): void;
    public function markAsWithdrawn(): void;

    // Status checks
    public function isActive(): bool;
    public function isReserve(): bool;
    public function isWithdrawn(): bool;

    // Getters
    public function id(): ?int;
    public function seasonId(): int;
    public function leagueDriverId(): int;
    public function status(): SeasonDriverStatus;
    public function notes(): ?string;
    // ... etc
}
```

---

## Application Layer Design

### File Structure

```
app/Application/Competition/
├── Services/
│   ├── CompetitionApplicationService.php (existing)
│   ├── SeasonApplicationService.php (NEW)
│   └── SeasonDriverApplicationService.php (NEW)
└── DTOs/
    ├── CompetitionData.php (existing)
    ├── CreateCompetitionData.php (existing)
    ├── UpdateCompetitionData.php (existing)
    ├── SeasonData.php (NEW)
    ├── CreateSeasonData.php (NEW)
    ├── UpdateSeasonData.php (NEW)
    ├── SeasonDriverData.php (NEW)
    ├── AddSeasonDriverData.php (NEW)
    └── UpdateSeasonDriverData.php (NEW)
```

### SeasonApplicationService

**File**: `app/Application/Competition/Services/SeasonApplicationService.php`

**Responsibilities**:
- Orchestrate season CRUD operations
- Manage transactions
- Dispatch domain events
- Handle slug generation
- Validate business rules
- Return DTOs (never entities)

**Methods**:

```php
final class SeasonApplicationService
{
    public function __construct(
        private readonly SeasonRepositoryInterface $seasonRepository,
        private readonly CompetitionRepositoryInterface $competitionRepository,
    ) {}

    /**
     * Create a new season.
     *
     * Business Rules:
     * - Competition must exist and be active
     * - Slug must be unique within competition
     * - User must own the league (validated in controller)
     *
     * @throws CompetitionNotFoundException
     * @throws SeasonAlreadyExistsException
     */
    public function createSeason(CreateSeasonData $data): SeasonData;

    /**
     * Update season details.
     *
     * Business Rules:
     * - Season must exist
     * - Cannot update archived season
     * - Slug regenerated if name changes
     *
     * @throws SeasonNotFoundException
     * @throws SeasonIsArchivedException
     */
    public function updateSeason(int $id, UpdateSeasonData $data): SeasonData;

    /**
     * Get season by ID.
     *
     * @throws SeasonNotFoundException
     */
    public function getSeasonById(int $id): SeasonData;

    /**
     * Get season by slug.
     *
     * @throws SeasonNotFoundException
     */
    public function getSeasonBySlug(string $slug, int $competitionId): SeasonData;

    /**
     * Get paginated seasons for a competition.
     *
     * @param array{search?: string, status?: string, include_deleted?: bool} $filters
     * @return array{data: array<SeasonData>, total: int, per_page: int, current_page: int, last_page: int}
     */
    public function getPaginatedSeasons(
        int $competitionId,
        int $page,
        int $perPage,
        array $filters = []
    ): array;

    /**
     * Archive a season.
     *
     * @throws SeasonNotFoundException
     */
    public function archiveSeason(int $id): SeasonData;

    /**
     * Activate a season.
     *
     * @throws SeasonNotFoundException
     */
    public function activateSeason(int $id): SeasonData;

    /**
     * Complete a season.
     *
     * @throws SeasonNotFoundException
     */
    public function completeSeason(int $id): SeasonData;

    /**
     * Delete a season (soft delete).
     *
     * @throws SeasonNotFoundException
     */
    public function deleteSeason(int $id): void;

    /**
     * Restore a soft-deleted season.
     *
     * @throws SeasonNotFoundException
     */
    public function restoreSeason(int $id): SeasonData;

    /**
     * Dispatch domain events from entity.
     */
    private function dispatchEvents(Season $season): void;
}
```

### SeasonDriverApplicationService

**File**: `app/Application/Competition/Services/SeasonDriverApplicationService.php`

**Responsibilities**:
- Manage season-driver associations
- Validate league driver belongs to competition's league
- Handle driver status changes
- Manage driver notes

**Methods**:

```php
final class SeasonDriverApplicationService
{
    public function __construct(
        private readonly SeasonDriverRepositoryInterface $seasonDriverRepository,
        private readonly SeasonRepositoryInterface $seasonRepository,
        private readonly LeagueDriverRepositoryInterface $leagueDriverRepository,
        private readonly CompetitionRepositoryInterface $competitionRepository,
    ) {}

    /**
     * Add a driver to a season.
     *
     * Business Rules:
     * - Season must exist
     * - League driver must exist
     * - League driver must belong to competition's league
     * - Driver cannot already be in season
     * - Season cannot be archived
     *
     * @throws SeasonNotFoundException
     * @throws SeasonIsArchivedException
     * @throws SeasonDriverAlreadyExistsException
     * @throws LeagueDriverNotInLeagueException
     */
    public function addDriverToSeason(AddSeasonDriverData $data): SeasonDriverData;

    /**
     * Remove a driver from a season.
     *
     * @throws SeasonDriverNotFoundException
     */
    public function removeDriverFromSeason(int $seasonDriverId): void;

    /**
     * Update driver status and notes.
     *
     * @throws SeasonDriverNotFoundException
     */
    public function updateSeasonDriver(
        int $seasonDriverId,
        UpdateSeasonDriverData $data
    ): SeasonDriverData;

    /**
     * Get all drivers for a season.
     *
     * @param array{status?: string, search?: string} $filters
     * @return array<SeasonDriverData>
     */
    public function getSeasonDrivers(int $seasonId, array $filters = []): array;

    /**
     * Get driver counts by status.
     *
     * @return array{total: int, active: int, reserve: int, withdrawn: int}
     */
    public function getDriverCountsByStatus(int $seasonId): array;

    /**
     * Bulk add drivers to season.
     *
     * @param array<int> $leagueDriverIds
     * @return array{added: int, skipped: int, errors: array}
     */
    public function bulkAddDrivers(
        int $seasonId,
        array $leagueDriverIds,
        string $status = 'active'
    ): array;

    /**
     * Validate league driver belongs to competition's league.
     *
     * @throws LeagueDriverNotInLeagueException
     */
    private function validateLeagueDriver(
        int $leagueDriverId,
        int $competitionId
    ): void;

    /**
     * Dispatch domain events.
     */
    private function dispatchEvents(SeasonDriver $seasonDriver): void;
}
```

### DTOs

#### CreateSeasonData

**File**: `app/Application/Competition/DTOs/CreateSeasonData.php`

```php
use Spatie\LaravelData\Data;

final class CreateSeasonData extends Data
{
    public function __construct(
        public readonly int $competition_id,
        public readonly string $name,
        public readonly ?string $car_class = null,
        public readonly ?string $description = null,
        public readonly ?string $technical_specs = null,
        public readonly ?string $logo_path = null,
        public readonly ?string $banner_path = null,
        public readonly bool $team_championship_enabled = false,
        public readonly int $created_by_user_id, // Set from auth
    ) {}

    public static function rules(): array
    {
        return [
            'competition_id' => ['required', 'integer', 'exists:competitions,id'],
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'car_class' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'technical_specs' => ['nullable', 'string', 'max:2000'],
            'logo_path' => ['nullable', 'string', 'max:255'],
            'banner_path' => ['nullable', 'string', 'max:255'],
            'team_championship_enabled' => ['boolean'],
        ];
    }
}
```

#### UpdateSeasonData

**File**: `app/Application/Competition/DTOs/UpdateSeasonData.php`

```php
final class UpdateSeasonData extends Data
{
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?string $car_class = null,
        public readonly ?string $description = null,
        public readonly ?string $technical_specs = null,
        public readonly ?string $logo_path = null,
        public readonly ?string $banner_path = null,
        public readonly ?bool $team_championship_enabled = null,
    ) {}

    public static function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'min:3', 'max:100'],
            'car_class' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'technical_specs' => ['nullable', 'string', 'max:2000'],
            'logo_path' => ['nullable', 'string', 'max:255'],
            'banner_path' => ['nullable', 'string', 'max:255'],
            'team_championship_enabled' => ['nullable', 'boolean'],
        ];
    }
}
```

#### SeasonData (Output DTO)

**File**: `app/Application/Competition/DTOs/SeasonData.php`

```php
final class SeasonData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly int $competition_id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $car_class,
        public readonly ?string $description,
        public readonly ?string $technical_specs,
        public readonly ?string $logo_path,
        public readonly ?string $banner_path,
        public readonly bool $team_championship_enabled,
        public readonly string $status,
        public readonly int $created_by_user_id,
        public readonly string $created_at,
        public readonly string $updated_at,
        public readonly ?string $deleted_at,
        // Computed/meta fields
        public readonly bool $is_active,
        public readonly bool $is_archived,
        public readonly bool $is_deleted,
        public readonly bool $can_be_modified,
    ) {}

    public static function fromEntity(Season $season): self
    {
        return new self(
            id: $season->id() ?? 0,
            competition_id: $season->competitionId(),
            name: $season->name()->value(),
            slug: $season->slug()->value(),
            car_class: $season->carClass(),
            description: $season->description(),
            technical_specs: $season->technicalSpecs(),
            logo_path: $season->logoPath(),
            banner_path: $season->bannerPath(),
            team_championship_enabled: $season->teamChampionshipEnabled(),
            status: $season->status()->value,
            created_by_user_id: $season->createdByUserId(),
            created_at: $season->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $season->updatedAt()->format('Y-m-d H:i:s'),
            deleted_at: $season->deletedAt()?->format('Y-m-d H:i:s'),
            is_active: $season->isActive(),
            is_archived: $season->isArchived(),
            is_deleted: $season->isDeleted(),
            can_be_modified: $season->canBeModified(),
        );
    }
}
```

#### AddSeasonDriverData

**File**: `app/Application/Competition/DTOs/AddSeasonDriverData.php`

```php
final class AddSeasonDriverData extends Data
{
    public function __construct(
        public readonly int $season_id,
        public readonly int $league_driver_id,
        public readonly string $status = 'active',
        public readonly ?string $notes = null,
    ) {}

    public static function rules(): array
    {
        return [
            'season_id' => ['required', 'integer', 'exists:seasons,id'],
            'league_driver_id' => ['required', 'integer', 'exists:league_drivers,id'],
            'status' => ['string', 'in:active,reserve,withdrawn'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
```

#### UpdateSeasonDriverData

**File**: `app/Application/Competition/DTOs/UpdateSeasonDriverData.php`

```php
final class UpdateSeasonDriverData extends Data
{
    public function __construct(
        public readonly ?string $status = null,
        public readonly ?string $notes = null,
    ) {}

    public static function rules(): array
    {
        return [
            'status' => ['nullable', 'string', 'in:active,reserve,withdrawn'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
```

#### SeasonDriverData (Output DTO)

**File**: `app/Application/Competition/DTOs/SeasonDriverData.php`

```php
final class SeasonDriverData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly int $season_id,
        public readonly int $league_driver_id,
        public readonly string $status,
        public readonly ?string $notes,
        public readonly string $added_at,
        public readonly string $updated_at,
        // Computed
        public readonly bool $is_active,
        public readonly bool $is_reserve,
        public readonly bool $is_withdrawn,
        // Nested driver data (from join)
        public readonly ?DriverData $driver = null,
    ) {}

    public static function fromEntity(
        SeasonDriver $seasonDriver,
        ?Driver $driver = null
    ): self {
        return new self(
            id: $seasonDriver->id() ?? 0,
            season_id: $seasonDriver->seasonId(),
            league_driver_id: $seasonDriver->leagueDriverId(),
            status: $seasonDriver->status()->value,
            notes: $seasonDriver->notes(),
            added_at: $seasonDriver->addedAt()->format('Y-m-d H:i:s'),
            updated_at: $seasonDriver->updatedAt()->format('Y-m-d H:i:s'),
            is_active: $seasonDriver->isActive(),
            is_reserve: $seasonDriver->isReserve(),
            is_withdrawn: $seasonDriver->isWithdrawn(),
            driver: $driver ? DriverData::fromEntity($driver) : null,
        );
    }
}
```

---

## Infrastructure Layer Design

### File Structure

```
app/Infrastructure/Persistence/Eloquent/
├── Models/
│   ├── CompetitionEloquent.php (existing)
│   ├── SeasonEloquent.php (NEW)
│   └── SeasonDriverEloquent.php (NEW)
└── Repositories/
    ├── EloquentCompetitionRepository.php (existing)
    ├── EloquentSeasonRepository.php (NEW)
    └── EloquentSeasonDriverRepository.php (NEW)
```

### SeasonEloquent Model

**File**: `app/Infrastructure/Persistence/Eloquent/Models/SeasonEloquent.php`

```php
<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Anemic Eloquent model for seasons.
 * NO business logic - just persistence and relationships.
 */
final class SeasonEloquent extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'seasons';

    protected $fillable = [
        'competition_id',
        'name',
        'slug',
        'car_class',
        'description',
        'technical_specs',
        'logo_path',
        'banner_path',
        'team_championship_enabled',
        'status',
        'created_by_user_id',
    ];

    protected $casts = [
        'team_championship_enabled' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relationships

    public function competition(): BelongsTo
    {
        return $this->belongsTo(CompetitionEloquent::class, 'competition_id');
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(UserEloquent::class, 'created_by_user_id');
    }

    public function seasonDrivers(): HasMany
    {
        return $this->hasMany(SeasonDriverEloquent::class, 'season_id');
    }

    // Future relationships (out of MVP scope)
    // public function divisions(): HasMany
    // public function teams(): HasMany
    // public function rounds(): HasMany
}
```

### SeasonDriverEloquent Model

**File**: `app/Infrastructure/Persistence/Eloquent/Models/SeasonDriverEloquent.php`

```php
<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Anemic Eloquent model for season-driver associations.
 * NO business logic - just persistence and relationships.
 */
final class SeasonDriverEloquent extends Model
{
    protected $table = 'season_drivers';

    public $timestamps = false; // Using custom added_at/updated_at

    protected $fillable = [
        'season_id',
        'league_driver_id',
        'status',
        'notes',
        'added_at',
        'updated_at',
    ];

    protected $casts = [
        'added_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships

    public function season(): BelongsTo
    {
        return $this->belongsTo(SeasonEloquent::class, 'season_id');
    }

    public function leagueDriver(): BelongsTo
    {
        return $this->belongsTo(LeagueDriverEloquent::class, 'league_driver_id');
    }

    /**
     * Get the actual driver through league_drivers.
     */
    public function driver(): BelongsTo
    {
        return $this->leagueDriver()->belongsTo(DriverEloquent::class, 'driver_id');
    }
}
```

### EloquentSeasonRepository

**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentSeasonRepository.php`

**Responsibilities**:
- Implement `SeasonRepositoryInterface`
- Map between `Season` entity and `SeasonEloquent` model
- Handle slug uniqueness and generation
- Manage soft deletes

**Key Methods**:

```php
final class EloquentSeasonRepository implements SeasonRepositoryInterface
{
    public function save(Season $season): void
    {
        DB::transaction(function () use ($season) {
            if ($season->id() === null) {
                // Create new
                $eloquent = new SeasonEloquent();
                $this->mapEntityToEloquent($season, $eloquent);
                $eloquent->save();
                $season->setId($eloquent->id);
            } else {
                // Update existing
                $eloquent = SeasonEloquent::withTrashed()->findOrFail($season->id());
                $this->mapEntityToEloquent($season, $eloquent);
                $eloquent->save();
            }
        });
    }

    public function findById(int $id): Season
    {
        $eloquent = SeasonEloquent::find($id);
        if (!$eloquent) {
            throw SeasonNotFoundException::withId($id);
        }
        return $this->mapEloquentToEntity($eloquent);
    }

    public function findByIdWithTrashed(int $id): Season
    {
        $eloquent = SeasonEloquent::withTrashed()->find($id);
        if (!$eloquent) {
            throw SeasonNotFoundException::withId($id);
        }
        return $this->mapEloquentToEntity($eloquent);
    }

    public function findBySlug(string $slug, int $competitionId): Season
    {
        $eloquent = SeasonEloquent::where('slug', $slug)
            ->where('competition_id', $competitionId)
            ->first();

        if (!$eloquent) {
            throw SeasonNotFoundException::withSlug($slug, $competitionId);
        }

        return $this->mapEloquentToEntity($eloquent);
    }

    public function generateUniqueSlug(string $baseSlug, int $competitionId): string
    {
        $slug = $baseSlug;
        $counter = 1;

        while ($this->existsBySlug($slug, $competitionId)) {
            $slug = sprintf('%s-%02d', $baseSlug, $counter);
            $counter++;
        }

        return $slug;
    }

    public function existsBySlug(string $slug, int $competitionId): bool
    {
        return SeasonEloquent::where('slug', $slug)
            ->where('competition_id', $competitionId)
            ->exists();
    }

    public function paginate(
        int $competitionId,
        int $page,
        int $perPage,
        array $filters = []
    ): array {
        $query = SeasonEloquent::where('competition_id', $competitionId);

        // Apply filters
        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                  ->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['include_deleted'])) {
            $query->withTrashed();
        }

        $paginator = $query->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return [
            'data' => array_map(
                fn($eloquent) => $this->mapEloquentToEntity($eloquent),
                $paginator->items()
            ),
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
        ];
    }

    private function mapEntityToEloquent(Season $entity, SeasonEloquent $eloquent): void
    {
        $eloquent->competition_id = $entity->competitionId();
        $eloquent->name = $entity->name()->value();
        $eloquent->slug = $entity->slug()->value();
        $eloquent->car_class = $entity->carClass();
        $eloquent->description = $entity->description();
        $eloquent->technical_specs = $entity->technicalSpecs();
        $eloquent->logo_path = $entity->logoPath();
        $eloquent->banner_path = $entity->bannerPath();
        $eloquent->team_championship_enabled = $entity->teamChampionshipEnabled();
        $eloquent->status = $entity->status()->value;
        $eloquent->created_by_user_id = $entity->createdByUserId();
        $eloquent->deleted_at = $entity->deletedAt();
    }

    private function mapEloquentToEntity(SeasonEloquent $eloquent): Season
    {
        return Season::reconstitute(
            id: $eloquent->id,
            competitionId: $eloquent->competition_id,
            name: SeasonName::from($eloquent->name),
            slug: SeasonSlug::from($eloquent->slug),
            carClass: $eloquent->car_class,
            description: $eloquent->description,
            technicalSpecs: $eloquent->technical_specs,
            logoPath: $eloquent->logo_path,
            bannerPath: $eloquent->banner_path,
            teamChampionshipEnabled: $eloquent->team_championship_enabled,
            status: SeasonStatus::from($eloquent->status),
            createdByUserId: $eloquent->created_by_user_id,
            createdAt: $eloquent->created_at->toDateTimeImmutable(),
            updatedAt: $eloquent->updated_at->toDateTimeImmutable(),
            deletedAt: $eloquent->deleted_at?->toDateTimeImmutable(),
        );
    }
}
```

### EloquentSeasonDriverRepository

**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentSeasonDriverRepository.php`

```php
final class EloquentSeasonDriverRepository implements SeasonDriverRepositoryInterface
{
    public function save(SeasonDriver $seasonDriver): void
    {
        DB::transaction(function () use ($seasonDriver) {
            if ($seasonDriver->id() === null) {
                $eloquent = new SeasonDriverEloquent();
                $this->mapEntityToEloquent($seasonDriver, $eloquent);
                $eloquent->save();
                $seasonDriver->setId($eloquent->id);
            } else {
                $eloquent = SeasonDriverEloquent::findOrFail($seasonDriver->id());
                $this->mapEntityToEloquent($seasonDriver, $eloquent);
                $eloquent->save();
            }
        });
    }

    public function findBySeasonAndLeagueDriver(
        int $seasonId,
        int $leagueDriverId
    ): SeasonDriver {
        $eloquent = SeasonDriverEloquent::where('season_id', $seasonId)
            ->where('league_driver_id', $leagueDriverId)
            ->first();

        if (!$eloquent) {
            throw SeasonDriverNotFoundException::withLeagueDriver(
                $leagueDriverId,
                $seasonId
            );
        }

        return $this->mapEloquentToEntity($eloquent);
    }

    public function existsBySeasonAndLeagueDriver(
        int $seasonId,
        int $leagueDriverId
    ): bool {
        return SeasonDriverEloquent::where('season_id', $seasonId)
            ->where('league_driver_id', $leagueDriverId)
            ->exists();
    }

    public function getDriverCountsByStatus(int $seasonId): array
    {
        $counts = SeasonDriverEloquent::where('season_id', $seasonId)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return [
            'total' => array_sum($counts),
            'active' => $counts['active'] ?? 0,
            'reserve' => $counts['reserve'] ?? 0,
            'withdrawn' => $counts['withdrawn'] ?? 0,
        ];
    }

    public function bulkAdd(
        int $seasonId,
        array $leagueDriverIds,
        string $status = 'active'
    ): void {
        $data = array_map(function ($leagueDriverId) use ($seasonId, $status) {
            return [
                'season_id' => $seasonId,
                'league_driver_id' => $leagueDriverId,
                'status' => $status,
                'notes' => null,
                'added_at' => now(),
                'updated_at' => now(),
            ];
        }, $leagueDriverIds);

        SeasonDriverEloquent::insert($data);
    }

    private function mapEntityToEloquent(
        SeasonDriver $entity,
        SeasonDriverEloquent $eloquent
    ): void {
        $eloquent->season_id = $entity->seasonId();
        $eloquent->league_driver_id = $entity->leagueDriverId();
        $eloquent->status = $entity->status()->value;
        $eloquent->notes = $entity->notes();
        $eloquent->added_at = $entity->addedAt();
        $eloquent->updated_at = $entity->updatedAt();
    }

    private function mapEloquentToEntity(SeasonDriverEloquent $eloquent): SeasonDriver
    {
        return SeasonDriver::reconstitute(
            id: $eloquent->id,
            seasonId: $eloquent->season_id,
            leagueDriverId: $eloquent->league_driver_id,
            status: SeasonDriverStatus::from($eloquent->status),
            notes: $eloquent->notes,
            addedAt: $eloquent->added_at->toDateTimeImmutable(),
            updatedAt: $eloquent->updated_at->toDateTimeImmutable(),
        );
    }
}
```

---

## Interface Layer Design

### File Structure

```
app/Http/Controllers/User/
├── CompetitionController.php (existing)
├── SeasonController.php (NEW)
└── SeasonDriverController.php (NEW)
```

### SeasonController

**File**: `app/Http/Controllers/User/SeasonController.php`

**Middleware**: `['auth:web', 'user.authenticate']`

**Methods**:

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\CreateSeasonData;
use App\Application\Competition\DTOs\UpdateSeasonData;
use App\Application\Competition\Services\SeasonApplicationService;
use App\Domain\Competition\Exceptions\CompetitionNotFoundException;
use App\Domain\Competition\Exceptions\SeasonNotFoundException;
use App\Domain\Competition\Exceptions\SeasonAlreadyExistsException;
use App\Domain\Competition\Exceptions\SeasonIsArchivedException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Thin controller for season management.
 * Each method: 3-5 lines max.
 */
final class SeasonController extends Controller
{
    public function __construct(
        private readonly SeasonApplicationService $seasonService,
    ) {}

    /**
     * GET /api/competitions/{competitionId}/seasons
     * List seasons for a competition (paginated).
     */
    public function index(Request $request, int $competitionId): JsonResponse
    {
        $filters = [
            'search' => $request->input('search'),
            'status' => $request->input('status'),
            'include_deleted' => $request->boolean('include_deleted'),
        ];

        $result = $this->seasonService->getPaginatedSeasons(
            competitionId: $competitionId,
            page: (int) $request->input('page', 1),
            perPage: (int) $request->input('per_page', 15),
            filters: $filters,
        );

        return ApiResponse::paginated($result['data'], [
            'total' => $result['total'],
            'per_page' => $result['per_page'],
            'current_page' => $result['current_page'],
            'last_page' => $result['last_page'],
        ]);
    }

    /**
     * POST /api/competitions/{competitionId}/seasons
     * Create a new season.
     */
    public function store(Request $request, int $competitionId): JsonResponse
    {
        $validated = $request->validate(CreateSeasonData::rules());
        $validated['competition_id'] = $competitionId;
        $validated['created_by_user_id'] = auth('web')->id();

        try {
            $data = CreateSeasonData::from($validated);
            $seasonData = $this->seasonService->createSeason($data);
            return ApiResponse::created($seasonData->toArray(), 'Season created successfully');
        } catch (CompetitionNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (SeasonAlreadyExistsException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    /**
     * GET /api/seasons/{id}
     * Show a specific season.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $seasonData = $this->seasonService->getSeasonById($id);
            return ApiResponse::success($seasonData->toArray());
        } catch (SeasonNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * PUT /api/seasons/{id}
     * Update a season.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate(UpdateSeasonData::rules());

        try {
            $data = UpdateSeasonData::from($validated);
            $seasonData = $this->seasonService->updateSeason($id, $data);
            return ApiResponse::success($seasonData->toArray(), 'Season updated successfully');
        } catch (SeasonNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (SeasonIsArchivedException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    /**
     * DELETE /api/seasons/{id}
     * Soft delete a season.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->seasonService->deleteSeason($id);
            return ApiResponse::success(null, 'Season deleted successfully');
        } catch (SeasonNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * POST /api/seasons/{id}/archive
     * Archive a season.
     */
    public function archive(int $id): JsonResponse
    {
        try {
            $seasonData = $this->seasonService->archiveSeason($id);
            return ApiResponse::success($seasonData->toArray(), 'Season archived successfully');
        } catch (SeasonNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * POST /api/seasons/{id}/activate
     * Activate a season.
     */
    public function activate(int $id): JsonResponse
    {
        try {
            $seasonData = $this->seasonService->activateSeason($id);
            return ApiResponse::success($seasonData->toArray(), 'Season activated successfully');
        } catch (SeasonNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * POST /api/seasons/{id}/complete
     * Mark season as completed.
     */
    public function complete(int $id): JsonResponse
    {
        try {
            $seasonData = $this->seasonService->completeSeason($id);
            return ApiResponse::success($seasonData->toArray(), 'Season completed successfully');
        } catch (SeasonNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * POST /api/seasons/{id}/restore
     * Restore a soft-deleted season.
     */
    public function restore(int $id): JsonResponse
    {
        try {
            $seasonData = $this->seasonService->restoreSeason($id);
            return ApiResponse::success($seasonData->toArray(), 'Season restored successfully');
        } catch (SeasonNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }
}
```

### SeasonDriverController

**File**: `app/Http/Controllers/User/SeasonDriverController.php`

**Middleware**: `['auth:web', 'user.authenticate']`

**Methods**:

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\AddSeasonDriverData;
use App\Application\Competition\DTOs\UpdateSeasonDriverData;
use App\Application\Competition\Services\SeasonDriverApplicationService;
use App\Domain\Competition\Exceptions\SeasonDriverAlreadyExistsException;
use App\Domain\Competition\Exceptions\SeasonDriverNotFoundException;
use App\Domain\Competition\Exceptions\SeasonNotFoundException;
use App\Domain\Competition\Exceptions\LeagueDriverNotInLeagueException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Thin controller for season driver management.
 */
final class SeasonDriverController extends Controller
{
    public function __construct(
        private readonly SeasonDriverApplicationService $seasonDriverService,
    ) {}

    /**
     * GET /api/seasons/{seasonId}/drivers
     * List drivers in a season.
     */
    public function index(Request $request, int $seasonId): JsonResponse
    {
        $filters = [
            'status' => $request->input('status'),
            'search' => $request->input('search'),
        ];

        $drivers = $this->seasonDriverService->getSeasonDrivers($seasonId, $filters);
        return ApiResponse::success(['data' => array_map(fn($d) => $d->toArray(), $drivers)]);
    }

    /**
     * POST /api/seasons/{seasonId}/drivers
     * Add a driver to the season.
     */
    public function store(Request $request, int $seasonId): JsonResponse
    {
        $validated = $request->validate(AddSeasonDriverData::rules());
        $validated['season_id'] = $seasonId;

        try {
            $data = AddSeasonDriverData::from($validated);
            $driverData = $this->seasonDriverService->addDriverToSeason($data);
            return ApiResponse::created($driverData->toArray(), 'Driver added to season');
        } catch (SeasonNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (SeasonDriverAlreadyExistsException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        } catch (LeagueDriverNotInLeagueException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    /**
     * PUT /api/season-drivers/{id}
     * Update season driver status/notes.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate(UpdateSeasonDriverData::rules());

        try {
            $data = UpdateSeasonDriverData::from($validated);
            $driverData = $this->seasonDriverService->updateSeasonDriver($id, $data);
            return ApiResponse::success($driverData->toArray(), 'Driver updated successfully');
        } catch (SeasonDriverNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * DELETE /api/season-drivers/{id}
     * Remove driver from season.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->seasonDriverService->removeDriverFromSeason($id);
            return ApiResponse::success(null, 'Driver removed from season');
        } catch (SeasonDriverNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * GET /api/seasons/{seasonId}/drivers/stats
     * Get driver counts by status.
     */
    public function stats(int $seasonId): JsonResponse
    {
        $stats = $this->seasonDriverService->getDriverCountsByStatus($seasonId);
        return ApiResponse::success($stats);
    }

    /**
     * POST /api/seasons/{seasonId}/drivers/bulk-add
     * Bulk add drivers to season.
     */
    public function bulkAdd(Request $request, int $seasonId): JsonResponse
    {
        $validated = $request->validate([
            'league_driver_ids' => 'required|array',
            'league_driver_ids.*' => 'integer|exists:league_drivers,id',
            'status' => 'string|in:active,reserve,withdrawn',
        ]);

        $result = $this->seasonDriverService->bulkAddDrivers(
            $seasonId,
            $validated['league_driver_ids'],
            $validated['status'] ?? 'active'
        );

        return ApiResponse::success($result, 'Drivers added to season');
    }
}
```

---

## API Endpoints Specification

### Season Management

| Method | Endpoint | Description | Auth | Returns |
|--------|----------|-------------|------|---------|
| GET | `/api/competitions/{competitionId}/seasons` | List seasons (paginated) | ✅ | Paginated SeasonData |
| POST | `/api/competitions/{competitionId}/seasons` | Create season | ✅ | SeasonData (201) |
| GET | `/api/seasons/{id}` | Get season by ID | ✅ | SeasonData |
| PUT | `/api/seasons/{id}` | Update season | ✅ | SeasonData |
| DELETE | `/api/seasons/{id}` | Soft delete season | ✅ | Success message |
| POST | `/api/seasons/{id}/archive` | Archive season | ✅ | SeasonData |
| POST | `/api/seasons/{id}/activate` | Activate season | ✅ | SeasonData |
| POST | `/api/seasons/{id}/complete` | Complete season | ✅ | SeasonData |
| POST | `/api/seasons/{id}/restore` | Restore deleted season | ✅ | SeasonData |

### Season Driver Management

| Method | Endpoint | Description | Auth | Returns |
|--------|----------|-------------|------|---------|
| GET | `/api/seasons/{seasonId}/drivers` | List drivers in season | ✅ | Array of SeasonDriverData |
| POST | `/api/seasons/{seasonId}/drivers` | Add driver to season | ✅ | SeasonDriverData (201) |
| PUT | `/api/season-drivers/{id}` | Update driver status/notes | ✅ | SeasonDriverData |
| DELETE | `/api/season-drivers/{id}` | Remove driver from season | ✅ | Success message |
| GET | `/api/seasons/{seasonId}/drivers/stats` | Get driver counts | ✅ | Stats object |
| POST | `/api/seasons/{seasonId}/drivers/bulk-add` | Bulk add drivers | ✅ | Bulk result |

### Example Request/Response

#### Create Season

**Request**:
```http
POST /api/competitions/5/seasons
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Winter 2025 Championship",
  "car_class": "GT3 Cars Only",
  "description": "<p>Exciting winter racing season...</p>",
  "technical_specs": "<p>BOP enabled, tire restrictions...</p>",
  "logo_path": "/storage/seasons/logo-abc123.png",
  "banner_path": "/storage/seasons/banner-abc123.jpg",
  "team_championship_enabled": true
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Season created successfully",
  "data": {
    "id": 42,
    "competition_id": 5,
    "name": "Winter 2025 Championship",
    "slug": "winter-2025-championship",
    "car_class": "GT3 Cars Only",
    "description": "<p>Exciting winter racing season...</p>",
    "technical_specs": "<p>BOP enabled, tire restrictions...</p>",
    "logo_path": "/storage/seasons/logo-abc123.png",
    "banner_path": "/storage/seasons/banner-abc123.jpg",
    "team_championship_enabled": true,
    "status": "setup",
    "created_by_user_id": 12,
    "created_at": "2025-10-23 14:30:00",
    "updated_at": "2025-10-23 14:30:00",
    "deleted_at": null,
    "is_active": false,
    "is_archived": false,
    "is_deleted": false,
    "can_be_modified": true
  }
}
```

#### Add Driver to Season

**Request**:
```http
POST /api/seasons/42/drivers
Content-Type: application/json
Authorization: Bearer {token}

{
  "league_driver_id": 87,
  "status": "active",
  "notes": "Experienced GT3 driver, aiming for championship"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Driver added to season",
  "data": {
    "id": 156,
    "season_id": 42,
    "league_driver_id": 87,
    "status": "active",
    "notes": "Experienced GT3 driver, aiming for championship",
    "added_at": "2025-10-23 15:00:00",
    "updated_at": "2025-10-23 15:00:00",
    "is_active": true,
    "is_reserve": false,
    "is_withdrawn": false,
    "driver": {
      "id": 23,
      "first_name": "John",
      "last_name": "Smith",
      "nickname": "JSmith",
      "slug": "john-smith",
      "psn_id": "jsmith77",
      "iracing_id": null,
      "email": "john@example.com"
    }
  }
}
```

---

## Business Rules & Validation

### Season Creation Rules

1. **Competition Existence**: Competition must exist and be active
2. **Authorization**: Only league owners and users with league admin permissions can create seasons
3. **Name Validation**:
   - Required
   - Min: 3 characters
   - Max: 100 characters
   - Cannot be empty/whitespace
   - **Duplicate names allowed**: Two seasons CAN have the same name in the same competition (slugs handle uniqueness)
   - **No profanity filtering**: Any name is allowed
4. **Slug Uniqueness**: Slug must be unique per competition (auto-generated, conflict resolution via numbering)
5. **Image Validation**:
   - **Logo**: 500x500px maximum, 2MB file size limit, PNG/JPG formats
   - **Banner**: 1920x400px maximum, 5MB file size limit, PNG/JPG formats
   - Logo inherits from competition by default if not provided
6. **Optional Fields**: Car class, description, technical specs, logo, banner all nullable
7. **Default Status**: `setup` (initial state)
8. **Team Championship**: Defaults to `false`

### Season Update Rules

1. **Season Existence**: Season must exist (including soft-deleted if restoring)
2. **Authorization**: Only league owners and users with league admin permissions can update seasons
3. **Archive Restriction**: Archived seasons CANNOT be edited while in archived status
   - To edit an archived season, it must first be restored to `completed` status
   - Once restored to `completed`, normal editing rules apply
4. **Slug Regeneration**: If name changes, slug regenerates with uniqueness check
5. **Partial Updates**: All fields optional in update DTO
6. **Image Validation**: Same validation rules as creation (500x500px/2MB for logo, 1920x400px/5MB for banner)

### Season Driver Association Rules

1. **Season Existence**: Season must exist and not be archived
2. **League Driver Existence**: League driver must exist
3. **League Validation**: League driver must belong to competition's league
   - Query chain: `league_drivers.league_id = competitions.league_id`
   - Throw `LeagueDriverNotInLeagueException` if mismatch
4. **Uniqueness**: League driver can only be added once per season
5. **Default Status**: `active` if not specified
6. **Notes**: Optional, max 1000 characters
7. **No Maximum Limit**: There is NO maximum number of drivers that can be added to a season
8. **Driver Removal**: Drivers CAN be removed from a season at any time (for MVP)
9. **Reserve Promotion**: Reserve drivers CAN be promoted to active status at any time

### Slug Generation Logic

**Algorithm**:
```
1. Input: Season name (e.g., "Winter 2025 Championship")
2. Lowercase and slugify: "winter-2025-championship"
3. Check uniqueness within competition
4. If unique: return slug
5. If not unique:
   - Append "-01": "winter-2025-championship-01"
   - Check uniqueness
   - If not unique, increment: "-02", "-03", etc.
   - Return first unique slug
```

**Implementation** (in `SeasonSlug` value object):
```php
public static function generate(string $name): self
{
    $slug = Str::slug($name);

    if (mb_strlen($slug) > 150) {
        $slug = mb_substr($slug, 0, 150);
    }

    return new self($slug);
}
```

**Uniqueness Check** (in repository):
```php
public function generateUniqueSlug(string $baseSlug, int $competitionId): string
{
    $slug = $baseSlug;
    $counter = 1;

    while ($this->existsBySlug($slug, $competitionId)) {
        $slug = sprintf('%s-%02d', $baseSlug, $counter);
        $counter++;

        if ($counter > 99) {
            throw new \RuntimeException('Unable to generate unique slug after 99 attempts');
        }
    }

    return $slug;
}
```

### Season Deletion Rules

1. **Soft Delete**: All deletions are soft deletes (sets `deleted_at` timestamp)
2. **Deletion With Drivers**: Seasons CAN be deleted even if they have drivers assigned
   - Deletion cascades to `season_drivers` pivot table (removes season-driver associations)
   - Does NOT delete league drivers (they remain in `league_drivers` table)
   - Does NOT delete original drivers from `drivers` table
3. **Restoration**: Deleted seasons can be restored with `restore()` method
4. **Authorization**: Only league owners and users with league admin permissions can delete seasons
5. **Permanent Deletion**: Physical deletion from database is not supported in MVP (soft delete only)

### Status Transition Rules

**Allowed Transitions**:
```
setup → active
setup → archived
active → completed
active → archived
completed → archived
archived → completed (must restore to completed before editing)
any → deleted (soft delete)
deleted → previous status (restore)
```

**Business Logic**:
- `setup`: Initial state, building structure (drivers, divisions, rounds)
- `active`: Races are happening
- `completed`: All races finished, results finalized
- `archived`: Historical record, read-only (cannot edit while archived)
- `deleted`: Soft deleted, can be restored

**Archive Editing Restriction**:
- Archived seasons are read-only and cannot be edited
- To edit an archived season: restore it to `completed` status first, then make edits
- After editing, it can be re-archived if needed

### Validation Error Messages

```php
// CreateSeasonData validation
'name.required' => 'Season name is required'
'name.min' => 'Season name must be at least 3 characters'
'name.max' => 'Season name cannot exceed 100 characters'
'competition_id.required' => 'Competition ID is required'
'competition_id.exists' => 'Competition does not exist'
'car_class.max' => 'Car class cannot exceed 150 characters'
'description.max' => 'Description cannot exceed 2000 characters'
'technical_specs.max' => 'Technical specs cannot exceed 2000 characters'
'team_championship_enabled.boolean' => 'Team championship must be true or false'
'logo.image' => 'Logo must be an image file'
'logo.mimes' => 'Logo must be a PNG or JPG file'
'logo.max' => 'Logo file size cannot exceed 2MB'
'logo.dimensions' => 'Logo dimensions must not exceed 500x500px'
'banner.image' => 'Banner must be an image file'
'banner.mimes' => 'Banner must be a PNG or JPG file'
'banner.max' => 'Banner file size cannot exceed 5MB'
'banner.dimensions' => 'Banner dimensions must not exceed 1920x400px'

// AddSeasonDriverData validation
'season_id.required' => 'Season ID is required'
'season_id.exists' => 'Season does not exist'
'league_driver_id.required' => 'League driver ID is required'
'league_driver_id.exists' => 'League driver does not exist'
'status.in' => 'Status must be active, reserve, or withdrawn'
'notes.max' => 'Notes cannot exceed 1000 characters'
```

### Image Upload & Validation

**Logo Requirements**:
- **Format**: PNG or JPG only
- **Maximum dimensions**: 500x500 pixels
- **Maximum file size**: 2MB (2048 KB)
- **Default behavior**: If no logo provided, inherit from competition logo
- **Storage path**: `/storage/seasons/logo-{hash}.{ext}`

**Banner Requirements**:
- **Format**: PNG or JPG only
- **Maximum dimensions**: 1920x400 pixels
- **Maximum file size**: 5MB (5120 KB)
- **Optional**: Banner is completely optional (nullable)
- **Storage path**: `/storage/seasons/banner-{hash}.{ext}`

**Validation Rules** (in Form Request):
```php
// For logo upload
'logo' => [
    'nullable',
    'image',
    'mimes:png,jpg,jpeg',
    'max:2048', // 2MB in kilobytes
    'dimensions:max_width=500,max_height=500',
],

// For banner upload
'banner' => [
    'nullable',
    'image',
    'mimes:png,jpg,jpeg',
    'max:5120', // 5MB in kilobytes
    'dimensions:max_width=1920,max_height=400',
],
```

**Upload Flow**:
1. User submits multipart/form-data request with image files
2. Laravel validates file format, size, and dimensions
3. If valid, store file using Laravel Storage facade
4. Generate unique filename with hash to prevent collisions
5. Save path to database in `logo_path` or `banner_path` column
6. Return full URL in API response (e.g., `/storage/seasons/logo-abc123.png`)

**Implementation Note**: The DTOs use string paths (`logo_path`, `banner_path`) because file upload handling happens in the controller/service layer before DTO creation. The controller will:
1. Validate and upload the file
2. Get the storage path
3. Pass the path string to the DTO

### Authorization & Permissions

**Access Control Rules**:

1. **Who Can Manage Seasons**:
   - League owners (users who created the league)
   - Users with league admin permissions

2. **Permissions Required**:
   - **Create Season**: League owner OR league admin permission
   - **View Season**: League owner OR league admin permission
   - **Update Season**: League owner OR league admin permission
   - **Delete Season**: League owner OR league admin permission
   - **Restore Season**: League owner OR league admin permission
   - **Manage Drivers**: League owner OR league admin permission

3. **No View-Only Permission** (for MVP):
   - All authorized users have full CRUD access
   - No separate view-only role in MVP
   - Future enhancement: May add view-only permissions for league members

4. **Implementation**:
   - Use Laravel policies: `SeasonPolicy`
   - Check league ownership via: `$league->user_id === $user->id`
   - Check league admin permission via: `league_user` pivot table with `role = 'admin'`
   - Apply to all controller methods using `authorize()` or policy middleware

5. **Authorization Failure**:
   - Return 403 Forbidden if user lacks permission
   - Error message: "You do not have permission to manage seasons for this league"

**Example Policy Check**:
```php
// In SeasonPolicy.php
public function create(User $user, League $league): bool
{
    return $user->id === $league->user_id ||
           $league->admins()->where('user_id', $user->id)->exists();
}

public function update(User $user, Season $season): bool
{
    $league = $season->competition->league;
    return $user->id === $league->user_id ||
           $league->admins()->where('user_id', $user->id)->exists();
}
```

---

## Error Handling Strategy

### Exception Hierarchy

```
RuntimeException
  ├─ DomainException (app/Domain/Shared/Exceptions/)
  │   ├─ SeasonNotFoundException (404)
  │   ├─ SeasonAlreadyExistsException (422)
  │   ├─ SeasonIsArchivedException (422)
  │   ├─ SeasonDriverNotFoundException (404)
  │   ├─ SeasonDriverAlreadyExistsException (422)
  │   ├─ InvalidSeasonSlugException (422)
  │   └─ LeagueDriverNotInLeagueException (422)
  └─ ValidationException (Laravel, 422)
```

### HTTP Status Codes

| Exception | HTTP Status | Message Example |
|-----------|-------------|-----------------|
| Authorization failure | 403 | "You do not have permission to manage seasons for this league" |
| `SeasonNotFoundException` | 404 | "Season with ID 42 not found" |
| `SeasonAlreadyExistsException` | 422 | "Season with slug 'winter-2025' already exists in this competition" |
| `SeasonIsArchivedException` | 422 | "Cannot modify archived season" |
| `SeasonDriverNotFoundException` | 404 | "Season driver with ID 156 not found" |
| `SeasonDriverAlreadyExistsException` | 422 | "Driver already exists in this season" |
| `LeagueDriverNotInLeagueException` | 422 | "League driver does not belong to this competition's league" |
| `CompetitionNotFoundException` | 404 | "Competition with ID 5 not found" |
| Validation errors | 422 | Field-specific validation messages |

### Error Response Format

**Standard Error Response**:
```json
{
  "success": false,
  "message": "Season with ID 42 not found",
  "data": null,
  "errors": null
}
```

**Validation Error Response**:
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": {
    "name": ["Season name is required"],
    "competition_id": ["Competition does not exist"]
  }
}
```

### Global Exception Handler

**Register in** `app/Exceptions/Handler.php`:

```php
use App\Domain\Competition\Exceptions\SeasonNotFoundException;
use App\Domain\Competition\Exceptions\SeasonAlreadyExistsException;
// ... other exceptions

public function register(): void
{
    $this->renderable(function (SeasonNotFoundException $e, Request $request) {
        if ($request->expectsJson()) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    });

    $this->renderable(function (SeasonAlreadyExistsException $e, Request $request) {
        if ($request->expectsJson()) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    });

    // ... register other exceptions
}
```

---

## Testing Strategy

### Unit Tests (Domain Layer)

**Target**: 100% coverage of entities and value objects

#### Season Entity Tests

**File**: `tests/Unit/Domain/Competition/Entities/SeasonTest.php`

```php
class SeasonTest extends TestCase
{
    public function test_can_create_season(): void
    {
        $season = Season::create(
            competitionId: 5,
            name: SeasonName::from('Winter 2025'),
            slug: SeasonSlug::from('winter-2025'),
            createdByUserId: 12,
        );

        $this->assertNull($season->id());
        $this->assertEquals('Winter 2025', $season->name()->value());
        $this->assertEquals('winter-2025', $season->slug()->value());
        $this->assertEquals(SeasonStatus::SETUP, $season->status());
    }

    public function test_can_update_details(): void
    {
        $season = Season::reconstitute(/* params */);

        $season->updateDetails(
            name: SeasonName::from('Updated Name'),
            carClass: 'GT3',
            description: 'New description',
            technicalSpecs: 'New specs'
        );

        $this->assertEquals('Updated Name', $season->name()->value());
        $this->assertTrue($season->hasEvents());
    }

    public function test_cannot_update_archived_season(): void
    {
        $season = Season::reconstitute(/* ... status: ARCHIVED */);

        $this->expectException(SeasonIsArchivedException::class);
        $season->updateDetails(/* params */);
    }

    public function test_can_archive_season(): void
    {
        $season = Season::reconstitute(/* ... status: ACTIVE */);

        $season->archive();

        $this->assertTrue($season->isArchived());
        $this->assertNotNull($season->archivedAt());
    }

    public function test_emits_season_created_event_after_id_set(): void
    {
        $season = Season::create(/* params */);
        $season->setId(42);
        $season->recordCreationEvent();

        $events = $season->releaseEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(SeasonCreated::class, $events[0]);
    }
}
```

#### SeasonDriver Entity Tests

**File**: `tests/Unit/Domain/Competition/Entities/SeasonDriverTest.php`

```php
class SeasonDriverTest extends TestCase
{
    public function test_can_create_season_driver(): void
    {
        $seasonDriver = SeasonDriver::create(
            seasonId: 42,
            leagueDriverId: 87,
        );

        $this->assertEquals(42, $seasonDriver->seasonId());
        $this->assertEquals(87, $seasonDriver->leagueDriverId());
        $this->assertEquals(SeasonDriverStatus::ACTIVE, $seasonDriver->status());
    }

    public function test_can_update_status(): void
    {
        $seasonDriver = SeasonDriver::reconstitute(/* params */);

        $seasonDriver->updateStatus(SeasonDriverStatus::RESERVE);

        $this->assertTrue($seasonDriver->isReserve());
        $this->assertFalse($seasonDriver->isActive());
    }

    public function test_can_mark_as_withdrawn(): void
    {
        $seasonDriver = SeasonDriver::reconstitute(/* params */);

        $seasonDriver->markAsWithdrawn();

        $this->assertTrue($seasonDriver->isWithdrawn());
    }
}
```

#### Value Object Tests

**File**: `tests/Unit/Domain/Competition/ValueObjects/SeasonNameTest.php`

```php
class SeasonNameTest extends TestCase
{
    public function test_can_create_valid_name(): void
    {
        $name = SeasonName::from('Winter 2025');
        $this->assertEquals('Winter 2025', $name->value());
    }

    public function test_rejects_empty_name(): void
    {
        $this->expectException(InvalidArgumentException::class);
        SeasonName::from('');
    }

    public function test_rejects_name_too_short(): void
    {
        $this->expectException(InvalidArgumentException::class);
        SeasonName::from('AB');
    }

    public function test_rejects_name_too_long(): void
    {
        $this->expectException(InvalidArgumentException::class);
        SeasonName::from(str_repeat('A', 101));
    }
}
```

### Feature Tests (HTTP Layer)

**Target**: Cover all API endpoints

#### SeasonController Tests

**File**: `tests/Feature/User/SeasonControllerTest.php`

```php
use Illuminate\Foundation\Testing\RefreshDatabase;

class SeasonControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private League $league;
    private Competition $competition;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->league = League::factory()->create(['owner_user_id' => $this->user->id]);
        $this->competition = Competition::factory()->create(['league_id' => $this->league->id]);
    }

    public function test_user_can_create_season(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/competitions/{$this->competition->id}/seasons", [
                'name' => 'Winter 2025 Championship',
                'car_class' => 'GT3',
                'description' => 'Exciting season',
                'team_championship_enabled' => true,
            ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'name',
                'slug',
                'status',
            ],
        ]);

        $this->assertDatabaseHas('seasons', [
            'competition_id' => $this->competition->id,
            'name' => 'Winter 2025 Championship',
            'slug' => 'winter-2025-championship',
        ]);
    }

    public function test_user_can_list_seasons(): void
    {
        Season::factory()->count(3)->create([
            'competition_id' => $this->competition->id,
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson("/api/competitions/{$this->competition->id}/seasons");

        $response->assertOk();
        $response->assertJsonCount(3, 'data');
    }

    public function test_user_can_update_season(): void
    {
        $season = Season::factory()->create([
            'competition_id' => $this->competition->id,
            'name' => 'Original Name',
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/seasons/{$season->id}", [
                'name' => 'Updated Name',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('seasons', [
            'id' => $season->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_cannot_update_archived_season(): void
    {
        $season = Season::factory()->create([
            'competition_id' => $this->competition->id,
            'status' => 'archived',
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/seasons/{$season->id}", [
                'name' => 'New Name',
            ]);

        $response->assertStatus(422);
    }

    public function test_user_can_archive_season(): void
    {
        $season = Season::factory()->create([
            'competition_id' => $this->competition->id,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/seasons/{$season->id}/archive");

        $response->assertOk();
        $this->assertEquals('archived', $season->fresh()->status);
    }

    public function test_slug_uniqueness_enforced(): void
    {
        Season::factory()->create([
            'competition_id' => $this->competition->id,
            'name' => 'Winter 2025',
            'slug' => 'winter-2025',
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/competitions/{$this->competition->id}/seasons", [
                'name' => 'Winter 2025', // Same name, will generate slug "winter-2025-01"
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('seasons', [
            'slug' => 'winter-2025-01',
        ]);
    }
}
```

#### SeasonDriverController Tests

**File**: `tests/Feature/User/SeasonDriverControllerTest.php`

```php
class SeasonDriverControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Season $season;
    private LeagueDriver $leagueDriver;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $league = League::factory()->create(['owner_user_id' => $this->user->id]);
        $competition = Competition::factory()->create(['league_id' => $league->id]);
        $this->season = Season::factory()->create(['competition_id' => $competition->id]);

        $driver = Driver::factory()->create();
        $this->leagueDriver = LeagueDriver::factory()->create([
            'league_id' => $league->id,
            'driver_id' => $driver->id,
        ]);
    }

    public function test_user_can_add_driver_to_season(): void
    {
        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/seasons/{$this->season->id}/drivers", [
                'league_driver_id' => $this->leagueDriver->id,
                'status' => 'active',
                'notes' => 'Great driver',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('season_drivers', [
            'season_id' => $this->season->id,
            'league_driver_id' => $this->leagueDriver->id,
        ]);
    }

    public function test_cannot_add_driver_from_different_league(): void
    {
        $otherLeague = League::factory()->create();
        $otherDriver = Driver::factory()->create();
        $otherLeagueDriver = LeagueDriver::factory()->create([
            'league_id' => $otherLeague->id,
            'driver_id' => $otherDriver->id,
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/seasons/{$this->season->id}/drivers", [
                'league_driver_id' => $otherLeagueDriver->id,
            ]);

        $response->assertStatus(422);
    }

    public function test_cannot_add_same_driver_twice(): void
    {
        SeasonDriver::factory()->create([
            'season_id' => $this->season->id,
            'league_driver_id' => $this->leagueDriver->id,
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->postJson("/api/seasons/{$this->season->id}/drivers", [
                'league_driver_id' => $this->leagueDriver->id,
            ]);

        $response->assertStatus(422);
    }

    public function test_user_can_update_driver_status(): void
    {
        $seasonDriver = SeasonDriver::factory()->create([
            'season_id' => $this->season->id,
            'league_driver_id' => $this->leagueDriver->id,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->putJson("/api/season-drivers/{$seasonDriver->id}", [
                'status' => 'reserve',
            ]);

        $response->assertOk();
        $this->assertEquals('reserve', $seasonDriver->fresh()->status);
    }

    public function test_user_can_remove_driver_from_season(): void
    {
        $seasonDriver = SeasonDriver::factory()->create([
            'season_id' => $this->season->id,
            'league_driver_id' => $this->leagueDriver->id,
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->deleteJson("/api/season-drivers/{$seasonDriver->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('season_drivers', [
            'id' => $seasonDriver->id,
        ]);
    }

    public function test_user_can_get_driver_stats(): void
    {
        SeasonDriver::factory()->create([
            'season_id' => $this->season->id,
            'status' => 'active',
        ]);
        SeasonDriver::factory()->create([
            'season_id' => $this->season->id,
            'status' => 'reserve',
        ]);

        $response = $this->actingAs($this->user, 'web')
            ->getJson("/api/seasons/{$this->season->id}/drivers/stats");

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'data' => [
                'total' => 2,
                'active' => 1,
                'reserve' => 1,
                'withdrawn' => 0,
            ],
        ]);
    }
}
```

### Test Coverage Goals

| Layer | Target Coverage | Priority |
|-------|----------------|----------|
| Domain Entities | 100% | Critical |
| Value Objects | 100% | Critical |
| Application Services | 90%+ | High |
| Repositories | 80%+ | Medium |
| Controllers | 80%+ | Medium |

### Running Tests

```bash
# All tests
composer test

# Unit tests only
composer test tests/Unit/Domain/Competition/

# Feature tests only
composer test tests/Feature/User/Season

# With coverage
composer test --coverage

# Specific test
composer test tests/Unit/Domain/Competition/Entities/SeasonTest.php
```

---

## Implementation Roadmap

### Phase 1: Domain Layer (Week 1)

**Tasks**:
1. ✅ Create value objects
   - `SeasonName`
   - `SeasonSlug`
   - `SeasonStatus` (enum)
   - `SeasonDriverStatus` (enum)
2. ✅ Create domain exceptions
   - All 7 exception classes
3. ✅ Create repository interfaces
   - `SeasonRepositoryInterface`
   - `SeasonDriverRepositoryInterface`
4. ✅ Create domain entities
   - `Season` entity with all business logic
   - `SeasonDriver` entity
5. ✅ Create domain events
   - All 7 event classes
6. ✅ Write unit tests for domain layer (100% coverage)

**Deliverables**:
- Fully tested, pure PHP domain layer
- No Laravel dependencies in domain
- All business rules enforced

### Phase 2: Application Layer (Week 2)

**Tasks**:
1. ✅ Create DTOs
   - `CreateSeasonData`, `UpdateSeasonData`, `SeasonData`
   - `AddSeasonDriverData`, `UpdateSeasonDriverData`, `SeasonDriverData`
2. ✅ Create application services
   - `SeasonApplicationService` (all methods)
   - `SeasonDriverApplicationService` (all methods)
3. ✅ Write unit tests for application services
4. ✅ Register services in service provider

**Deliverables**:
- Tested application services
- Complete DTO layer with validation
- Transaction management

### Phase 3: Infrastructure Layer (Week 2-3)

**Tasks**:
1. ✅ Create database migrations
   - `create_seasons_table`
   - `create_season_drivers_table`
2. ✅ Create Eloquent models
   - `SeasonEloquent`
   - `SeasonDriverEloquent`
3. ✅ Create repository implementations
   - `EloquentSeasonRepository`
   - `EloquentSeasonDriverRepository`
4. ✅ Create factories for testing
   - `SeasonFactory`
   - `SeasonDriverFactory`
5. ✅ Register repositories in service provider
6. ✅ Write repository tests

**Deliverables**:
- Working database layer
- Entity-Eloquent mapping
- Repository implementations bound to interfaces

### Phase 4: Interface Layer (Week 3)

**Tasks**:
1. ✅ Create controllers
   - `SeasonController` (thin, 3-5 lines per method)
   - `SeasonDriverController`
2. ✅ Define routes in `routes/api.php`
3. ✅ Create middleware/policies for authorization
4. ✅ Write feature tests for all endpoints
5. ✅ Test API with Postman/Insomnia

**Deliverables**:
- RESTful API endpoints
- Complete feature test coverage
- API documentation

### Phase 5: Integration & Testing (Week 4)

**Tasks**:
1. ✅ Run full test suite
2. ✅ PHPStan level 8 analysis
3. ✅ PHPCS code style check
4. ✅ Integration testing with frontend
5. ✅ Performance testing (query optimization)
6. ✅ Fix any bugs or issues

**Deliverables**:
- All tests passing (100% domain, 90%+ overall)
- PHPStan level 8 compliance
- PSR-12 code style
- Performance benchmarks

### Phase 6: Documentation & Deployment (Week 4)

**Tasks**:
1. ✅ API documentation (OpenAPI/Swagger)
2. ✅ Developer guide for extending
3. ✅ Database seeder for demo data
4. ✅ Production deployment checklist
5. ✅ Monitor logs and performance

**Deliverables**:
- Complete documentation
- Production-ready code
- Monitoring setup

---

## Future Enhancements

### Post-MVP Features (Not in Initial Implementation)

#### 1. Divisions

**Scope**: Skill-based driver groupings within a season

**Database**:
```sql
CREATE TABLE divisions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  season_id BIGINT UNSIGNED,
  name VARCHAR(100),
  short_name VARCHAR(10),
  description TEXT,
  color VARCHAR(7),
  display_order INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  UNIQUE (season_id, name)
);

ALTER TABLE season_drivers
  ADD COLUMN division_id BIGINT UNSIGNED NULL AFTER league_driver_id,
  ADD FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL;
```

**Domain**:
- `Division` entity
- `DivisionName` value object
- `SeasonDriver::assignToDivision()` method

#### 2. Teams

**Scope**: Team championship structure

**Database**:
```sql
CREATE TABLE teams (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  season_id BIGINT UNSIGNED,
  name VARCHAR(100),
  abbreviation VARCHAR(10),
  color VARCHAR(7),
  logo_path VARCHAR(255),
  division_id BIGINT UNSIGNED NULL,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL
);

ALTER TABLE season_drivers
  ADD COLUMN team_id BIGINT UNSIGNED NULL AFTER division_id,
  ADD FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
```

**Domain**:
- `Team` entity
- `TeamName` value object
- `SeasonDriver::assignToTeam()` method

#### 3. Rounds

**Scope**: Race calendar and event management

**Database**:
```sql
CREATE TABLE rounds (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  season_id BIGINT UNSIGNED,
  round_number INT,
  name VARCHAR(150),
  slug VARCHAR(200),
  track_id BIGINT UNSIGNED NULL,
  date DATE,
  time TIME,
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  UNIQUE (season_id, round_number)
);
```

**Domain**:
- `Round` entity
- `RoundNumber` value object
- Complex scheduling logic

#### 4. CSV Import

**Scope**: Bulk driver import from CSV files

**Features**:
- Parse CSV with driver data
- Match existing drivers by platform IDs
- Create new drivers if no match
- Preview before import
- Error handling and reporting

**Implementation**:
- `SeasonDriverImportService`
- `DriverMatchingService`
- CSV validation and parsing
- Transaction rollback on errors

#### 5. Bulk Operations

**Scope**: Bulk driver management

**Features**:
- Bulk status changes
- Bulk division assignment
- Bulk team assignment
- Bulk notes update

**Implementation**:
- `bulkUpdateStatus()` in `SeasonDriverApplicationService`
- `bulkAssignToDivision()`
- Transaction-based for consistency

#### 6. Season Templates

**Scope**: Clone season structure

**Features**:
- Clone season settings
- Clone divisions
- Clone teams
- Option to clone drivers
- Customizable template fields

**Implementation**:
- `SeasonTemplateService`
- Deep cloning with entity factories
- Validation for target competition

#### 7. Advanced Reporting

**Scope**: Season analytics and insights

**Features**:
- Driver participation statistics
- Division balance analysis
- Team distribution reports
- Historical season comparison

**Implementation**:
- Read model services
- Aggregated queries
- Caching for performance
- Export to CSV/PDF

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| **Season** | Time-bound championship period within a competition |
| **League Driver** | Driver associated with a league (via `league_drivers` table) |
| **Season Driver** | League driver added to a specific season (via `season_drivers` table) |
| **Slug** | URL-friendly identifier (e.g., "winter-2025-championship") |
| **Team Championship** | Scoring system where driver points contribute to team standings |
| **Status** | Current state of season (setup, active, completed, archived) |
| **Soft Delete** | Mark as deleted without removing from database |
| **Aggregate Root** | Entity that controls access to related entities |
| **Value Object** | Immutable object defined by its value, not identity |
| **DTO** | Data Transfer Object for application layer communication |

### Acronyms

| Acronym | Meaning |
|---------|---------|
| **DDD** | Domain-Driven Design |
| **MVP** | Minimum Viable Product |
| **CRUD** | Create, Read, Update, Delete |
| **DTO** | Data Transfer Object |
| **API** | Application Programming Interface |
| **HTTP** | Hypertext Transfer Protocol |
| **JSON** | JavaScript Object Notation |
| **SQL** | Structured Query Language |
| **PSR** | PHP Standard Recommendation |

### References

- [Laravel 12 Documentation](https://laravel.com/docs/12.x)
- [Spatie Laravel Data](https://spatie.be/docs/laravel-data)
- [DDD Overview Guide](./.claude/guides/backend/ddd-overview.md)
- [User Backend Guide](./.claude/guides/backend/user-backend-guide.md)
- [Season Creation Feature Doc](./05_season_creation.md)

---

**Document Status**: ✅ Complete and ready for implementation

**Next Steps**:
1. Review and approve architecture
2. Begin Phase 1: Domain Layer implementation
3. Set up project tracking (GitHub Issues/JIRA)
4. Assign team members to tasks

**Questions or Concerns**: Contact the backend development team

---

**End of Season Creation MVP Backend Architecture Plan v1.0**

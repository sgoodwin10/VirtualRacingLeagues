# Competition Creation - Backend Implementation Tasks

**Version**: 2.0
**Estimated Time**: 4 days
**Architecture**: Domain-Driven Design (DDD)

---

## 📋 Overview

This document provides step-by-step tasks for implementing the Competition backend following DDD principles. Tasks are organized by layer and include acceptance criteria for each item.

---

## Day 1: Domain Layer (Pure PHP - No Database)

**Goal**: Build the core business logic with 100% test coverage

### Phase 1.1: Value Objects (2 hours)

#### Task 1.1.1: CompetitionName Value Object
**File**: `app/Domain/Competition/ValueObjects/CompetitionName.php`

**Requirements**:
- Min: 3 characters
- Max: 100 characters
- Allowed: Letters, numbers, spaces, hyphens, apostrophes
- Auto-trim whitespace

**Code Template**:
```php
<?php

namespace App\Domain\Competition\ValueObjects;

use App\Domain\Competition\Exceptions\InvalidCompetitionNameException;

final readonly class CompetitionName
{
    private function __construct(
        private string $value
    ) {}

    public static function from(string $value): self
    {
        $trimmed = trim($value);

        if (strlen($trimmed) < 3) {
            throw InvalidCompetitionNameException::tooShort($value);
        }

        if (strlen($trimmed) > 100) {
            throw InvalidCompetitionNameException::tooLong($value);
        }

        if (!preg_match('/^[a-zA-Z0-9\s\-\']+$/', $trimmed)) {
            throw InvalidCompetitionNameException::invalidCharacters($value);
        }

        return new self($trimmed);
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(CompetitionName $other): bool
    {
        return $this->value === $other->value;
    }
}
```

**Test File**: `tests/Unit/Domain/Competition/ValueObjects/CompetitionNameTest.php`

**Test Cases**:
- ✅ Valid name accepted
- ✅ Trims whitespace
- ✅ Rejects < 3 chars
- ✅ Rejects > 100 chars
- ✅ Rejects invalid characters
- ✅ Equals comparison works

---

#### Task 1.1.2: CompetitionSlug Value Object
**File**: `app/Domain/Competition/ValueObjects/CompetitionSlug.php`

**Requirements**:
- Generate from name: lowercase, hyphens for spaces
- Remove special characters
- Handle multiple consecutive spaces

**Code Template**:
```php
<?php

namespace App\Domain\Competition\ValueObjects;

use Illuminate\Support\Str;

final readonly class CompetitionSlug
{
    private function __construct(
        private string $value
    ) {}

    public static function fromName(string $name): self
    {
        $slug = Str::slug($name);
        return new self($slug);
    }

    public static function from(string $value): self
    {
        return new self($value);
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(CompetitionSlug $other): bool
    {
        return $this->value === $other->value;
    }
}
```

**Test File**: `tests/Unit/Domain/Competition/ValueObjects/CompetitionSlugTest.php`

**Test Cases**:
- ✅ Generates from name correctly
- ✅ Converts to lowercase
- ✅ Replaces spaces with hyphens
- ✅ Removes special characters
- ✅ Handles multiple spaces

---

#### Task 1.1.3: CompetitionStatus Enum
**File**: `app/Domain/Competition/ValueObjects/CompetitionStatus.php`

**Requirements**:
- Values: active, archived
- Type-safe enum (PHP 8.1+)

**Code Template**:
```php
<?php

namespace App\Domain\Competition\ValueObjects;

enum CompetitionStatus: string
{
    case ACTIVE = 'active';
    case ARCHIVED = 'archived';

    public function isActive(): bool
    {
        return $this === self::ACTIVE;
    }

    public function isArchived(): bool
    {
        return $this === self::ARCHIVED;
    }

    public static function fromString(string $status): self
    {
        return match (strtolower($status)) {
            'active' => self::ACTIVE,
            'archived' => self::ARCHIVED,
            default => throw new \InvalidArgumentException("Invalid status: {$status}"),
        };
    }
}
```

**Test File**: `tests/Unit/Domain/Competition/ValueObjects/CompetitionStatusTest.php`

**Test Cases**:
- ✅ Active status works
- ✅ Archived status works
- ✅ isActive() returns correct value
- ✅ isArchived() returns correct value
- ✅ fromString() converts correctly
- ✅ Invalid string throws exception

---

### Phase 1.2: Domain Exceptions (1 hour)

Create 6 exception classes in `app/Domain/Competition/Exceptions/`:

#### Task 1.2.1: CompetitionNotFoundException
```php
<?php

namespace App\Domain\Competition\Exceptions;

class CompetitionNotFoundException extends \DomainException
{
    public static function withId(int $id): self
    {
        return new self("Competition with ID {$id} not found");
    }

    public static function withSlug(string $slug, int $leagueId): self
    {
        return new self("Competition with slug '{$slug}' not found in league {$leagueId}");
    }
}
```

#### Task 1.2.2: InvalidCompetitionNameException
```php
public static function tooShort(string $name): self
public static function tooLong(string $name): self
public static function invalidCharacters(string $name): self
```

#### Task 1.2.3: CompetitionAlreadyExistsException
```php
public static function withName(string $name, int $leagueId): self
public static function withSlug(string $slug, int $leagueId): self
```

#### Task 1.2.4: CompetitionPlatformImmutableException
```php
// Single exception: "Competition platform cannot be changed after creation"
```

#### Task 1.2.5: CompetitionAlreadyArchivedException
```php
// "Competition is already archived"
```

#### Task 1.2.6: CompetitionIsArchivedException
```php
// "Cannot update archived competition. Archive status must be changed first."
```

**Acceptance Criteria**:
- ✅ All exceptions extend `\DomainException`
- ✅ Static factory methods for common cases
- ✅ Clear, descriptive messages

---

### Phase 1.3: Domain Events (1 hour)

Create 4 event classes in `app/Domain/Competition/Events/`:

#### Task 1.3.1: CompetitionCreated
```php
<?php

namespace App\Domain\Competition\Events;

final readonly class CompetitionCreated
{
    public function __construct(
        public int $competitionId,
        public int $leagueId,
        public string $name,
        public int $platformId,
        public int $createdByUserId,
        public string $occurredAt,
    ) {}
}
```

#### Task 1.3.2: CompetitionUpdated
```php
public array $changes; // ['name' => ['old' => 'X', 'new' => 'Y']]
```

#### Task 1.3.3: CompetitionArchived
```php
public int $competitionId;
public int $leagueId;
public string $occurredAt;
```

#### Task 1.3.4: CompetitionDeleted
```php
public int $competitionId;
public int $leagueId;
public string $occurredAt;
```

**Acceptance Criteria**:
- ✅ All events are `readonly`
- ✅ All events are `final`
- ✅ Include `occurredAt` timestamp
- ✅ Contain relevant context data

---

### Phase 1.4: Repository Interface (30 minutes)

#### Task 1.4.1: CompetitionRepositoryInterface
**File**: `app/Domain/Competition/Repositories/CompetitionRepositoryInterface.php`

**Required Methods**:
```php
<?php

namespace App\Domain\Competition\Repositories;

use App\Domain\Competition\Entities\Competition;

interface CompetitionRepositoryInterface
{
    // Persistence
    public function save(Competition $competition): void;
    public function update(Competition $competition): void;
    public function delete(Competition $competition): void;

    // Retrieval
    public function findById(int $id): Competition;
    public function findBySlug(string $slug, int $leagueId): Competition;
    public function findByLeagueId(int $leagueId): array; // Competition[]

    // Queries
    public function existsBySlug(string $slug, int $leagueId, ?int $excludeId = null): bool;
    public function isSlugAvailable(string $slug, int $leagueId, ?int $excludeId = null): bool;
    public function countByLeagueId(int $leagueId): int;
    public function countActiveByLeagueId(int $leagueId): int;
}
```

**Acceptance Criteria**:
- ✅ Interface only (no implementation)
- ✅ Type hints for all parameters
- ✅ PHPDoc for array returns
- ✅ No Laravel dependencies

---

### Phase 1.5: Competition Entity (3 hours)

#### Task 1.5.1: Competition Entity
**File**: `app/Domain/Competition/Entities/Competition.php`

**Properties**:
```php
private ?int $id;
private int $leagueId;
private CompetitionName $name;
private CompetitionSlug $slug;
private ?string $description;
private int $platformId; // IMMUTABLE after creation
private ?string $logoPath;
private CompetitionStatus $status;
private int $createdByUserId;
private \DateTimeImmutable $createdAt;
private \DateTimeImmutable $updatedAt;
private ?\DateTimeImmutable $deletedAt;
private ?\DateTimeImmutable $archivedAt;
private array $domainEvents = [];
```

**Factory Methods**:
```php
public static function create(
    int $leagueId,
    CompetitionName $name,
    CompetitionSlug $slug,
    int $platformId,
    int $createdByUserId,
    ?string $description = null,
    ?string $logoPath = null,
): self

public static function reconstitute(
    int $id,
    int $leagueId,
    CompetitionName $name,
    CompetitionSlug $slug,
    int $platformId,
    CompetitionStatus $status,
    int $createdByUserId,
    ?string $description,
    ?string $logoPath,
    \DateTimeImmutable $createdAt,
    \DateTimeImmutable $updatedAt,
    ?\DateTimeImmutable $deletedAt,
    ?\DateTimeImmutable $archivedAt,
): self
```

**Business Logic Methods**:
```php
// Updates
public function updateDetails(CompetitionName $name, ?string $description): void
public function updateLogo(?string $logoPath): void
public function updateSlug(CompetitionSlug $slug): void

// Status changes
public function archive(): void
public function restore(): void
public function delete(): void

// Status checks
public function isActive(): bool
public function isArchived(): bool
public function isDeleted(): bool

// Event management
public function recordCreationEvent(): void
private function recordEvent(object $event): void
public function releaseEvents(): array
public function clearEvents(): void

// Getters (no setters for platform!)
public function id(): ?int
public function leagueId(): int
public function name(): CompetitionName
public function slug(): CompetitionSlug
public function description(): ?string
public function platformId(): int // NO setPlatform() method!
public function logoPath(): ?string
public function status(): CompetitionStatus
public function createdByUserId(): int
public function createdAt(): \DateTimeImmutable
public function updatedAt(): \DateTimeImmutable
public function deletedAt(): ?\DateTimeImmutable
public function archivedAt(): ?\DateTimeImmutable
```

**Key Business Rules** (enforce in methods):
1. Platform ID cannot be changed after creation (no setter)
2. Cannot archive already archived competition
3. Cannot update archived competition (throw exception)
4. Cannot delete already deleted competition
5. Updating name also updates slug
6. Archive sets status and archived timestamp
7. Delete sets deleted timestamp

**Test File**: `tests/Unit/Domain/Competition/Entities/CompetitionTest.php`

**Test Cases**:
- ✅ Can create competition
- ✅ Cannot create with invalid name
- ✅ Can update details (name + description)
- ✅ Updating name generates new slug event
- ✅ Can update logo
- ✅ Can archive competition
- ✅ Cannot archive already archived
- ✅ Cannot update archived competition
- ✅ Can delete competition
- ✅ Cannot delete already deleted
- ✅ Platform ID is immutable (no setter exists)
- ✅ Records creation event after ID set
- ✅ Records update event when details change
- ✅ Records archive event
- ✅ Records delete event
- ✅ isActive() works correctly
- ✅ isArchived() works correctly
- ✅ isDeleted() works correctly
- ✅ releaseEvents() returns and clears events

**Day 1 Checkpoint**:
- ✅ Run: `composer test tests/Unit/Domain/Competition/`
- ✅ Target: 100% code coverage
- ✅ All tests green

---

## Day 2: Application Layer (Use Cases)

**Goal**: Implement use case orchestration with DTOs

### Phase 2.1: Data Transfer Objects (3 hours)

#### Task 2.1.1: CreateCompetitionData (Input DTO)
**File**: `app/Application/Competition/DTOs/CreateCompetitionData.php`

**Use**: `spatie/laravel-data`

```php
<?php

namespace App\Application\Competition\DTOs;

use Illuminate\Http\UploadedFile;
use Spatie\LaravelData\Data;

class CreateCompetitionData extends Data
{
    public function __construct(
        public string $name,
        public int $platform_id,
        public int $league_id,
        public ?string $description = null,
        public ?UploadedFile $logo = null,
    ) {}

    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'platform_id' => ['required', 'integer', 'exists:platforms,id'],
            'league_id' => ['required', 'integer', 'exists:leagues,id'],
            'description' => ['nullable', 'string', 'max:1000'],
            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg', 'max:2048'],
        ];
    }
}
```

#### Task 2.1.2: UpdateCompetitionData (Input DTO)
```php
public function __construct(
    public ?string $name = null,
    public ?string $description = null,
    public ?UploadedFile $logo = null,
) {}

// Note: NO platform_id (immutable)
```

#### Task 2.1.3: CompetitionData (Output DTO)
```php
public function __construct(
    public int $id,
    public int $league_id,
    public string $name,
    public string $slug,
    public ?string $description,
    public int $platform_id,
    public string $platform_name,
    public string $platform_slug,
    public string $logo_url, // Resolved with fallback logic
    public string $status,
    public bool $is_active,
    public bool $is_archived,
    public bool $is_deleted,
    public ?string $archived_at,
    public string $created_at,
    public string $updated_at,
    public ?string $deleted_at,
    public int $created_by_user_id,
    public CompetitionStatsData $stats, // Nested DTO
) {}

public static function fromEntity(
    Competition $competition,
    array $platformData,
    string $logoUrl,
    array $aggregates = []
): self
```

#### Task 2.1.4: CompetitionStatsData (Nested DTO)
```php
public function __construct(
    public int $total_seasons = 0,
    public int $active_seasons = 0,
    public int $total_drivers = 0,
    public int $total_races = 0,
    public ?string $next_race_date = null,
) {}
```

#### Task 2.1.5: CompetitionListData (Lightweight)
```php
// Subset of CompetitionData for list views
// Excludes: description, detailed stats
```

**Acceptance Criteria**:
- ✅ All DTOs use Spatie Laravel Data
- ✅ Input DTOs have validation rules
- ✅ Output DTOs have fromEntity() factory
- ✅ Type hints for all properties
- ✅ PHPDoc where needed

---

### Phase 2.2: Application Service (4 hours)

#### Task 2.2.1: CompetitionApplicationService
**File**: `app/Application/Competition/Services/CompetitionApplicationService.php`

**Dependencies** (constructor injection):
```php
public function __construct(
    private CompetitionRepositoryInterface $competitionRepository,
    private LeagueRepositoryInterface $leagueRepository,
    private PlatformRepositoryInterface $platformRepository,
) {}
```

**Public Methods** (8 total):

##### Method 1: createCompetition
```php
public function createCompetition(
    CreateCompetitionData $data,
    int $userId
): CompetitionData {
    // 1. Validate league exists and user owns it
    // 2. Validate platform exists and is in league's platforms
    // 3. Generate unique slug from name
    // 4. Handle logo upload if provided
    // 5. Create competition entity
    // 6. Save via repository
    // 7. Dispatch CompetitionCreated event
    // 8. Return CompetitionData DTO
}
```

**Steps**:
```php
// Step 1: Authorize
$league = $this->leagueRepository->findById($data->league_id);
if ($league->createdByUserId() !== $userId) {
    throw new UnauthorizedException('Only league owner can create competitions');
}

// Step 2: Validate platform
$this->validatePlatformForLeague($data->platform_id, $league);

// Step 3: Generate unique slug
$baseSlug = CompetitionSlug::fromName($data->name);
$uniqueSlug = $this->generateUniqueSlug($baseSlug, $data->league_id);

// Step 4: Handle logo upload
$logoPath = $data->logo
    ? Storage::disk('public')->store('competitions/logos', $data->logo)
    : null;

// Step 5: Create entity
$competition = Competition::create(
    leagueId: $data->league_id,
    name: CompetitionName::from($data->name),
    slug: $uniqueSlug,
    platformId: $data->platform_id,
    createdByUserId: $userId,
    description: $data->description,
    logoPath: $logoPath,
);

// Step 6: Save (transaction)
DB::transaction(function () use ($competition) {
    $this->competitionRepository->save($competition);
    $competition->recordCreationEvent();
    $this->dispatchEvents($competition);
});

// Step 7: Return DTO
return $this->toCompetitionData($competition);
```

##### Method 2: updateCompetition
```php
public function updateCompetition(
    int $competitionId,
    UpdateCompetitionData $data,
    int $userId
): CompetitionData {
    // 1. Find competition
    // 2. Check not archived
    // 3. Authorize (league owner)
    // 4. Update name (regenerates slug if changed)
    // 5. Update description
    // 6. Update logo (delete old, upload new)
    // 7. Save
    // 8. Return DTO
}
```

##### Method 3: getCompetitionById
```php
public function getCompetitionById(int $id): CompetitionData
```

##### Method 4: getCompetitionBySlug
```php
public function getCompetitionBySlug(string $slug, int $leagueId): CompetitionData
```

##### Method 5: getLeagueCompetitions
```php
public function getLeagueCompetitions(int $leagueId): array // CompetitionData[]
```

##### Method 6: archiveCompetition
```php
public function archiveCompetition(int $id, int $userId): void
```

##### Method 7: deleteCompetition
```php
public function deleteCompetition(int $id, int $userId): void
```

##### Method 8: checkSlugAvailability
```php
public function checkSlugAvailability(
    string $name,
    int $leagueId,
    ?int $excludeId = null
): array {
    // Return: ['available' => bool, 'slug' => string, 'suggestion' => string|null]
}
```

**Private Helper Methods**:
```php
private function generateUniqueSlug(
    CompetitionSlug $baseSlug,
    int $leagueId,
    ?int $excludeId = null
): CompetitionSlug

private function validatePlatformForLeague(int $platformId, League $league): void

private function authorizeLeagueOwner(Competition $competition, int $userId): void

private function dispatchEvents(Competition $competition): void

private function toCompetitionData(Competition $competition): CompetitionData

private function resolveLogoUrl(Competition $competition, League $league): string
```

**Acceptance Criteria**:
- ✅ All methods have proper type hints
- ✅ Use DB transactions for mutations
- ✅ Dispatch domain events
- ✅ Return DTOs (never entities)
- ✅ PHPDoc for complex return types
- ✅ PHPStan Level 8 compliant

---

## Day 3: Infrastructure Layer (Database)

**Goal**: Implement persistence with Eloquent

### Phase 3.1: Database Migration (30 minutes)

#### Task 3.1.1: Create Migration
```bash
php artisan make:migration create_competitions_table
```

**File**: `database/migrations/2025_XX_XX_XXXXXX_create_competitions_table.php`

**Schema** (see 00_SUMMARY.md for full schema)

**Run Migration**:
```bash
php artisan migrate
```

**Verify**:
```bash
php artisan migrate:status
mysql -u laravel -psecret laravel -e "DESCRIBE competitions;"
```

---

### Phase 3.2: Eloquent Model (1 hour)

#### Task 3.2.1: Competition Eloquent Model
**File**: `app/Infrastructure/Persistence/Eloquent/Models/Competition.php`

**Anemic Model** (data container only):
```php
<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Competition extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'league_id',
        'platform_id',
        'created_by_user_id',
        'name',
        'slug',
        'description',
        'logo_path',
        'status',
        'archived_at',
    ];

    protected $casts = [
        'archived_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relationships
    public function league(): BelongsTo
    {
        return $this->belongsTo(League::class);
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    public function scopeForLeague($query, int $leagueId)
    {
        return $query->where('league_id', $leagueId);
    }

    // Accessor
    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo_path
            ? Storage::disk('public')->url($this->logo_path)
            : null;
    }
}
```

**Acceptance Criteria**:
- ✅ No business logic (anemic)
- ✅ Relationships defined
- ✅ Scopes for common queries
- ✅ Proper casts
- ✅ SoftDeletes trait

---

### Phase 3.3: Factory (30 minutes)

#### Task 3.3.1: CompetitionFactory
```bash
php artisan make:factory CompetitionFactory
```

**File**: `database/factories/CompetitionFactory.php`

```php
public function definition(): array
{
    $name = fake()->words(3, true);

    return [
        'league_id' => League::factory(),
        'platform_id' => Platform::inRandomOrder()->first()->id,
        'created_by_user_id' => User::factory(),
        'name' => ucwords($name),
        'slug' => Str::slug($name),
        'description' => fake()->optional(0.7)->paragraph(),
        'logo_path' => fake()->optional(0.5)->imageUrl(500, 500),
        'status' => 'active',
        'archived_at' => null,
    ];
}

public function archived(): static
{
    return $this->state([
        'status' => 'archived',
        'archived_at' => now()->subDays(rand(1, 30)),
    ]);
}

public function forLeague(int $leagueId): static
{
    return $this->state(['league_id' => $leagueId]);
}
```

---

### Phase 3.4: Repository Implementation (3 hours)

#### Task 3.4.1: EloquentCompetitionRepository
**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentCompetitionRepository.php`

**Implement All Interface Methods**:
```php
<?php

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Competition\Entities\Competition;
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Domain\Competition\Exceptions\CompetitionNotFoundException;
use App\Infrastructure\Persistence\Eloquent\Models\Competition as CompetitionModel;

class EloquentCompetitionRepository implements CompetitionRepositoryInterface
{
    public function save(Competition $competition): void
    {
        $data = $this->mapToEloquent($competition);
        $model = CompetitionModel::create($data);

        // Set ID on entity (needed for events)
        $reflection = new \ReflectionClass($competition);
        $idProperty = $reflection->getProperty('id');
        $idProperty->setAccessible(true);
        $idProperty->setValue($competition, $model->id);
    }

    public function update(Competition $competition): void
    {
        $data = $this->mapToEloquent($competition);
        CompetitionModel::where('id', $competition->id())->update($data);
    }

    public function delete(Competition $competition): void
    {
        CompetitionModel::where('id', $competition->id())->delete();
    }

    public function findById(int $id): Competition
    {
        $model = CompetitionModel::withTrashed()->find($id);

        if (!$model) {
            throw CompetitionNotFoundException::withId($id);
        }

        return $this->mapToEntity($model);
    }

    public function findBySlug(string $slug, int $leagueId): Competition
    {
        $model = CompetitionModel::where('slug', $slug)
            ->where('league_id', $leagueId)
            ->first();

        if (!$model) {
            throw CompetitionNotFoundException::withSlug($slug, $leagueId);
        }

        return $this->mapToEntity($model);
    }

    public function findByLeagueId(int $leagueId): array
    {
        return CompetitionModel::where('league_id', $leagueId)
            ->get()
            ->map(fn($model) => $this->mapToEntity($model))
            ->all();
    }

    public function existsBySlug(string $slug, int $leagueId, ?int $excludeId = null): bool
    {
        $query = CompetitionModel::where('slug', $slug)
            ->where('league_id', $leagueId);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    public function isSlugAvailable(string $slug, int $leagueId, ?int $excludeId = null): bool
    {
        return !$this->existsBySlug($slug, $leagueId, $excludeId);
    }

    public function countByLeagueId(int $leagueId): int
    {
        return CompetitionModel::where('league_id', $leagueId)->count();
    }

    public function countActiveByLeagueId(int $leagueId): int
    {
        return CompetitionModel::where('league_id', $leagueId)
            ->where('status', 'active')
            ->count();
    }

    private function mapToEntity(CompetitionModel $model): Competition
    {
        return Competition::reconstitute(
            id: $model->id,
            leagueId: $model->league_id,
            name: CompetitionName::from($model->name),
            slug: CompetitionSlug::from($model->slug),
            platformId: $model->platform_id,
            status: CompetitionStatus::fromString($model->status),
            createdByUserId: $model->created_by_user_id,
            description: $model->description,
            logoPath: $model->logo_path,
            createdAt: new \DateTimeImmutable($model->created_at),
            updatedAt: new \DateTimeImmutable($model->updated_at),
            deletedAt: $model->deleted_at ? new \DateTimeImmutable($model->deleted_at) : null,
            archivedAt: $model->archived_at ? new \DateTimeImmutable($model->archived_at) : null,
        );
    }

    private function mapToEloquent(Competition $competition): array
    {
        return [
            'league_id' => $competition->leagueId(),
            'platform_id' => $competition->platformId(),
            'created_by_user_id' => $competition->createdByUserId(),
            'name' => $competition->name()->value(),
            'slug' => $competition->slug()->value(),
            'description' => $competition->description(),
            'logo_path' => $competition->logoPath(),
            'status' => $competition->status()->value,
            'archived_at' => $competition->archivedAt()?->format('Y-m-d H:i:s'),
        ];
    }
}
```

**Integration Test**: `tests/Integration/Persistence/Eloquent/Repositories/EloquentCompetitionRepositoryTest.php`

**Test Cases**:
- ✅ Can save competition (sets ID)
- ✅ Can find by ID
- ✅ Can find by slug and league
- ✅ Can update competition
- ✅ Can delete competition
- ✅ Throws exception when not found
- ✅ existsBySlug works correctly
- ✅ isSlugAvailable works correctly
- ✅ Excludes own ID in slug checks
- ✅ countByLeagueId works
- ✅ countActiveByLeagueId works
- ✅ Maps to entity correctly
- ✅ Maps to eloquent correctly

---

### Phase 3.5: Service Provider Binding (15 minutes)

#### Task 3.5.1: Bind Repository
**File**: `app/Providers/RepositoryServiceProvider.php`

```php
use App\Domain\Competition\Repositories\CompetitionRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentCompetitionRepository;

public function register(): void
{
    // ... existing bindings

    $this->app->bind(
        CompetitionRepositoryInterface::class,
        EloquentCompetitionRepository::class
    );
}
```

**Verify**:
```bash
php artisan tinker
>>> app(App\Domain\Competition\Repositories\CompetitionRepositoryInterface::class)
```

---

## Day 4: Interface Layer + QA

**Goal**: HTTP layer and complete testing

### Phase 4.1: Controller (2 hours)

#### Task 4.1.1: CompetitionController
```bash
php artisan make:controller User/CompetitionController
```

**File**: `app/Http/Controllers/User/CompetitionController.php`

**Thin Controller Pattern** (3-5 lines per method):

```php
<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Application\Competition\Services\CompetitionApplicationService;
use App\Application\Competition\DTOs\CreateCompetitionData;
use App\Application\Competition\DTOs\UpdateCompetitionData;
use App\Helpers\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CompetitionController extends Controller
{
    public function __construct(
        private CompetitionApplicationService $competitionService
    ) {}

    public function index(int $leagueId): JsonResponse
    {
        $competitions = $this->competitionService->getLeagueCompetitions($leagueId);
        return ApiResponse::success($competitions);
    }

    public function store(Request $request, int $leagueId): JsonResponse
    {
        $validated = $request->validate(CreateCompetitionData::rules());
        $validated['league_id'] = $leagueId;

        $data = CreateCompetitionData::from($validated);
        $competition = $this->competitionService->createCompetition($data, Auth::id());

        return ApiResponse::created($competition->toArray(), 'Competition created successfully');
    }

    public function show(int $id): JsonResponse
    {
        $competition = $this->competitionService->getCompetitionById($id);
        return ApiResponse::success($competition->toArray());
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate(UpdateCompetitionData::rules());

        $data = UpdateCompetitionData::from($validated);
        $competition = $this->competitionService->updateCompetition($id, $data, Auth::id());

        return ApiResponse::success($competition->toArray(), 'Competition updated successfully');
    }

    public function destroy(int $id): JsonResponse
    {
        $this->competitionService->deleteCompetition($id, Auth::id());
        return ApiResponse::success(null, 'Competition deleted successfully');
    }

    public function archive(int $id): JsonResponse
    {
        $this->competitionService->archiveCompetition($id, Auth::id());
        return ApiResponse::success(null, 'Competition archived successfully');
    }

    public function checkSlug(Request $request, int $leagueId): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3|max:100',
            'exclude_id' => 'nullable|integer',
        ]);

        $result = $this->competitionService->checkSlugAvailability(
            $validated['name'],
            $leagueId,
            $validated['exclude_id'] ?? null
        );

        return ApiResponse::success($result);
    }
}
```

---

### Phase 4.2: Routes (30 minutes)

#### Task 4.2.1: Add Routes
**File**: `routes/subdomain.php`

**Add to User Dashboard section**:
```php
// User Dashboard (app.virtualracingleagues.localhost)
Route::domain('app.virtualracingleagues.localhost')->group(function () {
    Route::prefix('api')
        ->middleware(['auth:web', 'user.authenticate'])
        ->group(function () {

            // ... existing routes

            // Competition routes
            Route::prefix('leagues/{leagueId}')->group(function () {
                Route::get('/competitions', [CompetitionController::class, 'index']);
                Route::post('/competitions', [CompetitionController::class, 'store']);
                Route::post('/competitions/check-slug', [CompetitionController::class, 'checkSlug']);
            });

            Route::prefix('competitions')->group(function () {
                Route::get('/{id}', [CompetitionController::class, 'show']);
                Route::put('/{id}', [CompetitionController::class, 'update']);
                Route::delete('/{id}', [CompetitionController::class, 'destroy']);
                Route::post('/{id}/archive', [CompetitionController::class, 'archive']);
            });
        });
});
```

**Verify Routes**:
```bash
php artisan route:list --path=competitions
```

---

### Phase 4.3: Feature Tests (3 hours)

#### Task 4.3.1: CompetitionControllerTest
**File**: `tests/Feature/Http/Controllers/User/CompetitionControllerTest.php`

**Test Structure**:
```php
<?php

namespace Tests\Feature\Http\Controllers\User;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\League;
use App\Infrastructure\Persistence\Eloquent\Models\Platform;
use App\Infrastructure\Persistence\Eloquent\Models\Competition;

class CompetitionControllerTest extends TestCase
{
    use RefreshDatabase;

    // Test data setup
    private User $user;
    private League $league;
    private Platform $platform;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->league = League::factory()->create(['created_by_user_id' => $this->user->id]);
        $this->platform = Platform::factory()->create();
    }

    /** @test */
    public function guest_cannot_list_competitions(): void
    {
        $response = $this->getJson("/api/leagues/{$this->league->id}/competitions");
        $response->assertStatus(401);
    }

    /** @test */
    public function user_can_list_own_league_competitions(): void
    {
        $this->actingAs($this->user, 'web');

        $competition = Competition::factory()->create([
            'league_id' => $this->league->id,
            'platform_id' => $this->platform->id,
        ]);

        $response = $this->getJson("/api/leagues/{$this->league->id}/competitions");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['name' => $competition->name]);
    }

    /** @test */
    public function user_can_create_competition(): void
    {
        $this->actingAs($this->user, 'web');

        $data = [
            'name' => 'GT3 Championship',
            'platform_id' => $this->platform->id,
            'description' => 'Weekly GT3 racing',
        ];

        $response = $this->postJson("/api/leagues/{$this->league->id}/competitions", $data);

        $response->assertStatus(201)
            ->assertJsonFragment(['name' => 'GT3 Championship'])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'slug',
                    'platform_id',
                    'logo_url',
                    'status',
                    'stats',
                ]
            ]);

        $this->assertDatabaseHas('competitions', [
            'name' => 'GT3 Championship',
            'league_id' => $this->league->id,
        ]);
    }

    // ... 20+ more test methods (see original plan for full list)
}
```

**Required Test Cases** (30+ tests):
- ✅ Authentication tests
- ✅ Authorization tests (owner only)
- ✅ CRUD operations
- ✅ Validation tests
- ✅ Platform immutability
- ✅ Slug generation
- ✅ Archive functionality
- ✅ Logo upload
- ✅ Error responses

---

### Phase 4.4: Quality Assurance (2 hours)

#### Task 4.4.1: Run All Tests
```bash
composer test
```

#### Task 4.4.2: PHPStan (Level 8)
```bash
composer phpstan
```

#### Task 4.4.3: Code Style (PSR-12)
```bash
composer phpcs
composer phpcbf # auto-fix
```

#### Task 4.4.4: Manual API Testing
Test all 8 endpoints with Postman/Insomnia:
- ✅ GET /leagues/{id}/competitions
- ✅ POST /leagues/{id}/competitions
- ✅ POST /leagues/{id}/competitions/check-slug
- ✅ GET /competitions/{id}
- ✅ PUT /competitions/{id}
- ✅ DELETE /competitions/{id}
- ✅ POST /competitions/{id}/archive

---

## Backend Complete Checklist

### Domain Layer
- ✅ CompetitionName value object
- ✅ CompetitionSlug value object
- ✅ CompetitionStatus enum
- ✅ 6 domain exceptions
- ✅ 4 domain events
- ✅ Competition entity
- ✅ Repository interface
- ✅ 100% unit test coverage

### Application Layer
- ✅ 4 DTOs (Create, Update, Output, Stats)
- ✅ Application service (8 methods)
- ✅ Logo fallback logic
- ✅ Slug uniqueness logic
- ✅ Platform validation
- ✅ Authorization checks

### Infrastructure Layer
- ✅ Database migration
- ✅ Eloquent model (anemic)
- ✅ Factory
- ✅ Repository implementation
- ✅ Service provider binding
- ✅ Integration tests pass

### Interface Layer
- ✅ Controller (8 methods, thin)
- ✅ Routes registered
- ✅ Feature tests pass (30+ tests)

### Quality Assurance
- ✅ PHPStan Level 8 passes
- ✅ PSR-12 compliant
- ✅ All tests green
- ✅ Manual API testing complete

---

## Troubleshooting

### Common Issues

**Issue**: PHPStan errors about missing type hints
**Solution**: Add PHPDoc comments for array returns
```php
/** @return array<CompetitionData> */
public function getLeagueCompetitions(int $leagueId): array
```

**Issue**: Slug conflicts in tests
**Solution**: Use unique names in factories or reset database between tests

**Issue**: Image upload fails in tests
**Solution**: Use `UploadedFile::fake()->image('logo.png')` in tests

**Issue**: Repository binding not working
**Solution**: Clear config cache: `php artisan config:clear`

---

## Next Steps

Backend complete! Move to **02_FRONTEND_TASKS.md** for frontend implementation.

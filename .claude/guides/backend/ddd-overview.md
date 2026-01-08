# DDD Backend Architecture Overview

**Version**: 4.0
**Last Updated**: January 2025
**Purpose**: Core DDD architecture principles and patterns for this Laravel backend

---

## Table of Contents

1. [Architecture Layers](#architecture-layers)
2. [Bounded Contexts](#bounded-contexts)
3. [Decision Trees](#decision-trees)
4. [Core Patterns](#core-patterns)
5. [Implementation Examples](#implementation-examples)
6. [Packages & Tools](#packages--tools)
7. [Testing Strategy](#testing-strategy)
8. [Common Commands](#common-commands)
9. [Do's and Don'ts](#dos-and-donts)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Layers

### Four-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Interface Layer                                                    │
│  app/Http/Controllers/{Context}/                                    │
│  - Thin controllers (3-5 lines/method)                              │
│  - Form Requests for validation                                     │
│  - ApiResponse helper for consistent JSON                           │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Application Layer                                                  │
│  app/Application/{Context}/                                         │
│  - Services/ (use case orchestration, transactions)                 │
│  - DTOs/ (Spatie Laravel Data with validation)                      │
│  - Authorization, file handling, event dispatch                     │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Domain Layer (Pure PHP - NO Laravel)                               │
│  app/Domain/{Context}/                                              │
│  - Entities/ (aggregate roots with business logic)                  │
│  - ValueObjects/ (immutable, self-validating)                       │
│  - Events/ (domain events for state changes)                        │
│  - Exceptions/ (domain-specific errors)                             │
│  - Repositories/ (interfaces only)                                  │
│  - Services/ (stateless domain services)                            │
└─────────────────────────────────────────────────────────────────────┘
                                ↑
┌─────────────────────────────────────────────────────────────────────┐
│  Infrastructure Layer                                               │
│  app/Infrastructure/                                                │
│  - Persistence/Eloquent/Models/ (anemic Eloquent models)            │
│  - Persistence/Eloquent/Repositories/ (implements domain interfaces)│
│  - Listeners/ (domain event handlers, activity logging)             │
│  - Cache/, Media/, Services/                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Dependency Rule

**Dependencies point INWARD only**. The domain layer has zero external dependencies.

- ✅ Infrastructure → Domain (implements interfaces)
- ✅ Application → Domain (uses entities, repositories)
- ✅ Interface → Application (calls services)
- ❌ Domain → Infrastructure (NEVER)
- ❌ Domain → Application (NEVER)
- ❌ Domain → Laravel (NEVER - no `use Illuminate\...`)

---

## Bounded Contexts

This application has **10 bounded contexts**, each with complete DDD structure:

### Core Contexts

| Context | Location | Purpose |
|---------|----------|---------|
| **Admin** | `app/Domain/Admin/` | Administrator management with role hierarchy (SuperAdmin, Admin, Moderator) |
| **User** | `app/Domain/User/` | End-user accounts and profiles |
| **League** | `app/Domain/League/` | League creation, management, visibility |
| **Competition** | `app/Domain/Competition/` | Seasons, rounds, races, race results |
| **Division** | `app/Domain/Division/` | Driver divisions within seasons |
| **Driver** | `app/Domain/Driver/` | Driver management and platform ID mappings |
| **Team** | `app/Domain/Team/` | Team management |
| **Platform** | `app/Domain/Platform/` | Racing platforms (iRacing, ACC, etc.) and cars |
| **SiteConfig** | `app/Domain/SiteConfig/` | System-wide configuration settings |
| **Shared** | `app/Domain/Shared/` | Cross-context value objects and exceptions |

### Context Structure

Each bounded context follows this structure:

```
app/Domain/{Context}/
├── Entities/           # Aggregate roots with business logic
├── ValueObjects/       # Immutable domain concepts (including enums)
├── Events/             # Domain events for state changes
├── Exceptions/         # Domain-specific exceptions
├── Repositories/       # Repository interfaces
└── Services/           # Optional: stateless domain services

app/Application/{Context}/
├── Services/           # Application services (use case orchestration)
└── DTOs/               # Input/output data transfer objects

app/Infrastructure/Persistence/Eloquent/
├── Repositories/{Context}/ # Repository implementations
└── Models/{Context}/       # Anemic Eloquent models
```

---

## Decision Trees

### Where Does This Code Go?

```
┌─ Is it a business rule or domain invariant?
│  → Domain Entity method
│  Example: Admin.changeRole() enforces role hierarchy rules
│
├─ Is it a domain concept (validation, constraints)?
│  → Value Object (immutable class) OR Enum (predefined set with behavior)
│  Example: EmailAddress validates format, AdminRole defines hierarchy
│
├─ Is it stateless domain logic across aggregates?
│  → Domain Service
│  Example: PlatformMappingService maps platform IDs to driver fields
│
├─ Is it use case orchestration (multi-step operation)?
│  → Application Service method
│  Example: createDivision() handles auth, transaction, file upload, events
│
├─ Is it data validation for API input?
│  → DTO with validation attributes
│  Example: CreateDivisionData with #[Required, Min(2), Max(60)]
│
├─ Is it database access or querying?
│  → Repository implementation
│  Example: EloquentDivisionRepository.findBySeasonId()
│
├─ Is it HTTP request handling?
│  → Controller (thin, 3-5 lines per method)
│  Example: DivisionController.store() delegates to service
│
├─ Is it data transformation for API output?
│  → DTO::fromEntity() method
│  Example: DivisionData::fromEntity() extracts data from Division entity
│
└─ Is it a side effect of domain events?
   → Infrastructure Event Listener
   Example: LogAdminActivity listens to AdminCreated events
```

### Entity vs Value Object vs Enum

```
┌─ Does it have identity (needs an ID)?
│  → Entity (aggregate root)
│  Examples: User, Admin, League, Division, Season
│
├─ Is it a predefined set of values with behavior?
│  → Enum (PHP 8.1+)
│  Examples: AdminRole (hierarchy), AdminStatus, UserStatus, LeagueVisibility
│
└─ Is it a domain concept without identity?
   → Value Object (readonly class)
   Examples: EmailAddress, FullName, DivisionName, LeagueSlug, Tagline
```

### When to Create Domain Events

```
Create a domain event when:
✓ The action has side effects elsewhere (notifications, logging)
✓ It's a significant state change worth tracking
✓ Other bounded contexts need to react

Examples:
- AdminCreated → Log activity, send welcome email
- AdminRoleChanged → Log activity with old/new role
- DivisionCreated → Log activity
- LeagueUpdated → Update search index
```

---

## Core Patterns

### Pattern 1: Rich Domain Entities

Entities contain business logic, enforce invariants, and record domain events.

```php
// app/Domain/Division/Entities/Division.php
final class Division
{
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private int $seasonId,
        private DivisionName $name,
        private DivisionDescription $description,
        private ?string $logoUrl,
        private int $order,
        private \DateTimeImmutable $createdAt,
        private \DateTimeImmutable $updatedAt,
    ) {}

    // Factory method for creation
    public static function create(
        int $seasonId,
        DivisionName $name,
        DivisionDescription $description,
        ?string $logoUrl,
        int $order,
    ): self {
        return new self(
            id: null,
            seasonId: $seasonId,
            name: $name,
            description: $description,
            logoUrl: $logoUrl,
            order: $order,
            createdAt: new \DateTimeImmutable(),
            updatedAt: new \DateTimeImmutable(),
        );
    }

    // Factory method for reconstituting from persistence
    public static function reconstitute(
        int $id,
        int $seasonId,
        DivisionName $name,
        // ... all fields
    ): self {
        $division = new self(/* ... */);
        $division->id = $id;
        return $division;
    }

    // Business logic with event recording
    public function changeOrder(int $newOrder): void
    {
        $oldOrder = $this->order;
        $this->order = $newOrder;
        $this->updatedAt = new \DateTimeImmutable();
        $this->recordDomainEvent(new DivisionReordered($this, $oldOrder, $newOrder));
    }

    // Domain event management
    public function recordCreationEvent(): void
    {
        $this->recordDomainEvent(new DivisionCreated($this));
    }

    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];
        return $events;
    }

    // ID setter for repository use after persistence
    public function setId(int $id): void
    {
        $this->id = $id;
    }
}
```

### Pattern 2: Immutable Value Objects

Value objects are immutable, self-validating, and have equality based on attributes.

```php
// app/Domain/Division/ValueObjects/DivisionName.php
readonly final class DivisionName
{
    private const int MIN_LENGTH = 2;
    private const int MAX_LENGTH = 60;

    private function __construct(
        private string $value
    ) {
        $length = mb_strlen($value);
        if ($length < self::MIN_LENGTH) {
            throw InvalidDivisionNameException::tooShort(self::MIN_LENGTH);
        }
        if ($length > self::MAX_LENGTH) {
            throw InvalidDivisionNameException::tooLong(self::MAX_LENGTH);
        }
    }

    public static function from(string $value): self
    {
        return new self(trim($value));
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}
```

### Pattern 3: Enum-Based Value Objects

Use PHP 8.1+ enums for predefined sets with behavior.

```php
// app/Domain/Admin/ValueObjects/AdminRole.php
enum AdminRole: string
{
    case SUPER_ADMIN = 'super_admin';
    case ADMIN = 'admin';
    case MODERATOR = 'moderator';

    public function hierarchyLevel(): int
    {
        return match ($this) {
            self::SUPER_ADMIN => 3,
            self::ADMIN => 2,
            self::MODERATOR => 1,
        };
    }

    public function isHigherThan(self $other): bool
    {
        return $this->hierarchyLevel() > $other->hierarchyLevel();
    }

    public function isSuperAdmin(): bool
    {
        return $this === self::SUPER_ADMIN;
    }

    public function canManageRole(self $targetRole): bool
    {
        return $this->hierarchyLevel() > $targetRole->hierarchyLevel();
    }
}
```

### Pattern 4: Application Service Orchestration

Application services orchestrate use cases with transactions, authorization, and event dispatch.

```php
// app/Application/Division/Services/DivisionApplicationService.php
final class DivisionApplicationService
{
    public function __construct(
        private readonly DivisionRepositoryInterface $divisionRepository,
        private readonly SeasonRepositoryInterface $seasonRepository,
    ) {}

    public function createDivision(
        CreateDivisionData $data,
        int $seasonId,
        int $userId
    ): DivisionData {
        // 1. Authorization FIRST (fail fast, outside transaction)
        $season = $this->seasonRepository->findById($seasonId);
        $this->authorizeSeasonOwner($season, $userId);

        // 2. Validate file BEFORE transaction (avoid orphaned files)
        if ($data->logo) {
            $this->validateLogoFile($data->logo);
        }

        // 3. Execute inside transaction
        return DB::transaction(function () use ($data, $seasonId) {
            // Store file INSIDE transaction for rollback
            $logoPath = $data->logo?->store("divisions/season-{$seasonId}", 'public');

            // Create domain entity
            $division = Division::create(
                seasonId: $seasonId,
                name: DivisionName::from($data->name),
                description: DivisionDescription::from($data->description),
                logoUrl: $logoPath,
                order: $this->divisionRepository->getNextOrderForSeason($seasonId),
            );

            // Persist (sets ID on entity)
            $this->divisionRepository->save($division);

            // Record event AFTER ID is set
            $division->recordCreationEvent();

            // Dispatch events AFTER persistence
            $this->dispatchEvents($division);

            // Log activity
            $this->logDivisionCreated($division->id());

            return DivisionData::fromEntity($division);
        });
    }

    private function dispatchEvents(Division $division): void
    {
        foreach ($division->releaseEvents() as $event) {
            event($event);
        }
    }
}
```

### Pattern 5: Repository with Entity Mapping

Repositories implement domain interfaces and map between entities and Eloquent models.

```php
// app/Infrastructure/Persistence/Eloquent/Repositories/EloquentDivisionRepository.php
final class EloquentDivisionRepository implements DivisionRepositoryInterface
{
    public function save(Division $division): void
    {
        if ($division->id() === null) {
            // CREATE
            $eloquentDivision = new DivisionEloquent();
            $this->fillEloquentModel($eloquentDivision, $division);
            $eloquentDivision->save();
            $division->setId($eloquentDivision->id);
        } else {
            // UPDATE with optimistic locking
            $eloquentDivision = DivisionEloquent::findOrFail($division->id());

            // Check for concurrent modification
            if ($division->updatedAt()->format('Y-m-d H:i:s') !==
                $eloquentDivision->updated_at->format('Y-m-d H:i:s')) {
                throw new \RuntimeException('Division has been modified by another process');
            }

            $this->fillEloquentModel($eloquentDivision, $division);
            $eloquentDivision->save();
        }
    }

    public function findById(int $id): Division
    {
        $eloquentDivision = DivisionEloquent::find($id);
        if ($eloquentDivision === null) {
            throw DivisionNotFoundException::withId($id);
        }
        return $this->toDomainEntity($eloquentDivision);
    }

    private function toDomainEntity(DivisionEloquent $model): Division
    {
        return Division::reconstitute(
            id: $model->id,
            seasonId: $model->season_id,
            name: DivisionName::from($model->name),
            description: DivisionDescription::from($model->description),
            logoUrl: $model->logo_url,
            order: $model->order,
            createdAt: $model->created_at->toDateTimeImmutable(),
            updatedAt: $model->updated_at->toDateTimeImmutable(),
        );
    }

    private function fillEloquentModel(DivisionEloquent $model, Division $division): void
    {
        $model->season_id = $division->seasonId();
        $model->name = $division->name()->value();
        $model->description = $division->description()->value();
        $model->logo_url = $division->logoUrl();
        $model->order = $division->order();
    }
}
```

### Pattern 6: Thin Controllers

Controllers are thin (3-5 lines per method), delegating to application services.

```php
// app/Http/Controllers/User/DivisionController.php
final class DivisionController extends Controller
{
    public function __construct(
        private readonly DivisionApplicationService $divisionService
    ) {}

    public function store(CreateDivisionRequest $request, int $seasonId): JsonResponse
    {
        try {
            $data = CreateDivisionData::from($request->validated());
            $divisionData = $this->divisionService->createDivision(
                $data,
                $seasonId,
                $this->getAuthenticatedUserId()
            );
            return ApiResponse::created($divisionData->toArray(), 'Division created successfully');
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    public function destroy(int $seasonId, int $divisionId): JsonResponse
    {
        try {
            $this->divisionService->deleteDivision($divisionId, $this->getAuthenticatedUserId());
            return ApiResponse::success(null, 'Division deleted successfully');
        } catch (DivisionNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (UnauthorizedException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }
}
```

### Pattern 7: DTOs with Spatie Laravel Data

Input DTOs validate data; output DTOs transform entities for API responses.

```php
// app/Application/Division/DTOs/CreateDivisionData.php (Input)
final class CreateDivisionData extends Data
{
    public function __construct(
        #[Required, Min(2), Max(60)]
        public readonly string $name,

        #[Nullable, Sometimes, Min(10), Max(500)]
        public readonly ?string $description = null,

        #[Sometimes, File, Image, Max(2048)]
        public readonly ?UploadedFile $logo = null,
    ) {}
}

// app/Application/Division/DTOs/DivisionData.php (Output)
final class DivisionData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly int $season_id,
        public readonly string $name,
        public readonly ?string $description,
        public readonly ?string $logo_url,
        public readonly int $order,
        public readonly string $created_at,
    ) {}

    public static function fromEntity(Division $division): self
    {
        return new self(
            id: $division->id(),
            season_id: $division->seasonId(),
            name: $division->name()->value(),
            description: $division->description()->value(),
            logo_url: $division->logoUrl()
                ? Storage::disk('public')->url($division->logoUrl())
                : null,
            order: $division->order(),
            created_at: $division->createdAt()->format('Y-m-d H:i:s'),
        );
    }
}
```

### Pattern 8: Infrastructure Event Listeners

Event listeners in infrastructure handle side effects like activity logging.

```php
// app/Infrastructure/Listeners/LogAdminActivity.php
final class LogAdminActivity
{
    public function handle(object $event): void
    {
        match (true) {
            $event instanceof AdminCreated => $this->logAdminCreated($event),
            $event instanceof AdminRoleChanged => $this->logAdminRoleChanged($event),
            $event instanceof AdminPasswordChanged => $this->logAdminPasswordChanged($event),
            default => null,
        };
    }

    private function logAdminRoleChanged(AdminRoleChanged $event): void
    {
        activity('admin')
            ->causedBy($this->getCurrentAdmin())
            ->performedOn($this->getAdminModel($event->admin))
            ->withProperties([
                'old_role' => $event->oldRole->value,
                'new_role' => $event->newRole->value,
            ])
            ->log('Changed admin role');
    }
}
```

---

## Packages & Tools

### Core Dependencies

**Domain-Driven Design:**
- **spatie/laravel-data** (^4.17) - Type-safe DTOs with validation attributes
- **spatie/laravel-activitylog** (^4.10) - Activity tracking via domain events

**Testing & Quality:**
- **phpunit/phpunit** - Unit and feature testing
- **phpstan/phpstan** - Static analysis (Level 8)
- **squizlabs/php_codesniffer** - PSR-12 code style
- **laravel/pint** - Laravel code formatter

### ApiResponse Helper

Location: `app/Helpers/ApiResponse.php`

```php
// Success responses
ApiResponse::success($data, 'Operation successful');
ApiResponse::created($data, 'Resource created');
ApiResponse::noContent();

// Error responses
ApiResponse::error('Error message', null, 400);
ApiResponse::notFound('User not found');
ApiResponse::unauthorized();
ApiResponse::forbidden();
ApiResponse::validationError($errors, 'Validation failed');

// Paginated responses
ApiResponse::paginated($data, $meta, $links);
```

---

## Testing Strategy

### Test Pyramid

```
        ┌─────────────┐
        │     E2E     │  ← Few (Playwright, full system)
        ├─────────────┤
        │  Feature    │  ← Some (HTTP endpoints, database)
        ├─────────────┤
        │    Unit     │  ← Many (entities, value objects, NO database)
        └─────────────┘
```

### Unit Tests (Domain Layer)

**Target**: 100% coverage of entities and value objects

```php
// tests/Unit/Domain/Division/ValueObjects/DivisionNameTest.php
public function test_creates_valid_division_name(): void
{
    $name = DivisionName::from('Pro Division');
    $this->assertSame('Pro Division', $name->value());
}

public function test_throws_exception_for_name_too_short(): void
{
    $this->expectException(InvalidDivisionNameException::class);
    DivisionName::from('A');
}

// tests/Unit/Domain/Admin/Entities/AdminTest.php
public function test_super_admin_can_change_any_role(): void
{
    $superAdmin = Admin::create(/* super admin */);
    $targetAdmin = Admin::create(/* admin role */);

    $targetAdmin->changeRole(AdminRole::MODERATOR, $superAdmin);

    $this->assertSame(AdminRole::MODERATOR, $targetAdmin->role());
}
```

**Location**: `tests/Unit/Domain/{Context}/`

### Feature Tests (HTTP Layer)

**Target**: Cover all API endpoints

```php
// tests/Feature/User/DivisionControllerTest.php
public function test_can_create_division(): void
{
    $user = User::factory()->create();
    $season = Season::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->postJson("/api/seasons/{$season->id}/divisions", [
            'name' => 'Pro Division',
            'description' => 'Top tier drivers',
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.name', 'Pro Division');
}
```

**Location**: `tests/Feature/{Context}/`

---

## Common Commands

### Testing

```bash
composer test                                    # Run all tests
composer test tests/Unit/                        # Unit tests only
composer test tests/Feature/                     # Feature tests only
composer test --filter=DivisionTest              # Specific test
```

### Static Analysis & Code Style

```bash
composer phpstan                                 # PHPStan (level 8)
composer phpcs                                   # PHP CodeSniffer (PSR-12)
composer phpcbf                                  # Auto-fix code style
./vendor/bin/pint                                # Laravel Pint
composer phpstan && composer phpcs               # All quality checks
```

### Migrations & Database

```bash
php artisan migrate                              # Run migrations
php artisan migrate:fresh --seed                 # Fresh with seeders
php artisan make:migration create_divisions_table
```

---

## Do's and Don'ts

### ✅ DO

**Domain Layer:**
- ✅ Put ALL business logic in entities
- ✅ Use value objects for domain concepts (EmailAddress, not string)
- ✅ Use enums for predefined sets with behavior
- ✅ Record domain events for significant state changes
- ✅ Keep domain layer pure PHP (no `use Illuminate\...`)
- ✅ Use factory methods (`create()`, `reconstitute()`)
- ✅ Implement optimistic locking via `updatedAt` checks

**Application Layer:**
- ✅ Authorize FIRST (before transactions)
- ✅ Validate files BEFORE transactions
- ✅ Use `DB::transaction()` for multi-step operations
- ✅ Dispatch events AFTER persistence
- ✅ Return DTOs from application services
- ✅ Handle infrastructure concerns (hashing, file storage)

**Infrastructure Layer:**
- ✅ Keep Eloquent models anemic (no business logic)
- ✅ Map between entities and Eloquent in repositories
- ✅ Use `withTrashed()` for soft-deleted records
- ✅ Implement optimistic locking
- ✅ Use event listeners for side effects (activity logging)

**Interface Layer:**
- ✅ Keep controllers thin (3-5 lines per method)
- ✅ Use DTOs for request validation
- ✅ Use ApiResponse helper
- ✅ Call `toArray()` on DTOs before returning JSON

### ❌ DON'T

**Domain Layer:**
- ❌ Don't use Laravel classes in domain (no `use Illuminate\...`)
- ❌ Don't access database directly
- ❌ Don't use primitive types for domain concepts
- ❌ Don't use public setters on entities
- ❌ Don't skip domain events for state changes

**Application Layer:**
- ❌ Don't put business logic in services (belongs in entities)
- ❌ Don't return entities (return DTOs)
- ❌ Don't skip transactions for multi-step operations
- ❌ Don't dispatch events BEFORE persistence

**Infrastructure Layer:**
- ❌ Don't put business logic in Eloquent models
- ❌ Don't expose Eloquent models outside infrastructure
- ❌ Don't bypass repositories for database access

**Interface Layer:**
- ❌ Don't put business logic in controllers
- ❌ Don't return entities (return DTOs)
- ❌ Don't make fat controllers (>10 lines per method)

---

## Troubleshooting

### PHPStan Errors

**Property has no type:**
```php
// ❌ Wrong
private $name;

// ✅ Correct
private string $name;
```

**Method return type missing:**
```php
// ❌ Wrong
public function getAll(): array

// ✅ Correct
/**
 * @return array<Division>
 */
public function getAll(): array
```

### Domain Event Issues

**Events not firing - check:**
1. Entity recording: `$this->recordDomainEvent(new DivisionCreated(...))`
2. Service dispatching: `$this->dispatchEvents($division)` AFTER persistence
3. Listener registered in `EventServiceProvider`
4. Transaction committed (events dispatch AFTER commit)

### Repository Issues

**Optimistic locking failure:**
```php
// Entity was modified by another process
// Solution: Fetch fresh entity and re-apply changes
$division = $this->divisionRepository->findById($id);
$division->updateDetails(...);
$this->divisionRepository->save($division);
```

**Soft-deleted records:**
```php
// ❌ Wrong - excludes soft deletes
$model = DivisionEloquent::find($id);

// ✅ Correct - includes soft deletes
$model = DivisionEloquent::withTrashed()->find($id);
```

---

## File Location Reference

```
Entity                → app/Domain/{Context}/Entities/
Value Object          → app/Domain/{Context}/ValueObjects/ or Shared/
Enum                  → app/Domain/{Context}/ValueObjects/ (as enum)
Domain Event          → app/Domain/{Context}/Events/
Domain Exception      → app/Domain/{Context}/Exceptions/
Domain Service        → app/Domain/{Context}/Services/
Repository Interface  → app/Domain/{Context}/Repositories/
Application Service   → app/Application/{Context}/Services/
DTO                   → app/Application/{Context}/DTOs/
Eloquent Model        → app/Infrastructure/Persistence/Eloquent/Models/
Repository Impl       → app/Infrastructure/Persistence/Eloquent/Repositories/
Event Listener        → app/Infrastructure/Listeners/
Controller            → app/Http/Controllers/{Context}/
Form Request          → app/Http/Requests/{Context}/
Migration             → database/migrations/
Unit Test             → tests/Unit/Domain/{Context}/
Feature Test          → tests/Feature/{Context}/
```

---

## Next Steps

- **For Admin development**: See [Admin Backend Development Guide](./admin-backend-guide.md)
- **For User development**: See [User Backend Development Guide](./user-backend-guide.md)

---

**End of DDD Backend Architecture Overview v4.0**

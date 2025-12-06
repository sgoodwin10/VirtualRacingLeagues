# Division Ordering Backend Implementation Plan

## Overview

This document provides a detailed implementation plan for adding ordering functionality to divisions within a season. The implementation follows the existing DDD (Domain-Driven Design) architecture used throughout the codebase.

## Requirements

1. **Auto-assign order**: When a new division is created, it should automatically receive the next available order number (max existing order + 1, or 1 if first division)
2. **Renumber on delete**: When a division is deleted, remaining divisions should be renumbered sequentially (1, 2, 3...) to close gaps
3. **Bulk reorder endpoint**: Provide an API endpoint for reordering divisions via drag-and-drop from the frontend

---

## 1. Migration Changes

### Create New Migration

**File**: `database/migrations/YYYY_MM_DD_HHMMSS_add_order_to_divisions_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('divisions', function (Blueprint $table) {
            $table->unsignedInteger('order')
                ->default(1)
                ->after('season_id')
                ->comment('Display order within season (1-based sequential)');

            // Create composite index for efficient ordering queries
            $table->index(['season_id', 'order']);
        });

        // Backfill existing divisions with sequential order numbers
        DB::statement('
            SET @row_number = 0;
            SET @current_season_id = NULL;

            UPDATE divisions
            SET divisions.order = (
                SELECT (@row_number := IF(@current_season_id = season_id, @row_number + 1, 1)) AS new_order
                FROM (
                    SELECT @current_season_id := season_id
                ) AS vars
            )
            ORDER BY season_id, name
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('divisions', function (Blueprint $table) {
            $table->dropIndex(['season_id', 'order']);
            $table->dropColumn('order');
        });
    }
};
```

**Column Specification**:
- **Name**: `order`
- **Type**: `unsignedInteger` (up to 4,294,967,295 - sufficient for division ordering)
- **Nullable**: No (default: 1)
- **Default**: 1
- **Index**: Composite index on `(season_id, order)` for efficient retrieval

**Rationale**:
- Using `unsignedInteger` instead of `tinyInteger` or `smallInteger` to avoid future limitations
- Composite index `(season_id, order)` enables efficient queries for "get divisions by season ordered by order"
- Default value of 1 prevents null issues during migration
- Backfill script assigns sequential order based on existing alphabetical name order

---

## 2. Domain Layer Changes

### 2.1 Division Entity Updates

**File**: `app/Domain/Division/Entities/Division.php`

**Changes**:

1. **Add order property** to constructor:
```php
private function __construct(
    private ?int $id,
    private int $seasonId,
    private DivisionName $name,
    private DivisionDescription $description,
    private ?string $logoUrl,
    private int $order,  // NEW
    private DateTimeImmutable $createdAt,
    private DateTimeImmutable $updatedAt,
) {
}
```

2. **Update create() method** to accept order:
```php
public static function create(
    int $seasonId,
    DivisionName $name,
    DivisionDescription $description,
    int $order,  // NEW - caller must compute next available order
    ?string $logoUrl = null,
): self {
    return new self(
        id: null,
        seasonId: $seasonId,
        name: $name,
        description: $description,
        logoUrl: $logoUrl,
        order: $order,  // NEW
        createdAt: new DateTimeImmutable(),
        updatedAt: new DateTimeImmutable(),
    );
}
```

3. **Update reconstitute() method** to include order:
```php
public static function reconstitute(
    int $id,
    int $seasonId,
    DivisionName $name,
    DivisionDescription $description,
    ?string $logoUrl,
    int $order,  // NEW
    DateTimeImmutable $createdAt,
    DateTimeImmutable $updatedAt,
): self {
    return new self(
        id: $id,
        seasonId: $seasonId,
        name: $name,
        description: $description,
        logoUrl: $logoUrl,
        order: $order,  // NEW
        createdAt: $createdAt,
        updatedAt: $updatedAt,
    );
}
```

4. **Add order getter**:
```php
public function order(): int
{
    return $this->order;
}
```

5. **Add changeOrder() method** for reordering:
```php
/**
 * Change the division's display order.
 * This is used during bulk reordering operations.
 */
public function changeOrder(int $newOrder): void
{
    if ($newOrder < 1) {
        throw new \InvalidArgumentException('Order must be at least 1');
    }

    if ($newOrder === $this->order) {
        return; // No change needed
    }

    $this->order = $newOrder;
    $this->updatedAt = new DateTimeImmutable();

    $this->recordEvent(new DivisionReordered(
        divisionId: $this->id ?? 0,
        seasonId: $this->seasonId,
        oldOrder: $this->order,
        newOrder: $newOrder,
    ));
}
```

6. **Update recordCreationEvent()** to include order:
```php
public function recordCreationEvent(): void
{
    if ($this->id === null) {
        throw new \LogicException('Cannot record creation event before entity has an ID');
    }

    $this->recordEvent(new DivisionCreated(
        divisionId: $this->id,
        seasonId: $this->seasonId,
        name: $this->name->value(),
        description: $this->description->value(),
        logoUrl: $this->logoUrl,
        order: $this->order,  // NEW
    ));
}
```

### 2.2 Domain Events

#### Create DivisionReordered Event

**File**: `app/Domain/Division/Events/DivisionReordered.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Division\Events;

/**
 * Event fired when divisions are reordered within a season.
 */
final readonly class DivisionReordered
{
    public function __construct(
        public int $divisionId,
        public int $seasonId,
        public int $oldOrder,
        public int $newOrder,
    ) {
    }
}
```

#### Update DivisionCreated Event

**File**: `app/Domain/Division/Events/DivisionCreated.php`

**Add order parameter**:
```php
public function __construct(
    public int $divisionId,
    public int $seasonId,
    public string $name,
    public ?string $description,
    public ?string $logoUrl,
    public int $order,  // NEW
) {
}
```

---

## 3. Repository Changes

### 3.1 Repository Interface

**File**: `app/Domain/Division/Repositories/DivisionRepositoryInterface.php`

**Add new methods**:

```php
/**
 * Find all divisions for a specific season, ordered by the 'order' field.
 *
 * @return array<Division>
 */
public function findBySeasonIdOrdered(int $seasonId): array;

/**
 * Get the next available order number for a season.
 * Returns max(order) + 1, or 1 if no divisions exist.
 */
public function getNextOrderForSeason(int $seasonId): int;

/**
 * Renumber divisions sequentially after a deletion.
 * This closes gaps in the ordering (e.g., 1, 2, 4, 5 becomes 1, 2, 3, 4).
 *
 * @param int $seasonId
 */
public function renumberDivisionsForSeason(int $seasonId): void;

/**
 * Update the order of multiple divisions in a single transaction.
 * Used for bulk reordering operations.
 *
 * @param array<array{id: int, order: int}> $divisionOrders Array of [id => order] mappings
 */
public function bulkUpdateOrders(array $divisionOrders): void;
```

**Update existing method** (for clarity):
```php
/**
 * Find all divisions for a specific season.
 * NOTE: Use findBySeasonIdOrdered() for ordered results.
 * This method orders by name for backwards compatibility.
 *
 * @return array<Division>
 */
public function findBySeasonId(int $seasonId): array;
```

### 3.2 Repository Implementation

**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentDivisionRepository.php`

**Update findBySeasonId()** to order by `order` instead of `name`:

```php
/**
 * @return array<Division>
 */
public function findBySeasonId(int $seasonId): array
{
    /** @var \Illuminate\Database\Eloquent\Collection<int, DivisionEloquent> $eloquentDivisions */
    $eloquentDivisions = DivisionEloquent::where('season_id', $seasonId)
        ->orderBy('order', 'asc')  // CHANGED from 'name'
        ->get();

    return $eloquentDivisions->map(
        /** @param DivisionEloquent $eloquentDivision */
        fn($eloquentDivision) => $this->toDomainEntity($eloquentDivision)
    )->all();
}
```

**Add new findBySeasonIdOrdered() method**:

```php
/**
 * @return array<Division>
 */
public function findBySeasonIdOrdered(int $seasonId): array
{
    // Same as findBySeasonId() now that it orders by 'order'
    return $this->findBySeasonId($seasonId);
}
```

**Add getNextOrderForSeason() method**:

```php
public function getNextOrderForSeason(int $seasonId): int
{
    $maxOrder = DivisionEloquent::where('season_id', $seasonId)
        ->max('order');

    return $maxOrder !== null ? $maxOrder + 1 : 1;
}
```

**Add renumberDivisionsForSeason() method**:

```php
public function renumberDivisionsForSeason(int $seasonId): void
{
    // Fetch all divisions for the season, ordered by current order
    $divisions = DivisionEloquent::where('season_id', $seasonId)
        ->orderBy('order', 'asc')
        ->get();

    // Renumber sequentially starting from 1
    $currentOrder = 1;
    foreach ($divisions as $division) {
        if ($division->order !== $currentOrder) {
            $division->order = $currentOrder;
            $division->save();
        }
        $currentOrder++;
    }
}
```

**Add bulkUpdateOrders() method**:

```php
/**
 * @param array<array{id: int, order: int}> $divisionOrders
 */
public function bulkUpdateOrders(array $divisionOrders): void
{
    foreach ($divisionOrders as $divisionOrder) {
        DivisionEloquent::where('id', $divisionOrder['id'])
            ->update(['order' => $divisionOrder['order']]);
    }
}
```

**Update fillEloquentModel()** to include order:

```php
private function fillEloquentModel(DivisionEloquent $eloquentDivision, Division $division): void
{
    $eloquentDivision->season_id = $division->seasonId();
    $eloquentDivision->name = $division->name()->value();
    $eloquentDivision->description = $division->description()->value();
    $eloquentDivision->logo_url = $division->logoUrl();
    $eloquentDivision->order = $division->order();  // NEW
}
```

**Update toDomainEntity()** to include order:

```php
private function toDomainEntity(DivisionEloquent $eloquentDivision): Division
{
    return Division::reconstitute(
        id: $eloquentDivision->id,
        seasonId: $eloquentDivision->season_id,
        name: DivisionName::from($eloquentDivision->name),
        description: DivisionDescription::from($eloquentDivision->description),
        logoUrl: $eloquentDivision->logo_url,
        order: $eloquentDivision->order,  // NEW
        createdAt: new DateTimeImmutable($eloquentDivision->created_at->toDateTimeString()),
        updatedAt: new DateTimeImmutable($eloquentDivision->updated_at->toDateTimeString()),
    );
}
```

---

## 4. Infrastructure Layer Changes

### 4.1 Eloquent Model

**File**: `app/Infrastructure/Persistence/Eloquent/Models/Division.php`

**Add order to fillable**:
```php
protected $fillable = [
    'season_id',
    'name',
    'description',
    'logo_url',
    'order',  // NEW
];
```

**Add order to casts**:
```php
protected $casts = [
    'season_id' => 'integer',
    'order' => 'integer',  // NEW
    'created_at' => 'datetime',
    'updated_at' => 'datetime',
];
```

**Update PHPDoc**:
```php
/**
 * Division Eloquent Model (Anemic).
 *
 * @property int $id
 * @property int $season_id
 * @property string $name
 * @property string|null $description
 * @property string|null $logo_url
 * @property int $order
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * ...
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Division whereOrder($value)
 */
```

---

## 5. Application Layer Changes

### 5.1 DTO Changes

#### Update DivisionData

**File**: `app/Application/Division/DTOs/DivisionData.php`

```php
final class DivisionData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly int $season_id,
        public readonly string $name,
        public readonly ?string $description,
        public readonly ?string $logo_url,
        public readonly int $order,  // NEW
        public readonly string $created_at,
        public readonly string $updated_at,
    ) {
    }

    /**
     * Create from domain entity.
     */
    public static function fromEntity(Division $division): self
    {
        return new self(
            id: $division->id() ?? 0,
            season_id: $division->seasonId(),
            name: $division->name()->value(),
            description: $division->description()->value(),
            logo_url: $division->logoUrl()
                ? Storage::disk('public')->url($division->logoUrl())
                : null,
            order: $division->order(),  // NEW
            created_at: $division->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $division->updatedAt()->format('Y-m-d H:i:s'),
        );
    }
}
```

#### Create ReorderDivisionsData

**File**: `app/Application/Division/DTOs/ReorderDivisionsData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Division\DTOs;

use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

/**
 * Data Transfer Object for reordering divisions.
 */
final class ReorderDivisionsData extends Data
{
    /**
     * @param array<int, array{id: int, order: int}> $divisions
     */
    public function __construct(
        #[Required, ArrayType]
        public readonly array $divisions,
    ) {
    }

    /**
     * Additional validation rules.
     *
     * @return array<string, mixed>
     */
    public static function rules(): array
    {
        return [
            'divisions' => ['required', 'array', 'min:1'],
            'divisions.*.id' => ['required', 'integer', 'min:1'],
            'divisions.*.order' => ['required', 'integer', 'min:1'],
        ];
    }
}
```

### 5.2 Application Service Updates

**File**: `app/Application/Division/Services/DivisionApplicationService.php`

**Update createDivision()** to auto-assign order:

```php
/**
 * Create a new division.
 */
public function createDivision(CreateDivisionData $data, int $seasonId): DivisionData
{
    return DB::transaction(function () use ($data, $seasonId) {
        // Get next available order for the season
        $nextOrder = $this->divisionRepository->getNextOrderForSeason($seasonId);

        // Store logo if provided
        $logoPath = null;
        if ($data->logo) {
            $logoPath = $data->logo->store("divisions/season-{$seasonId}", 'public');
            if (!$logoPath) {
                throw new \RuntimeException('Failed to store division logo');
            }
        }

        // Create domain entity with auto-assigned order
        $division = Division::create(
            seasonId: $seasonId,
            name: DivisionName::from($data->name),
            description: DivisionDescription::from($data->description),
            order: $nextOrder,  // NEW
            logoUrl: $logoPath,
        );

        // Persist
        $this->divisionRepository->save($division);

        // Record creation event now that ID is set
        $division->recordCreationEvent();

        // Dispatch domain events
        $this->dispatchEvents($division);

        return DivisionData::fromEntity($division);
    });
}
```

**Update deleteDivision()** to renumber remaining divisions:

```php
/**
 * Delete a division.
 * This will cascade to set all season_drivers.division_id to NULL.
 * Remaining divisions will be renumbered sequentially.
 */
public function deleteDivision(int $divisionId): void
{
    DB::transaction(function () use ($divisionId) {
        $division = $this->divisionRepository->findById($divisionId);
        $seasonId = $division->seasonId();

        // Delete logo if exists
        if ($division->logoUrl()) {
            Storage::disk('public')->delete($division->logoUrl());
        }

        // Mark for deletion (records domain event)
        $division->delete();

        // Dispatch domain events
        $this->dispatchEvents($division);

        // Perform hard delete (this will cascade to season_drivers.division_id)
        $this->divisionRepository->delete($division);

        // Renumber remaining divisions to close gaps
        $this->divisionRepository->renumberDivisionsForSeason($seasonId);
    });
}
```

**Add reorderDivisions() method**:

```php
/**
 * Reorder divisions within a season.
 *
 * @param int $seasonId
 * @param ReorderDivisionsData $data
 * @return array<DivisionData>
 */
public function reorderDivisions(int $seasonId, ReorderDivisionsData $data): array
{
    return DB::transaction(function () use ($seasonId, $data) {
        // Validate that all divisions belong to the specified season
        foreach ($data->divisions as $divisionUpdate) {
            $division = $this->divisionRepository->findById($divisionUpdate['id']);

            if ($division->seasonId() !== $seasonId) {
                throw new \InvalidArgumentException(
                    "Division {$divisionUpdate['id']} does not belong to season {$seasonId}"
                );
            }
        }

        // Perform bulk update
        $this->divisionRepository->bulkUpdateOrders($data->divisions);

        // Fetch and return updated divisions
        return $this->getDivisionsBySeasonId($seasonId);
    });
}
```

---

## 6. Interface Layer (Controller) Changes

**File**: `app/Http/Controllers/User/DivisionController.php`

**Add reorder() method**:

```php
/**
 * Reorder divisions within a season.
 */
public function reorder(ReorderDivisionsData $data, int $seasonId): JsonResponse
{
    $divisions = $this->divisionService->reorderDivisions($seasonId, $data);
    return ApiResponse::success($divisions, 'Divisions reordered successfully');
}
```

---

## 7. API Routes

**File**: `routes/subdomain.php`

**Add new route** (insert after existing division routes):

```php
// Inside app.virtualracingleagues.localhost domain group, api middleware group:
Route::put('/seasons/{seasonId}/divisions/reorder', [DivisionController::class, 'reorder'])
    ->name('seasons.divisions.reorder');
```

**Complete division routes section should look like**:
```php
Route::get('/seasons/{seasonId}/divisions', [DivisionController::class, 'index'])
    ->name('seasons.divisions.index');
Route::post('/seasons/{seasonId}/divisions', [DivisionController::class, 'store'])
    ->name('seasons.divisions.store');
Route::put('/seasons/{seasonId}/divisions/{divisionId}', [DivisionController::class, 'update'])
    ->name('seasons.divisions.update');
Route::delete('/seasons/{seasonId}/divisions/{divisionId}', [DivisionController::class, 'destroy'])
    ->name('seasons.divisions.destroy');
Route::get('/seasons/{seasonId}/divisions/{divisionId}/driver-count', [DivisionController::class, 'driverCount'])
    ->name('seasons.divisions.driver-count');
Route::put('/seasons/{seasonId}/divisions/reorder', [DivisionController::class, 'reorder'])
    ->name('seasons.divisions.reorder');  // NEW
```

**Important**: Place the `/reorder` route AFTER the specific `/{divisionId}` routes to avoid route matching conflicts.

---

## 8. API Specification

### New Endpoint: Reorder Divisions

#### Request

```http
PUT /api/seasons/{seasonId}/divisions/reorder
Content-Type: application/json
Authorization: Bearer {token}

{
  "divisions": [
    { "id": 3, "order": 1 },
    { "id": 1, "order": 2 },
    { "id": 2, "order": 3 }
  ]
}
```

**Parameters**:
- `seasonId` (path, integer, required): The season ID
- `divisions` (body, array, required): Array of division reordering objects
  - `divisions[].id` (integer, required): Division ID
  - `divisions[].order` (integer, required, min: 1): New order position

**Validation Rules**:
- `divisions` must be a non-empty array
- Each division must have an `id` (integer, min: 1)
- Each division must have an `order` (integer, min: 1)
- All division IDs must belong to the specified season (validated in service)

#### Response

**Success (200 OK)**:
```json
{
  "status": "success",
  "message": "Divisions reordered successfully",
  "data": [
    {
      "id": 3,
      "season_id": 1,
      "name": "Division A",
      "description": "Top tier division",
      "logo_url": "http://example.com/storage/divisions/season-1/abc123.png",
      "order": 1,
      "created_at": "2025-12-01 10:00:00",
      "updated_at": "2025-12-04 14:30:00"
    },
    {
      "id": 1,
      "season_id": 1,
      "name": "Division B",
      "description": "Second tier division",
      "logo_url": null,
      "order": 2,
      "created_at": "2025-12-01 09:00:00",
      "updated_at": "2025-12-04 14:30:00"
    },
    {
      "id": 2,
      "season_id": 1,
      "name": "Division C",
      "description": "Third tier division",
      "logo_url": null,
      "order": 3,
      "created_at": "2025-12-01 09:30:00",
      "updated_at": "2025-12-04 14:30:00"
    }
  ]
}
```

**Error Responses**:

**422 Unprocessable Entity** (validation failure):
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "divisions.0.order": ["The divisions.0.order must be at least 1."]
  }
}
```

**404 Not Found** (division doesn't exist):
```json
{
  "status": "error",
  "message": "Division with ID 999 not found"
}
```

**400 Bad Request** (division belongs to different season):
```json
{
  "status": "error",
  "message": "Division 5 does not belong to season 1"
}
```

### Updated Endpoint: Get Divisions

**Existing endpoint now returns divisions ordered by `order` field**:

```http
GET /api/seasons/{seasonId}/divisions
```

**Response** (now ordered by `order` field):
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "season_id": 1,
      "name": "Division A",
      "description": "Top tier",
      "logo_url": "http://example.com/storage/divisions/season-1/logo1.png",
      "order": 1,
      "created_at": "2025-12-01 10:00:00",
      "updated_at": "2025-12-01 10:00:00"
    },
    {
      "id": 2,
      "season_id": 1,
      "name": "Division B",
      "description": "Second tier",
      "logo_url": null,
      "order": 2,
      "created_at": "2025-12-01 10:05:00",
      "updated_at": "2025-12-01 10:05:00"
    }
  ]
}
```

### Updated Endpoint: Create Division

**Existing endpoint now auto-assigns order**:

```http
POST /api/seasons/{seasonId}/divisions
Content-Type: multipart/form-data

name: Division C
description: Third tier division
logo: (file upload)
```

**Response** (includes auto-assigned `order`):
```json
{
  "status": "success",
  "message": "Division created successfully",
  "data": {
    "id": 3,
    "season_id": 1,
    "name": "Division C",
    "description": "Third tier division",
    "logo_url": "http://example.com/storage/divisions/season-1/logo3.png",
    "order": 3,
    "created_at": "2025-12-04 15:00:00",
    "updated_at": "2025-12-04 15:00:00"
  }
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests (Domain Layer)

**File**: `tests/Unit/Domain/Division/Entities/DivisionTest.php`

**New tests to add**:

```php
/** @test */
public function it_creates_division_with_order(): void
{
    $division = Division::create(
        seasonId: 1,
        name: DivisionName::from('Division A'),
        description: DivisionDescription::from('Test description'),
        order: 1,
    );

    $this->assertSame(1, $division->order());
}

/** @test */
public function it_can_change_order(): void
{
    $division = Division::create(
        seasonId: 1,
        name: DivisionName::from('Division A'),
        description: DivisionDescription::from('Test description'),
        order: 1,
    );

    $division->setId(1); // Simulate persistence
    $division->changeOrder(3);

    $this->assertSame(3, $division->order());
    $this->assertTrue($division->hasEvents());
}

/** @test */
public function it_records_division_reordered_event(): void
{
    $division = Division::create(
        seasonId: 1,
        name: DivisionName::from('Division A'),
        description: DivisionDescription::from('Test description'),
        order: 1,
    );

    $division->setId(1);
    $division->changeOrder(2);

    $events = $division->releaseEvents();
    $this->assertCount(1, $events);
    $this->assertInstanceOf(DivisionReordered::class, $events[0]);
    $this->assertSame(1, $events[0]->oldOrder);
    $this->assertSame(2, $events[0]->newOrder);
}

/** @test */
public function it_does_not_record_event_when_order_unchanged(): void
{
    $division = Division::create(
        seasonId: 1,
        name: DivisionName::from('Division A'),
        description: DivisionDescription::from('Test description'),
        order: 2,
    );

    $division->setId(1);
    $division->changeOrder(2); // Same order

    $this->assertFalse($division->hasEvents());
}

/** @test */
public function it_throws_exception_for_invalid_order(): void
{
    $this->expectException(\InvalidArgumentException::class);
    $this->expectExceptionMessage('Order must be at least 1');

    $division = Division::create(
        seasonId: 1,
        name: DivisionName::from('Division A'),
        description: DivisionDescription::from('Test description'),
        order: 1,
    );

    $division->setId(1);
    $division->changeOrder(0); // Invalid
}
```

### 9.2 Integration Tests (Repository Layer)

**File**: `tests/Integration/Persistence/Eloquent/Repositories/EloquentDivisionRepositoryTest.php`

**New tests to add**:

```php
/** @test */
public function it_retrieves_divisions_ordered_by_order_field(): void
{
    $season = SeasonEloquent::factory()->create();

    // Create divisions out of order
    DivisionEloquent::factory()->create([
        'season_id' => $season->id,
        'name' => 'Division C',
        'order' => 3,
    ]);
    DivisionEloquent::factory()->create([
        'season_id' => $season->id,
        'name' => 'Division A',
        'order' => 1,
    ]);
    DivisionEloquent::factory()->create([
        'season_id' => $season->id,
        'name' => 'Division B',
        'order' => 2,
    ]);

    $repository = new EloquentDivisionRepository();
    $divisions = $repository->findBySeasonId($season->id);

    $this->assertCount(3, $divisions);
    $this->assertSame(1, $divisions[0]->order());
    $this->assertSame(2, $divisions[1]->order());
    $this->assertSame(3, $divisions[2]->order());
}

/** @test */
public function it_gets_next_order_for_season(): void
{
    $season = SeasonEloquent::factory()->create();

    DivisionEloquent::factory()->create([
        'season_id' => $season->id,
        'order' => 1,
    ]);
    DivisionEloquent::factory()->create([
        'season_id' => $season->id,
        'order' => 2,
    ]);

    $repository = new EloquentDivisionRepository();
    $nextOrder = $repository->getNextOrderForSeason($season->id);

    $this->assertSame(3, $nextOrder);
}

/** @test */
public function it_returns_one_for_first_division(): void
{
    $season = SeasonEloquent::factory()->create();

    $repository = new EloquentDivisionRepository();
    $nextOrder = $repository->getNextOrderForSeason($season->id);

    $this->assertSame(1, $nextOrder);
}

/** @test */
public function it_renumbers_divisions_after_deletion(): void
{
    $season = SeasonEloquent::factory()->create();

    $div1 = DivisionEloquent::factory()->create([
        'season_id' => $season->id,
        'order' => 1,
    ]);
    $div2 = DivisionEloquent::factory()->create([
        'season_id' => $season->id,
        'order' => 2,
    ]);
    $div3 = DivisionEloquent::factory()->create([
        'season_id' => $season->id,
        'order' => 3,
    ]);
    $div4 = DivisionEloquent::factory()->create([
        'season_id' => $season->id,
        'order' => 4,
    ]);

    // Delete division with order 2
    $div2->delete();

    $repository = new EloquentDivisionRepository();
    $repository->renumberDivisionsForSeason($season->id);

    // Refresh models
    $div1->refresh();
    $div3->refresh();
    $div4->refresh();

    $this->assertSame(1, $div1->order);
    $this->assertSame(2, $div3->order);
    $this->assertSame(3, $div4->order);
}

/** @test */
public function it_bulk_updates_division_orders(): void
{
    $season = SeasonEloquent::factory()->create();

    $div1 = DivisionEloquent::factory()->create([
        'season_id' => $season->id,
        'order' => 1,
    ]);
    $div2 = DivisionEloquent::factory()->create([
        'season_id' => $season->id,
        'order' => 2,
    ]);
    $div3 = DivisionEloquent::factory()->create([
        'season_id' => $season->id,
        'order' => 3,
    ]);

    $repository = new EloquentDivisionRepository();
    $repository->bulkUpdateOrders([
        ['id' => $div3->id, 'order' => 1],
        ['id' => $div1->id, 'order' => 2],
        ['id' => $div2->id, 'order' => 3],
    ]);

    // Refresh models
    $div1->refresh();
    $div2->refresh();
    $div3->refresh();

    $this->assertSame(2, $div1->order);
    $this->assertSame(3, $div2->order);
    $this->assertSame(1, $div3->order);
}
```

### 9.3 Feature Tests (API Endpoints)

**File**: `tests/Feature/Division/DivisionReorderTest.php`

```php
<?php

declare(strict_types=1);

namespace Tests\Feature\Division;

use App\Infrastructure\Persistence\Eloquent\Models\Division as DivisionEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DivisionReorderTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_reorders_divisions_successfully(): void
    {
        $user = UserEloquent::factory()->create();
        $season = SeasonEloquent::factory()->create();

        $div1 = DivisionEloquent::factory()->create([
            'season_id' => $season->id,
            'name' => 'Division A',
            'order' => 1,
        ]);
        $div2 = DivisionEloquent::factory()->create([
            'season_id' => $season->id,
            'name' => 'Division B',
            'order' => 2,
        ]);
        $div3 = DivisionEloquent::factory()->create([
            'season_id' => $season->id,
            'name' => 'Division C',
            'order' => 3,
        ]);

        $response = $this->actingAs($user)->putJson(
            "/api/seasons/{$season->id}/divisions/reorder",
            [
                'divisions' => [
                    ['id' => $div3->id, 'order' => 1],
                    ['id' => $div1->id, 'order' => 2],
                    ['id' => $div2->id, 'order' => 3],
                ],
            ]
        );

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'message' => 'Divisions reordered successfully',
        ]);

        // Verify database
        $this->assertDatabaseHas('divisions', [
            'id' => $div3->id,
            'order' => 1,
        ]);
        $this->assertDatabaseHas('divisions', [
            'id' => $div1->id,
            'order' => 2,
        ]);
        $this->assertDatabaseHas('divisions', [
            'id' => $div2->id,
            'order' => 3,
        ]);
    }

    /** @test */
    public function it_validates_division_ownership(): void
    {
        $user = UserEloquent::factory()->create();
        $season1 = SeasonEloquent::factory()->create();
        $season2 = SeasonEloquent::factory()->create();

        $div1 = DivisionEloquent::factory()->create([
            'season_id' => $season1->id,
            'order' => 1,
        ]);
        $div2 = DivisionEloquent::factory()->create([
            'season_id' => $season2->id, // Different season!
            'order' => 1,
        ]);

        $response = $this->actingAs($user)->putJson(
            "/api/seasons/{$season1->id}/divisions/reorder",
            [
                'divisions' => [
                    ['id' => $div1->id, 'order' => 1],
                    ['id' => $div2->id, 'order' => 2], // Belongs to season2, not season1
                ],
            ]
        );

        $response->assertStatus(400);
        $response->assertJsonFragment([
            'status' => 'error',
        ]);
    }

    /** @test */
    public function it_validates_required_fields(): void
    {
        $user = UserEloquent::factory()->create();
        $season = SeasonEloquent::factory()->create();

        $response = $this->actingAs($user)->putJson(
            "/api/seasons/{$season->id}/divisions/reorder",
            [
                'divisions' => [], // Empty array
            ]
        );

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['divisions']);
    }

    /** @test */
    public function it_validates_division_structure(): void
    {
        $user = UserEloquent::factory()->create();
        $season = SeasonEloquent::factory()->create();

        $response = $this->actingAs($user)->putJson(
            "/api/seasons/{$season->id}/divisions/reorder",
            [
                'divisions' => [
                    ['id' => 1], // Missing 'order'
                ],
            ]
        );

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['divisions.0.order']);
    }
}
```

**File**: `tests/Feature/Division/DivisionOrderingTest.php`

```php
<?php

declare(strict_types=1);

namespace Tests\Feature\Division;

use App\Infrastructure\Persistence\Eloquent\Models\Division as DivisionEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\UserEloquent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DivisionOrderingTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_auto_assigns_order_when_creating_division(): void
    {
        Storage::fake('public');
        $user = UserEloquent::factory()->create();
        $season = SeasonEloquent::factory()->create();

        // Create first division
        $response1 = $this->actingAs($user)->postJson(
            "/api/seasons/{$season->id}/divisions",
            [
                'name' => 'Division A',
                'description' => 'First division',
            ]
        );

        $response1->assertStatus(201);
        $response1->assertJsonPath('data.order', 1);

        // Create second division
        $response2 = $this->actingAs($user)->postJson(
            "/api/seasons/{$season->id}/divisions",
            [
                'name' => 'Division B',
                'description' => 'Second division',
            ]
        );

        $response2->assertStatus(201);
        $response2->assertJsonPath('data.order', 2);

        // Create third division
        $response3 = $this->actingAs($user)->postJson(
            "/api/seasons/{$season->id}/divisions",
            [
                'name' => 'Division C',
                'description' => 'Third division',
            ]
        );

        $response3->assertStatus(201);
        $response3->assertJsonPath('data.order', 3);
    }

    /** @test */
    public function it_renumbers_divisions_after_deletion(): void
    {
        $user = UserEloquent::factory()->create();
        $season = SeasonEloquent::factory()->create();

        // Create 4 divisions
        $div1 = DivisionEloquent::factory()->create([
            'season_id' => $season->id,
            'order' => 1,
        ]);
        $div2 = DivisionEloquent::factory()->create([
            'season_id' => $season->id,
            'order' => 2,
        ]);
        $div3 = DivisionEloquent::factory()->create([
            'season_id' => $season->id,
            'order' => 3,
        ]);
        $div4 = DivisionEloquent::factory()->create([
            'season_id' => $season->id,
            'order' => 4,
        ]);

        // Delete division with order 2
        $this->actingAs($user)->deleteJson(
            "/api/seasons/{$season->id}/divisions/{$div2->id}"
        );

        // Verify renumbering
        $this->assertDatabaseHas('divisions', [
            'id' => $div1->id,
            'order' => 1,
        ]);
        $this->assertDatabaseHas('divisions', [
            'id' => $div3->id,
            'order' => 2, // Renumbered from 3 to 2
        ]);
        $this->assertDatabaseHas('divisions', [
            'id' => $div4->id,
            'order' => 3, // Renumbered from 4 to 3
        ]);
    }

    /** @test */
    public function it_returns_divisions_ordered_by_order_field(): void
    {
        $user = UserEloquent::factory()->create();
        $season = SeasonEloquent::factory()->create();

        // Create divisions in random order
        DivisionEloquent::factory()->create([
            'season_id' => $season->id,
            'name' => 'Division C',
            'order' => 3,
        ]);
        DivisionEloquent::factory()->create([
            'season_id' => $season->id,
            'name' => 'Division A',
            'order' => 1,
        ]);
        DivisionEloquent::factory()->create([
            'season_id' => $season->id,
            'name' => 'Division B',
            'order' => 2,
        ]);

        $response = $this->actingAs($user)->getJson(
            "/api/seasons/{$season->id}/divisions"
        );

        $response->assertStatus(200);

        $divisions = $response->json('data');
        $this->assertSame('Division A', $divisions[0]['name']);
        $this->assertSame(1, $divisions[0]['order']);
        $this->assertSame('Division B', $divisions[1]['name']);
        $this->assertSame(2, $divisions[1]['order']);
        $this->assertSame('Division C', $divisions[2]['name']);
        $this->assertSame(3, $divisions[2]['order']);
    }
}
```

---

## 10. Implementation Checklist

### Phase 1: Database & Infrastructure
- [ ] Create migration for `order` column
- [ ] Run migration and verify backfill
- [ ] Update `Division` Eloquent model (fillable, casts, PHPDoc)
- [ ] Run PHPStan and fix any type errors
- [ ] Run PHPCS and PHPCBF

### Phase 2: Domain Layer
- [ ] Add `order` property to `Division` entity
- [ ] Update `create()` method signature
- [ ] Update `reconstitute()` method signature
- [ ] Add `order()` getter
- [ ] Add `changeOrder()` method
- [ ] Update `recordCreationEvent()` to include order
- [ ] Create `DivisionReordered` event
- [ ] Update `DivisionCreated` event to include order
- [ ] Write unit tests for entity
- [ ] Run unit tests and verify all pass

### Phase 3: Repository Layer
- [ ] Update `DivisionRepositoryInterface` with new methods
- [ ] Update `findBySeasonId()` to order by `order` field
- [ ] Implement `findBySeasonIdOrdered()` method
- [ ] Implement `getNextOrderForSeason()` method
- [ ] Implement `renumberDivisionsForSeason()` method
- [ ] Implement `bulkUpdateOrders()` method
- [ ] Update `fillEloquentModel()` to include order
- [ ] Update `toDomainEntity()` to include order
- [ ] Write integration tests for repository
- [ ] Run integration tests and verify all pass

### Phase 4: Application Layer
- [ ] Update `DivisionData` DTO to include order
- [ ] Create `ReorderDivisionsData` DTO
- [ ] Update `createDivision()` service method to auto-assign order
- [ ] Update `deleteDivision()` service method to renumber
- [ ] Add `reorderDivisions()` service method
- [ ] Write feature tests for application service
- [ ] Run feature tests and verify all pass

### Phase 5: Interface Layer & Routes
- [ ] Add `reorder()` controller method
- [ ] Add route for `/seasons/{seasonId}/divisions/reorder`
- [ ] Write feature tests for API endpoints
- [ ] Run feature tests and verify all pass

### Phase 6: Quality Assurance
- [ ] Run all tests: `composer test`
- [ ] Run PHPStan: `composer phpstan`
- [ ] Run PHPCS: `composer phpcs`
- [ ] Run PHPCBF: `composer phpcbf`
- [ ] Manual testing via Postman/Insomnia
- [ ] Verify all domain events are dispatched correctly
- [ ] Check database indexes are created
- [ ] Verify performance with large datasets (100+ divisions)

---

## 11. Rollback Plan

If issues arise during implementation:

1. **Database**: Run `php artisan migrate:rollback` to remove the `order` column
2. **Code**: Revert all changes via Git: `git revert <commit-hash>`
3. **Tests**: Disable new tests temporarily if blocking other work

---

## 12. Performance Considerations

1. **Composite Index**: The `(season_id, order)` index enables efficient queries for fetching ordered divisions
2. **Bulk Updates**: The `bulkUpdateOrders()` method uses individual UPDATE statements. For very large reordering operations (100+ divisions), consider using a single raw SQL statement with CASE/WHEN
3. **Renumbering**: The `renumberDivisionsForSeason()` method updates divisions one-by-one. For large datasets, consider optimizing with a single UPDATE statement using variables
4. **Transaction Safety**: All write operations use database transactions to ensure consistency

---

## 13. Future Enhancements

1. **Optimistic Locking**: Add a `version` column to prevent concurrent reordering conflicts
2. **Audit Trail**: Track who reordered divisions and when using `spatie/laravel-activitylog`
3. **Undo/Redo**: Store previous order states to allow users to undo reordering
4. **Drag Constraints**: Add validation to prevent gaps in ordering (e.g., [1, 2, 5] should be rejected)
5. **Batch Renumbering**: Optimize renumbering with a single SQL query instead of loop

---

## 14. Notes

- **DDD Compliance**: This implementation strictly follows the existing DDD patterns (Domain → Application → Infrastructure → Interface layers)
- **Value Objects**: We did not create a `DivisionOrder` value object because order is a simple integer without complex validation rules. If more complex ordering logic is needed (e.g., fractional ordering, priority levels), consider creating a value object
- **Domain Events**: `DivisionReordered` event can be used for activity logging, notifications, or triggering side effects
- **Backwards Compatibility**: The migration includes a backfill script to assign order to existing divisions, preserving their current alphabetical order
- **Testing**: Comprehensive test coverage at all layers (unit, integration, feature) ensures reliability

---

**END OF IMPLEMENTATION PLAN**

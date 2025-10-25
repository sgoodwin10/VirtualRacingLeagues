# Divisions Feature - Backend Implementation Plan

## Overview
This plan follows the Domain-Driven Design (DDD) architecture established in this project. All implementation should follow the patterns documented in `.claude/guides/backend/ddd-overview.md` and `.claude/guides/backend/admin-backend-guide.md`.

**Agent to use:** `dev-be`

---

## Architectural Questions & Decisions

### Q1: Should divisions be tied to a season setting like `division_enabled`?
**Answer:** YES. The `race_divisions_enabled` flag already exists in the `seasons` table (added in migration `2025_10_24_131920_add_race_divisions_enabled_to_seasons_table.php`). This flag controls whether the division feature is enabled for a specific season.

### Q2: Can drivers belong to divisions directly?
**Answer:** YES. Drivers should be assigned to divisions via the `season_drivers` table. When divisions are enabled, drivers can be assigned to a specific division within that season.

### Q3: Should there be a relationship between teams and divisions?
**Answer:** NO. Divisions and teams are independent organizational features. A season can have:
- Only teams (`team_championship_enabled=true`, `race_divisions_enabled=false`)
- Only divisions (`team_championship_enabled=false`, `race_divisions_enabled=true`)
- Both teams AND divisions (`team_championship_enabled=true`, `race_divisions_enabled=true`)
- Neither (privateer-only racing)

In a season with both enabled, a driver could belong to both a team AND a division simultaneously.

### Q4: What's the cascade behavior when deleting a division?
**Answer:** Similar to teams:
- `onDelete('set null')`: When a division is deleted, the `division_id` in `season_drivers` is set to NULL
- Drivers remain in the season but are no longer in a division
- No hard cascade deletion of drivers

---

## Step 1: Database Layer

### Migration 1: Create divisions table
**File:** `database/migrations/YYYY_MM_DD_HHMMSS_create_divisions_table.php`

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
        Schema::create('divisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')
                ->constrained('seasons')
                ->onDelete('cascade')
                ->comment('Season this division belongs to');
            $table->string('name', 60)->comment('Division name (2-60 characters, not unique)');
            $table->text('description')->comment('Division description (10-500 characters, required)');
            $table->string('logo_url', 255)->nullable()->comment('Division logo URL/path');
            $table->timestamps();

            // Indexes
            $table->index('season_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('divisions');
    }
};
```

**Notes:**
- Cascade delete: When season is deleted, divisions are automatically deleted
- No unique constraint on name (divisions can have duplicate names within a season)
- `description` is required (validated in domain layer: 10-500 characters)
- `logo_url` stores the full URL path to the uploaded logo

### Migration 2: Add division_id to season_drivers
**File:** `database/migrations/YYYY_MM_DD_HHMMSS_add_division_id_to_season_drivers_table.php`

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
        Schema::table('season_drivers', function (Blueprint $table) {
            $table->foreignId('division_id')
                ->nullable()
                ->after('team_id')
                ->constrained('divisions')
                ->onDelete('set null')
                ->comment('Division this driver is assigned to (null = no division)');

            // Index for queries filtering by division
            $table->index('division_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('season_drivers', function (Blueprint $table) {
            $table->dropForeign(['division_id']);
            $table->dropIndex(['division_id']);
            $table->dropColumn('division_id');
        });
    }
};
```

**Notes:**
- Nullable: Drivers don't need a division
- `onDelete('set null')`: When division is deleted, driver's division_id becomes null
- Added after `team_id` to maintain logical column order

---

## Step 2: Domain Layer

### 2.1 Division Entity
**File:** `app/Domain/Division/Entities/Division.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Division\Entities;

use App\Domain\Division\ValueObjects\DivisionName;
use App\Domain\Division\ValueObjects\DivisionDescription;
use App\Domain\Division\Events\DivisionCreated;
use App\Domain\Division\Events\DivisionUpdated;
use App\Domain\Division\Events\DivisionDeleted;

final class Division
{
    private array $domainEvents = [];

    public function __construct(
        private ?int $id,
        private int $seasonId,
        private DivisionName $name,
        private DivisionDescription $description,
        private ?string $logoUrl,
        private \DateTimeImmutable $createdAt,
        private \DateTimeImmutable $updatedAt,
    ) {}

    public static function create(
        int $seasonId,
        DivisionName $name,
        DivisionDescription $description,
        ?string $logoUrl = null,
    ): self {
        $division = new self(
            id: null,
            seasonId: $seasonId,
            name: $name,
            description: $description,
            logoUrl: $logoUrl,
            createdAt: new \DateTimeImmutable(),
            updatedAt: new \DateTimeImmutable(),
        );

        $division->recordEvent(new DivisionCreated(
            seasonId: $seasonId,
            name: $name->value(),
            description: $description->value(),
            logoUrl: $logoUrl,
        ));

        return $division;
    }

    public function update(
        DivisionName $name,
        DivisionDescription $description,
        ?string $logoUrl
    ): void {
        $this->name = $name;
        $this->description = $description;
        $this->logoUrl = $logoUrl;
        $this->updatedAt = new \DateTimeImmutable();

        $this->recordEvent(new DivisionUpdated(
            divisionId: $this->id,
            name: $name->value(),
            description: $description->value(),
            logoUrl: $logoUrl,
        ));
    }

    public function delete(): void
    {
        $this->recordEvent(new DivisionDeleted(
            divisionId: $this->id,
            seasonId: $this->seasonId,
        ));
    }

    // Getters
    public function id(): ?int { return $this->id; }
    public function seasonId(): int { return $this->seasonId; }
    public function name(): DivisionName { return $this->name; }
    public function description(): DivisionDescription { return $this->description; }
    public function logoUrl(): ?string { return $this->logoUrl; }
    public function createdAt(): \DateTimeImmutable { return $this->createdAt; }
    public function updatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    // Domain Events
    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];
        return $events;
    }

    private function recordEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }
}
```

### 2.2 DivisionName Value Object
**File:** `app/Domain/Division/ValueObjects/DivisionName.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Division\ValueObjects;

use App\Domain\Division\Exceptions\InvalidDivisionNameException;

final readonly class DivisionName
{
    private const MIN_LENGTH = 2;
    private const MAX_LENGTH = 60;

    public function __construct(
        private string $value,
    ) {
        $this->validate();
    }

    public function value(): string
    {
        return $this->value;
    }

    private function validate(): void
    {
        $length = mb_strlen($this->value);

        if ($length < self::MIN_LENGTH) {
            throw InvalidDivisionNameException::tooShort(self::MIN_LENGTH);
        }

        if ($length > self::MAX_LENGTH) {
            throw InvalidDivisionNameException::tooLong(self::MAX_LENGTH);
        }

        if (trim($this->value) === '') {
            throw InvalidDivisionNameException::empty();
        }
    }

    public function equals(DivisionName $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
```

### 2.3 DivisionDescription Value Object
**File:** `app/Domain/Division/ValueObjects/DivisionDescription.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Division\ValueObjects;

use App\Domain\Division\Exceptions\InvalidDivisionDescriptionException;

final readonly class DivisionDescription
{
    private const MIN_LENGTH = 10;
    private const MAX_LENGTH = 500;

    public function __construct(
        private string $value,
    ) {
        $this->validate();
    }

    public function value(): string
    {
        return $this->value;
    }

    private function validate(): void
    {
        $length = mb_strlen($this->value);

        if ($length < self::MIN_LENGTH) {
            throw InvalidDivisionDescriptionException::tooShort(self::MIN_LENGTH);
        }

        if ($length > self::MAX_LENGTH) {
            throw InvalidDivisionDescriptionException::tooLong(self::MAX_LENGTH);
        }

        if (trim($this->value) === '') {
            throw InvalidDivisionDescriptionException::empty();
        }
    }

    public function equals(DivisionDescription $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
```

### 2.4 Domain Events
**File:** `app/Domain/Division/Events/DivisionCreated.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Division\Events;

final readonly class DivisionCreated
{
    public function __construct(
        public int $seasonId,
        public string $name,
        public string $description,
        public ?string $logoUrl,
    ) {}
}
```

**File:** `app/Domain/Division/Events/DivisionUpdated.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Division\Events;

final readonly class DivisionUpdated
{
    public function __construct(
        public ?int $divisionId,
        public string $name,
        public string $description,
        public ?string $logoUrl,
    ) {}
}
```

**File:** `app/Domain/Division/Events/DivisionDeleted.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Division\Events;

final readonly class DivisionDeleted
{
    public function __construct(
        public ?int $divisionId,
        public int $seasonId,
    ) {}
}
```

### 2.5 Domain Exceptions
**File:** `app/Domain/Division/Exceptions/DivisionNotFoundException.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain/Division/Exceptions;

use Exception;

final class DivisionNotFoundException extends Exception
{
    public static function withId(int $divisionId): self
    {
        return new self("Division with ID {$divisionId} not found.");
    }
}
```

**File:** `app/Domain/Division/Exceptions/InvalidDivisionNameException.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Division\Exceptions;

use Exception;

final class InvalidDivisionNameException extends Exception
{
    public static function tooShort(int $minLength): self
    {
        return new self("Division name must be at least {$minLength} characters.");
    }

    public static function tooLong(int $maxLength): self
    {
        return new self("Division name cannot exceed {$maxLength} characters.");
    }

    public static function empty(): self
    {
        return new self("Division name cannot be empty.");
    }
}
```

**File:** `app/Domain/Division/Exceptions/InvalidDivisionDescriptionException.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Division\Exceptions;

use Exception;

final class InvalidDivisionDescriptionException extends Exception
{
    public static function tooShort(int $minLength): self
    {
        return new self("Division description must be at least {$minLength} characters.");
    }

    public static function tooLong(int $maxLength): self
    {
        return new self("Division description cannot exceed {$maxLength} characters.");
    }

    public static function empty(): self
    {
        return new self("Division description cannot be empty.");
    }
}
```

### 2.6 Repository Interface
**File:** `app/Domain/Division/Repositories/DivisionRepositoryInterface.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Division\Repositories;

use App\Domain\Division\Entities\Division;

interface DivisionRepositoryInterface
{
    /**
     * Find a division by ID
     */
    public function findById(int $id): ?Division;

    /**
     * Get all divisions for a season
     * @return Division[]
     */
    public function findBySeasonId(int $seasonId): array;

    /**
     * Count drivers assigned to a division
     */
    public function countDriversByDivisionId(int $divisionId): int;

    /**
     * Save (create or update) a division
     */
    public function save(Division $division): Division;

    /**
     * Delete a division (hard delete)
     */
    public function delete(int $id): void;
}
```

---

## Step 3: Application Layer

### 3.1 DTOs
**File:** `app/Application/Division/DTOs/DivisionData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Division\DTOs;

use Spatie\LaravelData\Data;

final class DivisionData extends Data
{
    public function __construct(
        public int $id,
        public int $season_id,
        public string $name,
        public string $description,
        public ?string $logo_url,
        public string $created_at,
        public string $updated_at,
    ) {}
}
```

**File:** `app/Application/Division/DTOs/CreateDivisionData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Division\DTOs;

use Spatie\LaravelData\Data;
use Illuminate\Http\UploadedFile;

final class CreateDivisionData extends Data
{
    public function __construct(
        public string $name,
        public string $description,
        public ?UploadedFile $logo = null,
    ) {}
}
```

**File:** `app/Application/Division/DTOs/UpdateDivisionData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Division\DTOs;

use Spatie\LaravelData\Data;
use Illuminate\Http\UploadedFile;

final class UpdateDivisionData extends Data
{
    public function __construct(
        public string $name,
        public string $description,
        public ?UploadedFile $logo = null,
        public bool $remove_logo = false,
    ) {}
}
```

### 3.2 Application Service
**File:** `app/Application/Division/Services/DivisionApplicationService.php`

[See full implementation in the agent output - including all methods: getDivisionsBySeasonId, getDivisionById, createDivision, updateDivision, deleteDivision, getDriverCount, uploadLogo, deleteLogo]

---

## Step 4: Infrastructure Layer

### 4.1 Eloquent Model
**File:** `app/Infrastructure/Persistence/Eloquent/Models/Division.php`

[See full implementation in agent output]

### 4.2 Repository Implementation
**File:** `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentDivisionRepository.php`

[See full implementation in agent output]

### 4.3 Service Provider Registration
**File:** `app/Providers/AppServiceProvider.php` (update)

Add to the `register()` method:

```php
use App\Domain\Division\Repositories\DivisionRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentDivisionRepository;

$this->app->bind(DivisionRepositoryInterface::class, EloquentDivisionRepository::class);
```

---

## Step 5: Interface Layer (HTTP)

### 5.1 Form Requests
[See CreateDivisionRequest, UpdateDivisionRequest, AssignDriverDivisionRequest in agent output]

### 5.2 Controller
**File:** `app/Http/Controllers/User/DivisionController.php`

[See full implementation in agent output]

### 5.3 SeasonDriverController Update
**File:** `app/Http/Controllers/User/SeasonDriverController.php` (add method)

[See assignDivision method in agent output]

---

## Step 6: Routes

**File:** `routes/subdomain.php` (add to user subdomain group)

[See routing configuration in agent output]

---

## Step 7: Update SeasonDriver Models/DTOs

[See updates in agent output]

---

## Step 8: Testing

[See test files structure in agent output]

---

## Step 9: Run Migrations

```bash
php artisan migrate
```

---

## Implementation Checklist

### Database
- [ ] Create divisions table migration (with description field)
- [ ] Add division_id to season_drivers migration
- [ ] Run migrations

### Domain Layer
- [ ] Division entity
- [ ] DivisionName value object (2-60 chars)
- [ ] DivisionDescription value object (10-500 chars, required)
- [ ] Domain events (Created, Updated, Deleted)
- [ ] Domain exceptions (including InvalidDivisionDescriptionException)
- [ ] Repository interface

### Application Layer
- [ ] DTOs (DivisionData, CreateDivisionData, UpdateDivisionData with description)
- [ ] DivisionApplicationService

### Infrastructure Layer
- [ ] Division Eloquent model (with description field)
- [ ] EloquentDivisionRepository
- [ ] Register repository binding in AppServiceProvider

### Interface Layer
- [ ] Form requests (Create, Update, AssignDivision with description validation)
- [ ] DivisionController
- [ ] Update SeasonDriverController (assignDivision method)
- [ ] Add routes to subdomain.php

### Updates
- [ ] Update SeasonDriverEloquent model (division relationship)
- [ ] Update SeasonDriverData DTO (division fields including description)
- [ ] Update SeasonDriverApplicationService (include division in queries)

### Testing
- [ ] Domain layer unit tests (Division entity, value objects)
- [ ] Value object tests (DivisionName and DivisionDescription)
- [ ] Application service tests
- [ ] Feature tests for all endpoints
- [ ] Test logo upload/deletion
- [ ] Test division deletion cascade behavior
- [ ] Test description validation (required, 10-500 chars)

---

## Notes

1. **File Storage**: Division logos stored in `storage/app/public/divisions/season-{id}/`
2. **Hard Delete**: Divisions are permanently deleted (no soft delete, matching Teams pattern)
3. **Cascade Behavior**: Database handles setting division_id to null on division deletion
4. **Authorization**: All routes protected by `auth:web` and `user.authenticate` middleware
5. **Validation**:
   - DivisionName value object enforces 2-60 character limit
   - DivisionDescription value object enforces 10-500 character limit (REQUIRED)
6. **Image Validation**: Max 2MB, JPG/PNG/SVG only
7. **Season Setting**: Divisions feature controlled by `race_divisions_enabled` flag in seasons table
8. **Independence**: Divisions and Teams are independent - a season can have both, one, or neither
9. **Driver Assignment**: Drivers can belong to both a team AND a division simultaneously

## Architectural Consistency with Teams

This implementation follows the exact same patterns as the Teams feature:
- Same DDD layer structure (Domain → Application → Infrastructure → Interface)
- Same naming conventions and file organization
- Same transaction handling and logo management
- Same cascade deletion behavior (set to null, not hard delete drivers)
- Same validation and exception handling patterns
- Same testing approach

**Key Difference**: Divisions have an additional required `description` field (10-500 characters) enforced via the `DivisionDescription` value object.

## Dependencies

No new Composer packages required. Uses existing:
- spatie/laravel-data (DTOs)
- Laravel Storage (file uploads)
- Laravel Validation (form requests)

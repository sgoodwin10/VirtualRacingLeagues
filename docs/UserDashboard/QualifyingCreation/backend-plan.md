# Backend Implementation Plan: Qualifier Support

## Table of Contents
1. [Overview](#overview)
2. [Database Schema Changes](#database-schema-changes)
3. [Domain Layer Implementation](#domain-layer-implementation)
4. [Application Layer Implementation](#application-layer-implementation)
5. [Infrastructure Layer Implementation](#infrastructure-layer-implementation)
6. [Interface Layer Implementation](#interface-layer-implementation)
7. [Business Rules](#business-rules)
8. [Field Mapping: Races vs Qualifiers](#field-mapping-races-vs-qualifiers)
9. [Validation Strategy](#validation-strategy)
10. [Testing Strategy](#testing-strategy)
11. [Implementation Steps](#implementation-steps)
12. [Code Examples](#code-examples)

---

## Overview

### Architecture Approach

This implementation follows **Domain-Driven Design (DDD)** principles and leverages the existing `races` table infrastructure with a **discriminator pattern** using the `is_qualifier` boolean flag.

**Key Design Decisions:**

1. **Single Table Strategy**: Both races and qualifiers share the `races` table
2. **Discriminator Column**: `is_qualifier` boolean distinguishes between race and qualifier records
3. **Shared Entity**: Reuse the existing `Race` entity with business logic to enforce qualifier constraints
4. **Nullable Fields**: Race-specific fields (race_number, race_type, grid_source, etc.) are nullable for qualifiers
5. **Constrained Business Logic**: Entity methods validate that qualifier-specific rules are enforced
6. **Repository Pattern**: Add qualifier-specific query methods to the existing `RaceRepository`
7. **Separate Application Services**: Create `QualifierApplicationService` for qualifier-specific orchestration
8. **Dedicated DTOs**: Create qualifier-specific DTOs for clearer API contracts

### Why This Approach?

- **Minimal Schema Changes**: Leverages existing infrastructure
- **Type Safety**: Qualifier-specific DTOs prevent invalid data from entering the system
- **Clear Boundaries**: Separate application services maintain clear use case boundaries
- **Flexibility**: Easy to add qualifier-specific features in the future
- **Performance**: No joins required, single-table queries are fast
- **Consistency**: One entity to maintain, business rules in one place

---

## Database Schema Changes

### Migration: Add `is_qualifier` Column

**File**: `database/migrations/2025_10_26_000001_add_is_qualifier_to_races_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('races', function (Blueprint $table) {
            // Add discriminator column
            $table->boolean('is_qualifier')->default(false)->after('round_id');

            // Add index for efficient queries
            $table->index(['round_id', 'is_qualifier']);
        });

        // Update existing records to be races (not qualifiers)
        DB::table('races')->update(['is_qualifier' => false]);

        // Make race-specific columns nullable (they're already nullable except race_number)
        Schema::table('races', function (Blueprint $table) {
            $table->integer('race_number')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('races', function (Blueprint $table) {
            $table->dropIndex(['round_id', 'is_qualifier']);
            $table->dropColumn('is_qualifier');
            $table->integer('race_number')->nullable(false)->change();
        });
    }
};
```

### Schema Constraints & Validation Rules

**Database-Level Constraints:**

1. **One Qualifier Per Round**: Enforced at application layer (repository checks before insert)
2. **Race Number Constraint**: `race_number` is nullable (NULL for qualifiers, required for races)
3. **Grid Source Constraint**: Not applicable for qualifiers (will be NULL)
4. **Points System**: Required for both but qualifiers only use pole position bonus

**Indexes:**

- `['round_id', 'is_qualifier']` - Efficient lookup for qualifiers by round
- Existing `['round_id', 'race_number']` - Still useful for races

---

## Domain Layer Implementation

### 1. Value Objects

No new Value Objects are required. We reuse existing ones:
- `QualifyingFormat` (already exists)
- `PointsSystem` (already exists)
- `RaceName` (optional, for qualifier sessions)

### 2. Domain Entity: Race (Enhanced)

**File**: `app/Domain/Competition/Entities/Race.php`

**Changes Required:**

Add the `is_qualifier` property and factory methods for qualifiers:

```php
final class Race
{
    private array $events = [];

    private function __construct(
        private ?int $id,
        private int $roundId,
        private bool $isQualifier,  // NEW
        private ?int $raceNumber,   // Now nullable
        private ?RaceName $name,
        private ?RaceType $type,    // NULL for qualifiers
        // ... rest of properties remain the same
    ) {}

    // NEW: Factory method for creating a qualifier
    public static function createQualifier(
        int $roundId,
        ?RaceName $name,
        QualifyingFormat $qualifyingFormat,
        int $qualifyingLength,
        ?string $qualifyingTire,
        ?string $weather,
        ?string $tireRestrictions,
        ?string $fuelUsage,
        ?string $damageModel,
        bool $trackLimitsEnforced,
        bool $falseStartDetection,
        bool $collisionPenalties,
        ?string $assistsRestrictions,
        bool $raceDivisions,
        ?array $bonusPoints, // Only pole position
        ?string $raceNotes,
    ): self {
        // Validate qualifier-specific rules
        if ($qualifyingFormat === QualifyingFormat::NONE) {
            throw new InvalidArgumentException('Qualifier must have a qualifying format');
        }

        if ($qualifyingLength < 1) {
            throw new InvalidArgumentException('Qualifier length must be at least 1 minute');
        }

        // Validate bonus points only contains pole position
        if ($bonusPoints !== null && array_diff(array_keys($bonusPoints), ['pole']) !== []) {
            throw new InvalidArgumentException('Qualifiers can only have pole position bonus');
        }

        $now = new DateTimeImmutable();

        $qualifier = new self(
            id: null,
            roundId: $roundId,
            isQualifier: true,
            raceNumber: null,  // Qualifiers don't have race numbers
            name: $name,
            type: null,  // Qualifiers don't have race types
            qualifyingFormat: $qualifyingFormat,
            qualifyingLength: $qualifyingLength,
            qualifyingTire: $qualifyingTire,
            gridSource: GridSource::QUALIFYING,  // Not used but required
            gridSourceRaceId: null,
            lengthType: RaceLengthType::TIME,  // Qualifiers always use time
            lengthValue: $qualifyingLength,  // Same as qualifying length
            extraLapAfterTime: false,  // Not applicable
            weather: $weather,
            tireRestrictions: $tireRestrictions,
            fuelUsage: $fuelUsage,
            damageModel: $damageModel,
            trackLimitsEnforced: $trackLimitsEnforced,
            falseStartDetection: $falseStartDetection,
            collisionPenalties: $collisionPenalties,
            mandatoryPitStop: false,  // Qualifiers don't have pit stops
            minimumPitTime: null,
            assistsRestrictions: $assistsRestrictions,
            raceDivisions: $raceDivisions,
            pointsSystem: PointsSystem::from([]),  // No position points
            bonusPoints: $bonusPoints,
            dnfPoints: 0,
            dnsPoints: 0,
            raceNotes: $raceNotes,
            createdAt: $now,
            updatedAt: $now,
        );

        $qualifier->events[] = new QualifierCreated(
            qualifierId: 0,
            roundId: $roundId,
            name: $name?->value(),
            occurredAt: $now,
        );

        return $qualifier;
    }

    // NEW: Update method for qualifiers
    public function updateQualifierConfiguration(
        ?RaceName $name,
        QualifyingFormat $qualifyingFormat,
        int $qualifyingLength,
        ?string $qualifyingTire,
        ?string $weather,
        ?string $tireRestrictions,
        ?string $fuelUsage,
        ?string $damageModel,
        bool $trackLimitsEnforced,
        bool $falseStartDetection,
        bool $collisionPenalties,
        ?string $assistsRestrictions,
        bool $raceDivisions,
        ?array $bonusPoints,
        ?string $raceNotes,
    ): void {
        if (!$this->isQualifier) {
            throw new InvalidOperationException('Cannot update race as qualifier');
        }

        // Validate qualifier-specific rules
        if ($qualifyingFormat === QualifyingFormat::NONE) {
            throw new InvalidArgumentException('Qualifier must have a qualifying format');
        }

        if ($qualifyingLength < 1) {
            throw new InvalidArgumentException('Qualifier length must be at least 1 minute');
        }

        // Validate bonus points only contains pole position
        if ($bonusPoints !== null && array_diff(array_keys($bonusPoints), ['pole']) !== []) {
            throw new InvalidArgumentException('Qualifiers can only have pole position bonus');
        }

        $hasChanges = false;

        if ($name !== null && !$this->name?->equals($name)) {
            $this->name = $name;
            $hasChanges = true;
        }

        if ($this->qualifyingFormat !== $qualifyingFormat) {
            $this->qualifyingFormat = $qualifyingFormat;
            $this->lengthValue = $qualifyingLength;  // Keep in sync
            $hasChanges = true;
        }

        if ($this->qualifyingLength !== $qualifyingLength) {
            $this->qualifyingLength = $qualifyingLength;
            $this->lengthValue = $qualifyingLength;  // Keep in sync
            $hasChanges = true;
        }

        if ($this->qualifyingTire !== $qualifyingTire) {
            $this->qualifyingTire = $qualifyingTire;
            $hasChanges = true;
        }

        if ($this->weather !== $weather) {
            $this->weather = $weather;
            $hasChanges = true;
        }

        if ($this->tireRestrictions !== $tireRestrictions) {
            $this->tireRestrictions = $tireRestrictions;
            $hasChanges = true;
        }

        if ($this->fuelUsage !== $fuelUsage) {
            $this->fuelUsage = $fuelUsage;
            $hasChanges = true;
        }

        if ($this->damageModel !== $damageModel) {
            $this->damageModel = $damageModel;
            $hasChanges = true;
        }

        if ($this->trackLimitsEnforced !== $trackLimitsEnforced) {
            $this->trackLimitsEnforced = $trackLimitsEnforced;
            $hasChanges = true;
        }

        if ($this->falseStartDetection !== $falseStartDetection) {
            $this->falseStartDetection = $falseStartDetection;
            $hasChanges = true;
        }

        if ($this->collisionPenalties !== $collisionPenalties) {
            $this->collisionPenalties = $collisionPenalties;
            $hasChanges = true;
        }

        if ($this->assistsRestrictions !== $assistsRestrictions) {
            $this->assistsRestrictions = $assistsRestrictions;
            $hasChanges = true;
        }

        if ($this->raceDivisions !== $raceDivisions) {
            $this->raceDivisions = $raceDivisions;
            $hasChanges = true;
        }

        if ($this->bonusPoints !== $bonusPoints) {
            $this->bonusPoints = $bonusPoints;
            $hasChanges = true;
        }

        if ($this->raceNotes !== $raceNotes) {
            $this->raceNotes = $raceNotes;
            $hasChanges = true;
        }

        if ($hasChanges) {
            $this->updatedAt = new DateTimeImmutable();
            $this->events[] = new QualifierUpdated(
                qualifierId: $this->id ?? 0,
                roundId: $this->roundId,
                occurredAt: $this->updatedAt,
            );
        }
    }

    // NEW: Getter for isQualifier
    public function isQualifier(): bool
    {
        return $this->isQualifier;
    }

    // UPDATED: Reconstitute method now includes isQualifier
    public static function reconstitute(
        int $id,
        int $roundId,
        bool $isQualifier,  // NEW
        ?int $raceNumber,   // Now nullable
        // ... rest of parameters
    ): self {
        return new self(
            id: $id,
            roundId: $roundId,
            isQualifier: $isQualifier,
            raceNumber: $raceNumber,
            // ... rest of parameters
        );
    }
}
```

### 3. Domain Events

**File**: `app/Domain/Competition/Events/QualifierCreated.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

use DateTimeImmutable;

final readonly class QualifierCreated
{
    public function __construct(
        public int $qualifierId,
        public int $roundId,
        public ?string $name,
        public DateTimeImmutable $occurredAt,
    ) {
    }
}
```

**File**: `app/Domain/Competition/Events/QualifierUpdated.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

use DateTimeImmutable;

final readonly class QualifierUpdated
{
    public function __construct(
        public int $qualifierId,
        public int $roundId,
        public DateTimeImmutable $occurredAt,
    ) {
    }
}
```

**File**: `app/Domain/Competition/Events/QualifierDeleted.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

use DateTimeImmutable;

final readonly class QualifierDeleted
{
    public function __construct(
        public int $qualifierId,
        public int $roundId,
        public DateTimeImmutable $occurredAt,
    ) {
    }
}
```

### 4. Domain Exceptions

**File**: `app/Domain/Competition/Exceptions/QualifierNotFoundException.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

final class QualifierNotFoundException extends DomainException
{
    public static function withId(int $id): self
    {
        return new self("Qualifier with ID {$id} not found");
    }

    public static function forRound(int $roundId): self
    {
        return new self("Qualifier for round {$roundId} not found");
    }
}
```

**File**: `app/Domain/Competition/Exceptions/QualifierAlreadyExistsException.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

final class QualifierAlreadyExistsException extends DomainException
{
    public static function forRound(int $roundId): self
    {
        return new self("A qualifier already exists for round {$roundId}. Only one qualifier is allowed per round.");
    }
}
```

**File**: `app/Domain/Competition/Exceptions/InvalidOperationException.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

final class InvalidOperationException extends DomainException
{
    // Generic exception for invalid operations (e.g., updating race as qualifier)
}
```

---

## Application Layer Implementation

### 1. DTOs

**File**: `app/Application/Competition/DTOs/CreateQualifierData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;

final class CreateQualifierData extends Data
{
    public function __construct(
        // Basic
        #[Nullable, StringType, Between(3, 100)]
        public ?string $name,

        // Qualifying Configuration
        #[Required, StringType, In(['standard', 'time_trial', 'previous_race'])]
        public string $qualifying_format,

        #[Required, IntegerType, Min(1)]
        public int $qualifying_length,

        #[Nullable, StringType, Max(50)]
        public ?string $qualifying_tire,

        // Platform Settings
        #[Nullable, StringType, Max(100)]
        public ?string $weather,

        #[Nullable, StringType, Max(100)]
        public ?string $tire_restrictions,

        #[Nullable, StringType, Max(100)]
        public ?string $fuel_usage,

        #[Nullable, StringType, Max(100)]
        public ?string $damage_model,

        // Penalties & Rules
        #[Required, BooleanType]
        public bool $track_limits_enforced,

        #[Required, BooleanType]
        public bool $false_start_detection,

        #[Required, BooleanType]
        public bool $collision_penalties,

        #[Nullable, StringType]
        public ?string $assists_restrictions,

        // Division Support
        #[Required, BooleanType]
        public bool $race_divisions,

        // Bonus Points (ONLY pole position allowed)
        #[Nullable, ArrayType]
        public ?array $bonus_points,

        // Notes
        #[Nullable, StringType]
        public ?string $race_notes,
    ) {
    }
}
```

**File**: `app/Application/Competition/DTOs/UpdateQualifierData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

final class UpdateQualifierData extends Data
{
    public function __construct(
        // Basic
        #[Nullable, StringType, Between(3, 100)]
        public string|Optional|null $name,

        // Qualifying Configuration
        #[Nullable, StringType, In(['standard', 'time_trial', 'previous_race'])]
        public string|Optional|null $qualifying_format,

        #[Nullable, IntegerType, Min(1)]
        public int|Optional|null $qualifying_length,

        #[Nullable, StringType, Max(50)]
        public string|Optional|null $qualifying_tire,

        // Platform Settings
        #[Nullable, StringType, Max(100)]
        public string|Optional|null $weather,

        #[Nullable, StringType, Max(100)]
        public string|Optional|null $tire_restrictions,

        #[Nullable, StringType, Max(100)]
        public string|Optional|null $fuel_usage,

        #[Nullable, StringType, Max(100)]
        public string|Optional|null $damage_model,

        // Penalties & Rules
        #[Nullable, BooleanType]
        public bool|Optional|null $track_limits_enforced,

        #[Nullable, BooleanType]
        public bool|Optional|null $false_start_detection,

        #[Nullable, BooleanType]
        public bool|Optional|null $collision_penalties,

        #[Nullable, StringType]
        public string|Optional|null $assists_restrictions,

        // Division Support
        #[Nullable, BooleanType]
        public bool|Optional|null $race_divisions,

        // Bonus Points
        #[Nullable, ArrayType]
        public array|Optional|null $bonus_points,

        // Notes
        #[Nullable, StringType]
        public string|Optional|null $race_notes,
    ) {
    }
}
```

**File**: `app/Application/Competition/DTOs/QualifierData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use App\Domain\Competition\Entities\Race;
use Spatie\LaravelData\Data;

final class QualifierData extends Data
{
    public function __construct(
        public int $id,
        public int $round_id,
        public ?string $name,

        // Qualifying Configuration
        public string $qualifying_format,
        public int $qualifying_length,
        public ?string $qualifying_tire,

        // Platform Settings
        public ?string $weather,
        public ?string $tire_restrictions,
        public ?string $fuel_usage,
        public ?string $damage_model,

        // Penalties & Rules
        public bool $track_limits_enforced,
        public bool $false_start_detection,
        public bool $collision_penalties,
        public ?string $assists_restrictions,

        // Division Support
        public bool $race_divisions,

        // Bonus Points
        public ?array $bonus_points,

        // Notes
        public ?string $race_notes,

        // Timestamps
        public string $created_at,
        public string $updated_at,
    ) {
    }

    public static function fromEntity(Race $qualifier): self
    {
        if (!$qualifier->isQualifier()) {
            throw new \InvalidArgumentException('Entity must be a qualifier');
        }

        return new self(
            id: $qualifier->id() ?? 0,
            round_id: $qualifier->roundId(),
            name: $qualifier->name()?->value(),
            qualifying_format: $qualifier->qualifyingFormat()->value,
            qualifying_length: $qualifier->qualifyingLength() ?? 0,
            qualifying_tire: $qualifier->qualifyingTire(),
            weather: $qualifier->weather(),
            tire_restrictions: $qualifier->tireRestrictions(),
            fuel_usage: $qualifier->fuelUsage(),
            damage_model: $qualifier->damageModel(),
            track_limits_enforced: $qualifier->trackLimitsEnforced(),
            false_start_detection: $qualifier->falseStartDetection(),
            collision_penalties: $qualifier->collisionPenalties(),
            assists_restrictions: $qualifier->assistsRestrictions(),
            race_divisions: $qualifier->raceDivisions(),
            bonus_points: $qualifier->bonusPoints(),
            race_notes: $qualifier->raceNotes(),
            created_at: $qualifier->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $qualifier->updatedAt()->format('Y-m-d H:i:s'),
        );
    }
}
```

### 2. Application Service

**File**: `app/Application/Competition/Services/QualifierApplicationService.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Competition\DTOs\CreateQualifierData;
use App\Application\Competition\DTOs\QualifierData;
use App\Application\Competition\DTOs\UpdateQualifierData;
use App\Domain\Competition\Entities\Race;
use App\Domain\Competition\Exceptions\QualifierAlreadyExistsException;
use App\Domain\Competition\Exceptions\QualifierNotFoundException;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\ValueObjects\QualifyingFormat;
use App\Domain\Competition\ValueObjects\RaceName;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Spatie\LaravelData\Optional;

final class QualifierApplicationService
{
    public function __construct(
        private readonly RaceRepositoryInterface $raceRepository,
    ) {
    }

    public function createQualifier(CreateQualifierData $data, int $roundId): QualifierData
    {
        return DB::transaction(function () use ($data, $roundId) {
            // Business rule: Only one qualifier per round
            if ($this->raceRepository->qualifierExistsForRound($roundId)) {
                throw QualifierAlreadyExistsException::forRound($roundId);
            }

            $qualifier = Race::createQualifier(
                roundId: $roundId,
                name: $data->name !== null ? RaceName::from($data->name) : null,
                qualifyingFormat: QualifyingFormat::from($data->qualifying_format),
                qualifyingLength: $data->qualifying_length,
                qualifyingTire: $data->qualifying_tire,
                weather: $data->weather,
                tireRestrictions: $data->tire_restrictions,
                fuelUsage: $data->fuel_usage,
                damageModel: $data->damage_model,
                trackLimitsEnforced: $data->track_limits_enforced,
                falseStartDetection: $data->false_start_detection,
                collisionPenalties: $data->collision_penalties,
                assistsRestrictions: $data->assists_restrictions,
                raceDivisions: $data->race_divisions,
                bonusPoints: $data->bonus_points,
                raceNotes: $data->race_notes,
            );

            $this->raceRepository->save($qualifier);
            $this->dispatchEvents($qualifier);

            return QualifierData::fromEntity($qualifier);
        });
    }

    public function updateQualifier(int $qualifierId, UpdateQualifierData $data): QualifierData
    {
        return DB::transaction(function () use ($qualifierId, $data) {
            $qualifier = $this->raceRepository->findQualifierById($qualifierId);

            // Get current values for fields not being updated
            $name = !($data->name instanceof Optional)
                ? ($data->name !== null ? RaceName::from($data->name) : null)
                : $qualifier->name();

            $qualifyingFormat = !($data->qualifying_format instanceof Optional)
                ? ($data->qualifying_format !== null ? QualifyingFormat::from($data->qualifying_format) : $qualifier->qualifyingFormat())
                : $qualifier->qualifyingFormat();

            $qualifyingLength = !($data->qualifying_length instanceof Optional)
                ? ($data->qualifying_length ?? $qualifier->qualifyingLength())
                : $qualifier->qualifyingLength();

            $qualifyingTire = !($data->qualifying_tire instanceof Optional)
                ? $data->qualifying_tire
                : $qualifier->qualifyingTire();

            $weather = !($data->weather instanceof Optional)
                ? $data->weather
                : $qualifier->weather();

            $tireRestrictions = !($data->tire_restrictions instanceof Optional)
                ? $data->tire_restrictions
                : $qualifier->tireRestrictions();

            $fuelUsage = !($data->fuel_usage instanceof Optional)
                ? $data->fuel_usage
                : $qualifier->fuelUsage();

            $damageModel = !($data->damage_model instanceof Optional)
                ? $data->damage_model
                : $qualifier->damageModel();

            $trackLimitsEnforced = !($data->track_limits_enforced instanceof Optional)
                ? ($data->track_limits_enforced ?? $qualifier->trackLimitsEnforced())
                : $qualifier->trackLimitsEnforced();

            $falseStartDetection = !($data->false_start_detection instanceof Optional)
                ? ($data->false_start_detection ?? $qualifier->falseStartDetection())
                : $qualifier->falseStartDetection();

            $collisionPenalties = !($data->collision_penalties instanceof Optional)
                ? ($data->collision_penalties ?? $qualifier->collisionPenalties())
                : $qualifier->collisionPenalties();

            $assistsRestrictions = !($data->assists_restrictions instanceof Optional)
                ? $data->assists_restrictions
                : $qualifier->assistsRestrictions();

            $raceDivisions = !($data->race_divisions instanceof Optional)
                ? ($data->race_divisions ?? $qualifier->raceDivisions())
                : $qualifier->raceDivisions();

            $bonusPoints = !($data->bonus_points instanceof Optional)
                ? $data->bonus_points
                : $qualifier->bonusPoints();

            $raceNotes = !($data->race_notes instanceof Optional)
                ? $data->race_notes
                : $qualifier->raceNotes();

            $qualifier->updateQualifierConfiguration(
                name: $name,
                qualifyingFormat: $qualifyingFormat,
                qualifyingLength: $qualifyingLength ?? 0,
                qualifyingTire: $qualifyingTire,
                weather: $weather,
                tireRestrictions: $tireRestrictions,
                fuelUsage: $fuelUsage,
                damageModel: $damageModel,
                trackLimitsEnforced: $trackLimitsEnforced,
                falseStartDetection: $falseStartDetection,
                collisionPenalties: $collisionPenalties,
                assistsRestrictions: $assistsRestrictions,
                raceDivisions: $raceDivisions,
                bonusPoints: $bonusPoints,
                raceNotes: $raceNotes,
            );

            $this->raceRepository->save($qualifier);
            $this->dispatchEvents($qualifier);

            return QualifierData::fromEntity($qualifier);
        });
    }

    public function getQualifier(int $qualifierId): QualifierData
    {
        $qualifier = $this->raceRepository->findQualifierById($qualifierId);
        return QualifierData::fromEntity($qualifier);
    }

    public function getQualifierByRound(int $roundId): ?QualifierData
    {
        $qualifier = $this->raceRepository->findQualifierByRoundId($roundId);

        if ($qualifier === null) {
            return null;
        }

        return QualifierData::fromEntity($qualifier);
    }

    public function deleteQualifier(int $qualifierId): void
    {
        DB::transaction(function () use ($qualifierId) {
            $qualifier = $this->raceRepository->findQualifierById($qualifierId);
            $this->raceRepository->delete($qualifier);

            // Dispatch deletion event
            Event::dispatch(new \App\Domain\Competition\Events\QualifierDeleted(
                qualifierId: $qualifierId,
                roundId: $qualifier->roundId(),
                occurredAt: new \DateTimeImmutable(),
            ));
        });
    }

    private function dispatchEvents(Race $qualifier): void
    {
        $events = $qualifier->releaseEvents();
        foreach ($events as $event) {
            Event::dispatch($event);
        }
    }
}
```

---

## Infrastructure Layer Implementation

### 1. Repository Interface Updates

**File**: `app/Domain/Competition/Repositories/RaceRepositoryInterface.php`

Add qualifier-specific methods:

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Repositories;

use App\Domain\Competition\Entities\Race;

interface RaceRepositoryInterface
{
    // Existing methods
    public function save(Race $race): void;
    public function findById(int $id): Race;
    public function findByRoundId(int $roundId): array;
    public function delete(Race $race): void;
    public function getNextRaceNumber(int $roundId): int;
    public function exists(int $id): bool;

    // NEW: Qualifier-specific methods
    public function findQualifierById(int $id): Race;
    public function findQualifierByRoundId(int $roundId): ?Race;
    public function qualifierExistsForRound(int $roundId): bool;
}
```

### 2. Eloquent Model Updates

**File**: `app/Infrastructure/Persistence/Eloquent/Models/Race.php`

Add `is_qualifier` to fillable and casts:

```php
final class Race extends Model
{
    protected $fillable = [
        'round_id',
        'is_qualifier',  // NEW
        'race_number',
        // ... rest of fillable fields
    ];

    protected $casts = [
        'is_qualifier' => 'boolean',  // NEW
        'race_number' => 'integer',
        // ... rest of casts
    ];

    // NEW: Query scopes
    public function scopeQualifiers($query)
    {
        return $query->where('is_qualifier', true);
    }

    public function scopeRaces($query)
    {
        return $query->where('is_qualifier', false);
    }
}
```

### 3. Repository Implementation Updates

**File**: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentRaceRepository.php`

Add qualifier-specific methods and update existing methods:

```php
final class EloquentRaceRepository implements RaceRepositoryInterface
{
    // UPDATED: Fill eloquent model now includes is_qualifier
    private function fillEloquentModel(RaceEloquent $model, RaceEntity $race): void
    {
        $model->round_id = $race->roundId();
        $model->is_qualifier = $race->isQualifier();  // NEW
        $model->race_number = $race->raceNumber();
        // ... rest of fields
    }

    // UPDATED: To domain entity now includes is_qualifier
    private function toDomainEntity(RaceEloquent $model): RaceEntity
    {
        return RaceEntity::reconstitute(
            id: $model->id,
            roundId: $model->round_id,
            isQualifier: $model->is_qualifier,  // NEW
            raceNumber: $model->race_number,
            // ... rest of fields
        );
    }

    // UPDATED: findByRoundId now excludes qualifiers
    public function findByRoundId(int $roundId): array
    {
        $eloquentModels = RaceEloquent::where('round_id', $roundId)
            ->where('is_qualifier', false)  // NEW: Exclude qualifiers
            ->orderBy('race_number')
            ->get();

        return $eloquentModels->map(fn(RaceEloquent $model) => $this->toDomainEntity($model))
            ->all();
    }

    // NEW: Find qualifier by ID
    public function findQualifierById(int $id): RaceEntity
    {
        $eloquentModel = RaceEloquent::where('id', $id)
            ->where('is_qualifier', true)
            ->first();

        if ($eloquentModel === null) {
            throw QualifierNotFoundException::withId($id);
        }

        return $this->toDomainEntity($eloquentModel);
    }

    // NEW: Find qualifier by round ID
    public function findQualifierByRoundId(int $roundId): ?RaceEntity
    {
        $eloquentModel = RaceEloquent::where('round_id', $roundId)
            ->where('is_qualifier', true)
            ->first();

        if ($eloquentModel === null) {
            return null;
        }

        return $this->toDomainEntity($eloquentModel);
    }

    // NEW: Check if qualifier exists for round
    public function qualifierExistsForRound(int $roundId): bool
    {
        return RaceEloquent::where('round_id', $roundId)
            ->where('is_qualifier', true)
            ->exists();
    }
}
```

---

## Interface Layer Implementation

### 1. Controller

**File**: `app/Http/Controllers/User/QualifierController.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\CreateQualifierData;
use App\Application\Competition\DTOs\UpdateQualifierData;
use App\Application\Competition\Services\QualifierApplicationService;
use App\Domain\Competition\Exceptions\QualifierAlreadyExistsException;
use App\Domain\Competition\Exceptions\QualifierNotFoundException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class QualifierController extends Controller
{
    public function __construct(
        private readonly QualifierApplicationService $qualifierService,
    ) {
    }

    public function show(int $roundId): JsonResponse
    {
        try {
            $qualifier = $this->qualifierService->getQualifierByRound($roundId);

            if ($qualifier === null) {
                return ApiResponse::success(null);
            }

            return ApiResponse::success($qualifier->toArray());
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to retrieve qualifier', null, 500);
        }
    }

    public function store(CreateQualifierData $data, int $roundId): JsonResponse
    {
        try {
            $qualifier = $this->qualifierService->createQualifier($data, $roundId);
            return ApiResponse::created($qualifier->toArray());
        } catch (QualifierAlreadyExistsException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    public function update(UpdateQualifierData $data, int $qualifierId): JsonResponse
    {
        try {
            $qualifier = $this->qualifierService->updateQualifier($qualifierId, $data);
            return ApiResponse::success($qualifier->toArray());
        } catch (QualifierNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    public function destroy(int $qualifierId): JsonResponse
    {
        try {
            $this->qualifierService->deleteQualifier($qualifierId);
            return ApiResponse::success(['message' => 'Qualifier deleted successfully']);
        } catch (QualifierNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to delete qualifier', null, 500);
        }
    }
}
```

### 2. Routes

**File**: `routes/subdomain.php`

Add qualifier routes in the user dashboard section:

```php
// User Dashboard Routes
Route::domain('app.virtualracingleagues.localhost')->group(function () {
    Route::prefix('api')->middleware(['auth:web', 'user.authenticate'])->group(function () {
        // Existing routes...

        // Qualifier routes
        Route::prefix('rounds/{roundId}/qualifier')->group(function () {
            Route::get('/', [QualifierController::class, 'show']);
            Route::post('/', [QualifierController::class, 'store']);
        });

        Route::prefix('qualifiers/{qualifierId}')->group(function () {
            Route::put('/', [QualifierController::class, 'update']);
            Route::delete('/', [QualifierController::class, 'destroy']);
        });
    });
});
```

### 3. Service Provider Registration

**File**: `app/Providers/RepositoryServiceProvider.php`

The existing `RaceRepositoryInterface` binding already handles qualifiers since they use the same repository:

```php
// No changes needed - already bound
$this->app->bind(
    RaceRepositoryInterface::class,
    EloquentRaceRepository::class
);
```

---

## Business Rules

### Domain Layer (Enforced in Entity)

1. **Qualifier Must Have Qualifying Format**: Cannot be `QualifyingFormat::NONE`
2. **Qualifier Length Minimum**: Must be at least 1 minute
3. **Bonus Points Restriction**: Only `pole` key allowed in bonus_points array
4. **No Race Number**: Qualifiers have `race_number = NULL`
5. **No Race Type**: Qualifiers have `race_type = NULL`
6. **No Pit Stops**: Qualifiers have `mandatory_pit_stop = false` and `minimum_pit_time = NULL`
7. **Time-Based Length**: Qualifiers always use `length_type = 'time'`
8. **No Grid Source**: Not applicable, set to default `GridSource::QUALIFYING`
9. **No Position Points**: `points_system` is empty array (no position-based points)
10. **No DNF/DNS Points**: Both set to 0

### Application Layer (Enforced in Service)

1. **One Qualifier Per Round**: Checked via repository before creation
2. **Transaction Safety**: All mutations wrapped in database transactions
3. **Event Dispatching**: All domain events dispatched after successful persistence

### Repository Layer (Enforced in Repository)

1. **Qualifier Uniqueness**: `qualifierExistsForRound()` prevents duplicates
2. **Type Safety**: Qualifier-specific methods only return/accept qualifiers
3. **Query Filtering**: `findByRoundId()` excludes qualifiers (returns only races)

---

## Field Mapping: Races vs Qualifiers

| Field | Races | Qualifiers | Notes |
|-------|-------|------------|-------|
| **Identity & Type** | | | |
| `id` | Auto-increment | Auto-increment | Same table |
| `round_id` | Required | Required | Both belong to round |
| `is_qualifier` | `false` | `true` | **Discriminator column** |
| `race_number` | Required (1, 2, 3...) | `NULL` | Qualifiers appear first (0 or NULL) |
| `name` | Optional | Optional | "Sprint Race", "Qualifying" |
| `race_type` | Optional (sprint/feature/etc) | `NULL` | N/A for qualifiers |
| **Qualifying Configuration** | | | |
| `qualifying_format` | Required | Required | standard, time_trial, previous_race |
| `qualifying_length` | Optional (can skip quali) | Required | Always set for qualifiers |
| `qualifying_tire` | Optional | Optional | Tire compound for quali |
| **Grid & Length** | | | |
| `grid_source` | Required | `qualifying` | N/A for qualifiers, set to default |
| `grid_source_race_id` | Optional | `NULL` | N/A for qualifiers |
| `length_type` | Required (laps/time) | `time` | Qualifiers always time-based |
| `length_value` | Required | Same as `qualifying_length` | Kept in sync |
| `extra_lap_after_time` | Required | `false` | N/A for qualifiers |
| **Platform Settings** | | | |
| `weather` | Optional | Optional | Both use platform settings |
| `tire_restrictions` | Optional | Optional | Both use platform settings |
| `fuel_usage` | Optional | Optional | Both use platform settings |
| `damage_model` | Optional | Optional | Both use platform settings |
| **Penalties & Rules** | | | |
| `track_limits_enforced` | Required | Required | Both enforce penalties |
| `false_start_detection` | Required | Required | Both enforce penalties |
| `collision_penalties` | Required | Required | Both enforce penalties |
| `mandatory_pit_stop` | Required | `false` | No pit stops in qualifiers |
| `minimum_pit_time` | Optional | `NULL` | N/A for qualifiers |
| `assists_restrictions` | Optional | Optional | Both use restrictions |
| **Division Support** | | | |
| `race_divisions` | Required | Required | Both support divisions |
| **Points** | | | |
| `points_system` | Required (array) | Empty `[]` | No position points for qualifiers |
| `bonus_points` | Optional (pole/fastest_lap) | Optional (pole only) | Qualifiers: ONLY pole allowed |
| `dnf_points` | Required | `0` | N/A for qualifiers |
| `dns_points` | Required | `0` | N/A for qualifiers |
| **Notes** | | | |
| `race_notes` | Optional | Optional | Additional info |
| **Timestamps** | | | |
| `created_at` | Auto | Auto | Same behavior |
| `updated_at` | Auto | Auto | Same behavior |

---

## Validation Strategy

### DTO Validation (Laravel Data Attributes)

**Applied at**: HTTP Request → DTO instantiation

**Validates**:
- Type correctness (string, int, bool, array)
- Value ranges (min, max, between)
- Enum values (in)
- Nullability
- String length

**Example**:
```php
#[Required, IntegerType, Min(1)]
public int $qualifying_length,
```

### Domain Validation (Value Objects & Entity)

**Applied at**: Application Service → Domain Entity

**Validates**:
- Business rules (one qualifier per round)
- Domain invariants (qualifier must have format)
- Value object constraints (RaceName length)
- Entity state consistency

**Example**:
```php
if ($qualifyingFormat === QualifyingFormat::NONE) {
    throw new InvalidArgumentException('Qualifier must have a qualifying format');
}
```

### Repository Validation (Database Constraints)

**Applied at**: Repository → Database

**Validates**:
- Uniqueness (checked via `qualifierExistsForRound()`)
- Foreign key integrity (round_id exists)
- Database-level constraints

**Example**:
```php
if ($this->raceRepository->qualifierExistsForRound($roundId)) {
    throw QualifierAlreadyExistsException::forRound($roundId);
}
```

---

## Testing Strategy

### 1. Unit Tests (Domain Layer)

**File**: `tests/Unit/Domain/Competition/Entities/QualifierTest.php`

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Competition\Entities;

use App\Domain\Competition\Entities\Race;
use App\Domain\Competition\Events\QualifierCreated;
use App\Domain\Competition\Events\QualifierUpdated;
use App\Domain\Competition\ValueObjects\QualifyingFormat;
use App\Domain\Competition\ValueObjects\RaceName;
use PHPUnit\Framework\TestCase;

final class QualifierTest extends TestCase
{
    public function test_creates_new_qualifier(): void
    {
        $qualifier = Race::createQualifier(
            roundId: 1,
            name: RaceName::from('Qualifying Session'),
            qualifyingFormat: QualifyingFormat::STANDARD,
            qualifyingLength: 20,
            qualifyingTire: 'soft',
            weather: 'clear',
            tireRestrictions: null,
            fuelUsage: null,
            damageModel: null,
            trackLimitsEnforced: true,
            falseStartDetection: true,
            collisionPenalties: true,
            assistsRestrictions: null,
            raceDivisions: false,
            bonusPoints: ['pole' => 1],
            raceNotes: null,
        );

        $this->assertTrue($qualifier->isQualifier());
        $this->assertNull($qualifier->id());
        $this->assertSame(1, $qualifier->roundId());
        $this->assertNull($qualifier->raceNumber());
        $this->assertSame('Qualifying Session', $qualifier->name()?->value());
        $this->assertNull($qualifier->type());
        $this->assertSame(QualifyingFormat::STANDARD, $qualifier->qualifyingFormat());
        $this->assertSame(20, $qualifier->qualifyingLength());
        $this->assertSame(['pole' => 1], $qualifier->bonusPoints());
        $this->assertFalse($qualifier->mandatoryPitStop());
        $this->assertNull($qualifier->minimumPitTime());
    }

    public function test_creates_qualifier_created_event(): void
    {
        $qualifier = Race::createQualifier(
            roundId: 1,
            name: RaceName::from('Test Qualifying'),
            qualifyingFormat: QualifyingFormat::TIME_TRIAL,
            qualifyingLength: 15,
            qualifyingTire: null,
            weather: null,
            tireRestrictions: null,
            fuelUsage: null,
            damageModel: null,
            trackLimitsEnforced: true,
            falseStartDetection: true,
            collisionPenalties: true,
            assistsRestrictions: null,
            raceDivisions: false,
            bonusPoints: null,
            raceNotes: null,
        );

        $events = $qualifier->events();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(QualifierCreated::class, $events[0]);
    }

    public function test_throws_exception_for_none_qualifying_format(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Qualifier must have a qualifying format');

        Race::createQualifier(
            roundId: 1,
            name: null,
            qualifyingFormat: QualifyingFormat::NONE,
            qualifyingLength: 15,
            qualifyingTire: null,
            weather: null,
            tireRestrictions: null,
            fuelUsage: null,
            damageModel: null,
            trackLimitsEnforced: true,
            falseStartDetection: true,
            collisionPenalties: true,
            assistsRestrictions: null,
            raceDivisions: false,
            bonusPoints: null,
            raceNotes: null,
        );
    }

    public function test_throws_exception_for_invalid_bonus_points(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Qualifiers can only have pole position bonus');

        Race::createQualifier(
            roundId: 1,
            name: null,
            qualifyingFormat: QualifyingFormat::STANDARD,
            qualifyingLength: 15,
            qualifyingTire: null,
            weather: null,
            tireRestrictions: null,
            fuelUsage: null,
            damageModel: null,
            trackLimitsEnforced: true,
            falseStartDetection: true,
            collisionPenalties: true,
            assistsRestrictions: null,
            raceDivisions: false,
            bonusPoints: ['pole' => 1, 'fastest_lap' => 1], // Invalid!
            raceNotes: null,
        );
    }

    public function test_updates_qualifier_configuration(): void
    {
        $qualifier = Race::createQualifier(
            roundId: 1,
            name: RaceName::from('Original Qualifying'),
            qualifyingFormat: QualifyingFormat::STANDARD,
            qualifyingLength: 15,
            qualifyingTire: 'soft',
            weather: 'clear',
            tireRestrictions: null,
            fuelUsage: null,
            damageModel: null,
            trackLimitsEnforced: true,
            falseStartDetection: true,
            collisionPenalties: true,
            assistsRestrictions: null,
            raceDivisions: false,
            bonusPoints: null,
            raceNotes: null,
        );

        $qualifier->setId(1);

        sleep(1);

        $qualifier->updateQualifierConfiguration(
            name: RaceName::from('Updated Qualifying'),
            qualifyingFormat: QualifyingFormat::TIME_TRIAL,
            qualifyingLength: 20,
            qualifyingTire: 'medium',
            weather: 'dynamic',
            tireRestrictions: 'any',
            fuelUsage: 'standard',
            damageModel: 'full',
            trackLimitsEnforced: false,
            falseStartDetection: false,
            collisionPenalties: false,
            assistsRestrictions: 'limited',
            raceDivisions: true,
            bonusPoints: ['pole' => 2],
            raceNotes: 'Updated notes',
        );

        $this->assertSame('Updated Qualifying', $qualifier->name()?->value());
        $this->assertSame(QualifyingFormat::TIME_TRIAL, $qualifier->qualifyingFormat());
        $this->assertSame(20, $qualifier->qualifyingLength());
        $this->assertSame('medium', $qualifier->qualifyingTire());
        $this->assertTrue($qualifier->raceDivisions());
        $this->assertSame(['pole' => 2], $qualifier->bonusPoints());

        $events = $qualifier->events();
        $this->assertCount(2, $events);
        $this->assertInstanceOf(QualifierUpdated::class, $events[1]);
    }
}
```

### 2. Feature Tests (API Layer)

**File**: `tests/Feature/User/QualifierControllerTest.php`

```php
<?php

declare(strict_types=1);

namespace Tests\Feature\User;

use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class QualifierControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Round $round;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->round = Round::factory()->create();
    }

    public function test_creates_qualifier(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Qualifying Session',
                'qualifying_format' => 'standard',
                'qualifying_length' => 20,
                'qualifying_tire' => 'soft',
                'weather' => 'clear',
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'race_divisions' => false,
                'bonus_points' => ['pole' => 1],
                'race_notes' => null,
            ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'round_id',
                'name',
                'qualifying_format',
                'qualifying_length',
                'bonus_points',
            ],
        ]);

        $this->assertDatabaseHas('races', [
            'round_id' => $this->round->id,
            'is_qualifier' => true,
            'race_number' => null,
            'name' => 'Qualifying Session',
        ]);
    }

    public function test_prevents_duplicate_qualifiers(): void
    {
        // Create first qualifier
        $this->actingAs($this->user)
            ->postJson("/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Qualifying 1',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'race_divisions' => false,
                'bonus_points' => null,
                'race_notes' => null,
            ]);

        // Attempt to create second qualifier
        $response = $this->actingAs($this->user)
            ->postJson("/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Qualifying 2',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'race_divisions' => false,
                'bonus_points' => null,
                'race_notes' => null,
            ]);

        $response->assertStatus(422);
        $response->assertJson([
            'message' => "A qualifier already exists for round {$this->round->id}. Only one qualifier is allowed per round.",
        ]);
    }

    public function test_validates_bonus_points(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson("/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Invalid Qualifier',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'race_divisions' => false,
                'bonus_points' => ['pole' => 1, 'fastest_lap' => 1], // Invalid!
                'race_notes' => null,
            ]);

        $response->assertStatus(422);
    }

    public function test_retrieves_qualifier_by_round(): void
    {
        // Create qualifier
        $createResponse = $this->actingAs($this->user)
            ->postJson("/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Test Qualifying',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'race_divisions' => false,
                'bonus_points' => null,
                'race_notes' => null,
            ]);

        // Retrieve qualifier
        $response = $this->actingAs($this->user)
            ->getJson("/api/rounds/{$this->round->id}/qualifier");

        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'round_id' => $this->round->id,
                'name' => 'Test Qualifying',
            ],
        ]);
    }

    public function test_updates_qualifier(): void
    {
        // Create qualifier
        $createResponse = $this->actingAs($this->user)
            ->postJson("/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'Original',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'race_divisions' => false,
                'bonus_points' => null,
                'race_notes' => null,
            ]);

        $qualifierId = $createResponse->json('data.id');

        // Update qualifier
        $response = $this->actingAs($this->user)
            ->putJson("/api/qualifiers/{$qualifierId}", [
                'name' => 'Updated',
                'qualifying_length' => 20,
            ]);

        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'name' => 'Updated',
                'qualifying_length' => 20,
            ],
        ]);
    }

    public function test_deletes_qualifier(): void
    {
        // Create qualifier
        $createResponse = $this->actingAs($this->user)
            ->postJson("/api/rounds/{$this->round->id}/qualifier", [
                'name' => 'To Delete',
                'qualifying_format' => 'standard',
                'qualifying_length' => 15,
                'qualifying_tire' => null,
                'weather' => null,
                'tire_restrictions' => null,
                'fuel_usage' => null,
                'damage_model' => null,
                'track_limits_enforced' => true,
                'false_start_detection' => true,
                'collision_penalties' => true,
                'assists_restrictions' => null,
                'race_divisions' => false,
                'bonus_points' => null,
                'race_notes' => null,
            ]);

        $qualifierId = $createResponse->json('data.id');

        // Delete qualifier
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/qualifiers/{$qualifierId}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('races', ['id' => $qualifierId]);
    }
}
```

### 3. Repository Tests

**File**: `tests/Unit/Infrastructure/Repositories/EloquentRaceRepositoryQualifierTest.php`

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Repositories;

use App\Domain\Competition\Entities\Race;
use App\Domain\Competition\Exceptions\QualifierNotFoundException;
use App\Domain\Competition\ValueObjects\QualifyingFormat;
use App\Domain\Competition\ValueObjects\RaceName;
use App\Infrastructure\Persistence\Eloquent\Models\Round;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentRaceRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class EloquentRaceRepositoryQualifierTest extends TestCase
{
    use RefreshDatabase;

    private EloquentRaceRepository $repository;
    private Round $round;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = new EloquentRaceRepository();
        $this->round = Round::factory()->create();
    }

    public function test_saves_and_retrieves_qualifier(): void
    {
        $qualifier = Race::createQualifier(
            roundId: $this->round->id,
            name: RaceName::from('Test Qualifying'),
            qualifyingFormat: QualifyingFormat::STANDARD,
            qualifyingLength: 15,
            qualifyingTire: null,
            weather: null,
            tireRestrictions: null,
            fuelUsage: null,
            damageModel: null,
            trackLimitsEnforced: true,
            falseStartDetection: true,
            collisionPenalties: true,
            assistsRestrictions: null,
            raceDivisions: false,
            bonusPoints: ['pole' => 1],
            raceNotes: null,
        );

        $this->repository->save($qualifier);

        $this->assertNotNull($qualifier->id());

        $retrieved = $this->repository->findQualifierById($qualifier->id());

        $this->assertTrue($retrieved->isQualifier());
        $this->assertSame($this->round->id, $retrieved->roundId());
        $this->assertSame('Test Qualifying', $retrieved->name()?->value());
    }

    public function test_qualifier_exists_for_round(): void
    {
        $this->assertFalse($this->repository->qualifierExistsForRound($this->round->id));

        $qualifier = Race::createQualifier(
            roundId: $this->round->id,
            name: null,
            qualifyingFormat: QualifyingFormat::STANDARD,
            qualifyingLength: 15,
            qualifyingTire: null,
            weather: null,
            tireRestrictions: null,
            fuelUsage: null,
            damageModel: null,
            trackLimitsEnforced: true,
            falseStartDetection: true,
            collisionPenalties: true,
            assistsRestrictions: null,
            raceDivisions: false,
            bonusPoints: null,
            raceNotes: null,
        );

        $this->repository->save($qualifier);

        $this->assertTrue($this->repository->qualifierExistsForRound($this->round->id));
    }

    public function test_find_qualifier_by_round_id(): void
    {
        $qualifier = Race::createQualifier(
            roundId: $this->round->id,
            name: RaceName::from('Round Qualifier'),
            qualifyingFormat: QualifyingFormat::TIME_TRIAL,
            qualifyingLength: 20,
            qualifyingTire: null,
            weather: null,
            tireRestrictions: null,
            fuelUsage: null,
            damageModel: null,
            trackLimitsEnforced: true,
            falseStartDetection: true,
            collisionPenalties: true,
            assistsRestrictions: null,
            raceDivisions: false,
            bonusPoints: null,
            raceNotes: null,
        );

        $this->repository->save($qualifier);

        $retrieved = $this->repository->findQualifierByRoundId($this->round->id);

        $this->assertNotNull($retrieved);
        $this->assertTrue($retrieved->isQualifier());
        $this->assertSame('Round Qualifier', $retrieved->name()?->value());
    }

    public function test_find_qualifier_by_round_id_returns_null_when_not_found(): void
    {
        $retrieved = $this->repository->findQualifierByRoundId($this->round->id);
        $this->assertNull($retrieved);
    }

    public function test_throws_exception_when_qualifier_not_found_by_id(): void
    {
        $this->expectException(QualifierNotFoundException::class);
        $this->repository->findQualifierById(999);
    }
}
```

---

## Implementation Steps

### Phase 1: Database & Infrastructure (30 minutes)

1. ✅ Create migration: `add_is_qualifier_to_races_table.php`
2. ✅ Run migration: `php artisan migrate`
3. ✅ Update Eloquent model: Add `is_qualifier` to fillable, casts, and scopes
4. ✅ Update repository interface: Add qualifier methods
5. ✅ Update repository implementation: Add qualifier methods and update existing ones
6. ✅ Write repository tests

### Phase 2: Domain Layer (45 minutes)

7. ✅ Create domain events: `QualifierCreated`, `QualifierUpdated`, `QualifierDeleted`
8. ✅ Create domain exceptions: `QualifierNotFoundException`, `QualifierAlreadyExistsException`, `InvalidOperationException`
9. ✅ Update `Race` entity: Add `isQualifier` property, `createQualifier()`, `updateQualifierConfiguration()`, `isQualifier()` getter
10. ✅ Update `Race` entity: Modify `reconstitute()` to include `isQualifier`
11. ✅ Write entity unit tests for qualifiers

### Phase 3: Application Layer (45 minutes)

12. ✅ Create DTOs: `CreateQualifierData`, `UpdateQualifierData`, `QualifierData`
13. ✅ Create application service: `QualifierApplicationService`
14. ✅ Bind service in container (if needed)

### Phase 4: Interface Layer (30 minutes)

15. ✅ Create controller: `QualifierController`
16. ✅ Add routes in `routes/subdomain.php`
17. ✅ Write feature tests for API endpoints

### Phase 5: Integration & Validation (30 minutes)

18. ✅ Run all tests: `composer test`
19. ✅ Run static analysis: `composer phpstan`
20. ✅ Run code style check: `composer phpcs`
21. ✅ Fix any issues: `composer phpcbf`
22. ✅ Manual testing via API client (Postman/Insomnia)

### Phase 6: Documentation (15 minutes)

23. ✅ Update API documentation
24. ✅ Update architecture documentation
25. ✅ Add inline code comments for complex logic

**Total Estimated Time**: 3-4 hours

---

## Code Examples

### Example 1: Creating a Qualifier

**Request**:
```http
POST /api/rounds/1/qualifier
Content-Type: application/json

{
  "name": "Sprint Qualifying",
  "qualifying_format": "standard",
  "qualifying_length": 20,
  "qualifying_tire": "soft",
  "weather": "clear",
  "tire_restrictions": "any",
  "fuel_usage": "standard",
  "damage_model": "full",
  "track_limits_enforced": true,
  "false_start_detection": true,
  "collision_penalties": true,
  "assists_restrictions": "limited",
  "race_divisions": false,
  "bonus_points": {
    "pole": 1
  },
  "race_notes": "Q1, Q2, Q3 format"
}
```

**Response**:
```json
{
  "data": {
    "id": 123,
    "round_id": 1,
    "name": "Sprint Qualifying",
    "qualifying_format": "standard",
    "qualifying_length": 20,
    "qualifying_tire": "soft",
    "weather": "clear",
    "tire_restrictions": "any",
    "fuel_usage": "standard",
    "damage_model": "full",
    "track_limits_enforced": true,
    "false_start_detection": true,
    "collision_penalties": true,
    "assists_restrictions": "limited",
    "race_divisions": false,
    "bonus_points": {
      "pole": 1
    },
    "race_notes": "Q1, Q2, Q3 format",
    "created_at": "2025-10-25 12:00:00",
    "updated_at": "2025-10-25 12:00:00"
  }
}
```

### Example 2: Retrieving Qualifier for a Round

**Request**:
```http
GET /api/rounds/1/qualifier
```

**Response (Qualifier exists)**:
```json
{
  "data": {
    "id": 123,
    "round_id": 1,
    "name": "Sprint Qualifying",
    "qualifying_format": "standard",
    "qualifying_length": 20,
    ...
  }
}
```

**Response (No qualifier)**:
```json
{
  "data": null
}
```

### Example 3: Updating a Qualifier

**Request**:
```http
PUT /api/qualifiers/123
Content-Type: application/json

{
  "qualifying_length": 25,
  "bonus_points": {
    "pole": 2
  }
}
```

**Response**:
```json
{
  "data": {
    "id": 123,
    "round_id": 1,
    "name": "Sprint Qualifying",
    "qualifying_format": "standard",
    "qualifying_length": 25,
    "bonus_points": {
      "pole": 2
    },
    ...
  }
}
```

### Example 4: Domain Entity Usage

```php
// Create a qualifier
$qualifier = Race::createQualifier(
    roundId: 1,
    name: RaceName::from('Qualifying Session'),
    qualifyingFormat: QualifyingFormat::STANDARD,
    qualifyingLength: 20,
    qualifyingTire: 'soft',
    weather: 'clear',
    tireRestrictions: null,
    fuelUsage: null,
    damageModel: null,
    trackLimitsEnforced: true,
    falseStartDetection: true,
    collisionPenalties: true,
    assistsRestrictions: null,
    raceDivisions: false,
    bonusPoints: ['pole' => 1],
    raceNotes: null,
);

// Save via repository
$repository->save($qualifier);

// Update qualifier
$qualifier->updateQualifierConfiguration(
    name: RaceName::from('Updated Qualifying'),
    qualifyingFormat: QualifyingFormat::TIME_TRIAL,
    qualifyingLength: 25,
    // ... other parameters
);

$repository->save($qualifier);

// Dispatch events
foreach ($qualifier->releaseEvents() as $event) {
    Event::dispatch($event);
}
```

### Example 5: Application Service Usage

```php
// Create qualifier
$qualifierData = $qualifierService->createQualifier(
    data: CreateQualifierData::from($request->all()),
    roundId: 1
);

// Update qualifier
$qualifierData = $qualifierService->updateQualifier(
    qualifierId: 123,
    data: UpdateQualifierData::from($request->all())
);

// Get qualifier by round
$qualifierData = $qualifierService->getQualifierByRound(roundId: 1);

// Delete qualifier
$qualifierService->deleteQualifier(qualifierId: 123);
```

---

## Summary

This implementation plan provides a complete blueprint for adding qualifier support to the racing league management system using **Domain-Driven Design** principles.

**Key Achievements**:
- ✅ Minimal database changes (single column + index)
- ✅ Type-safe DTOs for clear API contracts
- ✅ Business rules enforced at domain layer
- ✅ Clean separation of concerns across layers
- ✅ Comprehensive testing strategy
- ✅ Follows existing codebase patterns
- ✅ One qualifier per round constraint
- ✅ Qualifier-specific validation (pole bonus only, no pit stops, etc.)

**Next Steps After Implementation**:
1. Frontend implementation for creating/editing qualifiers
2. Grid generation from qualifier results
3. Reporting and analytics for qualifying sessions
4. Integration with race results and championship standings

# Round Creation - Backend Implementation Plan

**Version:** 1.0
**Last Updated:** October 25, 2025
**Architecture:** Domain-Driven Design (DDD)

---

## Table of Contents

1. [Overview](#overview)
2. [Domain Layer](#domain-layer)
3. [Application Layer](#application-layer)
4. [Infrastructure Layer](#infrastructure-layer)
5. [Interface Layer](#interface-layer)
6. [Platform Settings Configuration](#platform-settings-configuration)
7. [Database Migrations](#database-migrations)
8. [Testing Strategy](#testing-strategy)
9. [Implementation Checklist](#implementation-checklist)

---

## Overview

This document provides complete backend implementation details following DDD architecture patterns established in the codebase (reference: Division and Season implementations).

### Architecture Principles

1. **Domain Layer**: Pure PHP, no Laravel dependencies, contains business logic
2. **Application Layer**: Orchestrates use cases, manages transactions, returns DTOs
3. **Infrastructure Layer**: Persistence (Eloquent), repository implementations
4. **Interface Layer**: Thin controllers (3-5 lines per method), HTTP concerns

### File Organization

```
app/
├── Domain/Competition/
│   ├── Entities/
│   │   ├── Round.php
│   │   └── Race.php
│   ├── ValueObjects/
│   │   ├── RoundNumber.php
│   │   ├── RoundName.php
│   │   ├── RoundSlug.php
│   │   ├── RoundStatus.php
│   │   ├── RaceName.php
│   │   ├── RaceType.php
│   │   ├── QualifyingFormat.php
│   │   ├── GridSource.php
│   │   ├── RaceLengthType.php
│   │   └── PointsSystem.php
│   ├── Events/
│   │   ├── RoundCreated.php
│   │   ├── RoundUpdated.php
│   │   ├── RoundDeleted.php
│   │   ├── RoundStatusChanged.php
│   │   ├── RaceCreated.php
│   │   └── RaceUpdated.php
│   ├── Exceptions/
│   │   ├── RoundNotFoundException.php
│   │   ├── InvalidRoundNumberException.php
│   │   ├── RaceNotFoundException.php
│   │   └── InvalidRaceConfigurationException.php
│   └── Repositories/
│       ├── RoundRepositoryInterface.php
│       └── RaceRepositoryInterface.php
├── Application/Competition/
│   ├── Services/
│   │   ├── RoundApplicationService.php
│   │   └── RaceApplicationService.php
│   └── DTOs/
│       ├── CreateRoundData.php
│       ├── UpdateRoundData.php
│       ├── RoundData.php
│       ├── CreateRaceData.php
│       ├── UpdateRaceData.php
│       └── RaceData.php
├── Infrastructure/Persistence/Eloquent/
│   ├── Models/
│   │   ├── Round.php (RoundEloquent)
│   │   └── Race.php (RaceEloquent)
│   └── Repositories/
│       ├── EloquentRoundRepository.php
│       └── EloquentRaceRepository.php
└── Http/Controllers/User/
    ├── RoundController.php
    ├── RaceController.php
    └── PlatformSettingsController.php
```

---

## Domain Layer

### 1. Round Entity

**Location:** `app/Domain/Competition/Entities/Round.php`

**Responsibilities:**
- Create new rounds with validation
- Update round details
- Manage round status transitions
- Record domain events
- Business rule enforcement

**Implementation:**

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Entities;

use App\Domain\Competition\ValueObjects\RoundName;
use App\Domain\Competition\ValueObjects\RoundNumber;
use App\Domain\Competition\ValueObjects\RoundSlug;
use App\Domain\Competition\ValueObjects\RoundStatus;
use App\Domain\Competition\Events\RoundCreated;
use App\Domain\Competition\Events\RoundUpdated;
use App\Domain\Competition\Events\RoundDeleted;
use App\Domain\Competition\Events\RoundStatusChanged;
use DateTimeImmutable;

final class Round
{
    private array $events = [];

    private function __construct(
        private ?int $id,
        private int $seasonId,
        private RoundNumber $roundNumber,
        private ?RoundName $name,
        private RoundSlug $slug,
        private DateTimeImmutable $scheduledAt,
        private string $timezone,
        private int $platformTrackId,
        private ?string $trackLayout,
        private ?string $trackConditions,
        private ?string $technicalNotes,
        private ?string $streamUrl,
        private ?string $internalNotes,
        private RoundStatus $status,
        private int $createdByUserId,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
        private ?DateTimeImmutable $deletedAt = null,
    ) {}

    // Static factory for new entities
    public static function create(
        int $seasonId,
        RoundNumber $roundNumber,
        ?RoundName $name,
        RoundSlug $slug,
        DateTimeImmutable $scheduledAt,
        string $timezone,
        int $platformTrackId,
        ?string $trackLayout,
        ?string $trackConditions,
        ?string $technicalNotes,
        ?string $streamUrl,
        ?string $internalNotes,
        int $createdByUserId,
    ): self {
        return new self(
            id: null,
            seasonId: $seasonId,
            roundNumber: $roundNumber,
            name: $name,
            slug: $slug,
            scheduledAt: $scheduledAt,
            timezone: $timezone,
            platformTrackId: $platformTrackId,
            trackLayout: $trackLayout,
            trackConditions: $trackConditions,
            technicalNotes: $technicalNotes,
            streamUrl: $streamUrl,
            internalNotes: $internalNotes,
            status: RoundStatus::SCHEDULED,
            createdByUserId: $createdByUserId,
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable(),
            deletedAt: null,
        );
    }

    // Static factory for reconstitution from persistence
    public static function reconstitute(
        int $id,
        int $seasonId,
        RoundNumber $roundNumber,
        ?RoundName $name,
        RoundSlug $slug,
        DateTimeImmutable $scheduledAt,
        string $timezone,
        int $platformTrackId,
        ?string $trackLayout,
        ?string $trackConditions,
        ?string $technicalNotes,
        ?string $streamUrl,
        ?string $internalNotes,
        RoundStatus $status,
        int $createdByUserId,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
        ?DateTimeImmutable $deletedAt = null,
    ): self {
        return new self(
            id: $id,
            seasonId: $seasonId,
            roundNumber: $roundNumber,
            name: $name,
            slug: $slug,
            scheduledAt: $scheduledAt,
            timezone: $timezone,
            platformTrackId: $platformTrackId,
            trackLayout: $trackLayout,
            trackConditions: $trackConditions,
            technicalNotes: $technicalNotes,
            streamUrl: $streamUrl,
            internalNotes: $internalNotes,
            status: $status,
            createdByUserId: $createdByUserId,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
            deletedAt: $deletedAt,
        );
    }

    // Business methods
    public function updateDetails(
        RoundNumber $roundNumber,
        ?RoundName $name,
        RoundSlug $slug,
        DateTimeImmutable $scheduledAt,
        int $platformTrackId,
        ?string $trackLayout,
        ?string $trackConditions,
        ?string $technicalNotes,
        ?string $streamUrl,
        ?string $internalNotes,
    ): void {
        $hasChanges = false;

        if (!$this->roundNumber->equals($roundNumber)) {
            $this->roundNumber = $roundNumber;
            $hasChanges = true;
        }

        if ($this->name?->equals($name) === false || ($this->name === null && $name !== null)) {
            $this->name = $name;
            $hasChanges = true;
        }

        if (!$this->slug->equals($slug)) {
            $this->slug = $slug;
            $hasChanges = true;
        }

        if ($this->scheduledAt != $scheduledAt) {
            $this->scheduledAt = $scheduledAt;
            $hasChanges = true;
        }

        if ($this->platformTrackId !== $platformTrackId) {
            $this->platformTrackId = $platformTrackId;
            $hasChanges = true;
        }

        if ($this->trackLayout !== $trackLayout) {
            $this->trackLayout = $trackLayout;
            $hasChanges = true;
        }

        if ($this->trackConditions !== $trackConditions) {
            $this->trackConditions = $trackConditions;
            $hasChanges = true;
        }

        if ($this->technicalNotes !== $technicalNotes) {
            $this->technicalNotes = $technicalNotes;
            $hasChanges = true;
        }

        if ($this->streamUrl !== $streamUrl) {
            $this->streamUrl = $streamUrl;
            $hasChanges = true;
        }

        if ($this->internalNotes !== $internalNotes) {
            $this->internalNotes = $internalNotes;
            $hasChanges = true;
        }

        if ($hasChanges) {
            $this->updatedAt = new DateTimeImmutable();
            $this->recordUpdatedEvent();
        }
    }

    public function changeStatus(RoundStatus $newStatus): void
    {
        if ($this->status === $newStatus) {
            return;
        }

        $oldStatus = $this->status;
        $this->status = $newStatus;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new RoundStatusChanged(
            roundId: $this->id ?? 0,
            seasonId: $this->seasonId,
            oldStatus: $oldStatus->value,
            newStatus: $newStatus->value,
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }

    public function delete(): void
    {
        $this->deletedAt = new DateTimeImmutable();
        $this->recordDeletedEvent();
    }

    // Event recording
    public function recordCreationEvent(): void
    {
        $this->recordEvent(new RoundCreated(
            roundId: $this->id ?? 0,
            seasonId: $this->seasonId,
            roundNumber: $this->roundNumber->value(),
            name: $this->name?->value(),
            slug: $this->slug->value(),
            scheduledAt: $this->scheduledAt->format('Y-m-d H:i:s'),
            platformTrackId: $this->platformTrackId,
            createdByUserId: $this->createdByUserId,
            occurredAt: $this->createdAt->format('Y-m-d H:i:s'),
        ));
    }

    private function recordUpdatedEvent(): void
    {
        $this->recordEvent(new RoundUpdated(
            roundId: $this->id ?? 0,
            seasonId: $this->seasonId,
            occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
        ));
    }

    private function recordDeletedEvent(): void
    {
        $this->recordEvent(new RoundDeleted(
            roundId: $this->id ?? 0,
            seasonId: $this->seasonId,
            occurredAt: $this->deletedAt?->format('Y-m-d H:i:s') ?? now()->toDateTimeString(),
        ));
    }

    private function recordEvent(object $event): void
    {
        $this->events[] = $event;
    }

    // Getters
    public function id(): ?int { return $this->id; }
    public function seasonId(): int { return $this->seasonId; }
    public function roundNumber(): RoundNumber { return $this->roundNumber; }
    public function name(): ?RoundName { return $this->name; }
    public function slug(): RoundSlug { return $this->slug; }
    public function scheduledAt(): DateTimeImmutable { return $this->scheduledAt; }
    public function timezone(): string { return $this->timezone; }
    public function platformTrackId(): int { return $this->platformTrackId; }
    public function trackLayout(): ?string { return $this->trackLayout; }
    public function trackConditions(): ?string { return $this->trackConditions; }
    public function technicalNotes(): ?string { return $this->technicalNotes; }
    public function streamUrl(): ?string { return $this->streamUrl; }
    public function internalNotes(): ?string { return $this->internalNotes; }
    public function status(): RoundStatus { return $this->status; }
    public function createdByUserId(): int { return $this->createdByUserId; }
    public function createdAt(): DateTimeImmutable { return $this->createdAt; }
    public function updatedAt(): DateTimeImmutable { return $this->updatedAt; }
    public function deletedAt(): ?DateTimeImmutable { return $this->deletedAt; }

    // Setters (only for repository use)
    public function setId(int $id): void { $this->id = $id; }

    // Event management
    public function releaseEvents(): array
    {
        $events = $this->events;
        $this->events = [];
        return $events;
    }

    public function hasEvents(): bool
    {
        return count($this->events) > 0;
    }
}
```

---

### 2. Race Entity

**Location:** `app/Domain/Competition/Entities/Race.php`

**Responsibilities:**
- Create races with configuration
- Update race settings
- Validate race configuration
- Record domain events

**Key Fields:**
- Basic: race_number, name, type
- Qualifying: format, length, tire compound
- Grid: source (qualifying, previous race, championship, etc.)
- Length: type (laps/time), value, extra lap flag
- Settings: weather, tires, fuel, damage, penalties, assists (platform-specific)
- Points: system (JSON), bonus points (JSON), DNF/DNS handling
- Division: flag for division-based results

**Implementation:** Similar structure to Round entity, with additional complexity for race configuration.

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Entities;

use App\Domain\Competition\ValueObjects\RaceName;
use App\Domain\Competition\ValueObjects\RaceType;
use App\Domain\Competition\ValueObjects\QualifyingFormat;
use App\Domain\Competition\ValueObjects\GridSource;
use App\Domain\Competition\ValueObjects\RaceLengthType;
use App\Domain\Competition\ValueObjects\PointsSystem;
use App\Domain\Competition\Events\RaceCreated;
use App\Domain\Competition\Events\RaceUpdated;
use DateTimeImmutable;

final class Race
{
    private array $events = [];

    private function __construct(
        private ?int $id,
        private int $roundId,
        private int $raceNumber,
        private ?RaceName $name,
        private ?RaceType $type,
        private QualifyingFormat $qualifyingFormat,
        private ?int $qualifyingLength, // minutes
        private ?string $qualifyingTire,
        private GridSource $gridSource,
        private ?int $gridSourceRaceId, // FK to races.id if gridSource uses previous race
        private RaceLengthType $lengthType,
        private int $lengthValue, // laps or minutes
        private bool $extraLapAfterTime,
        private ?string $weather,
        private ?string $tireRestrictions,
        private ?string $fuelUsage,
        private ?string $damageModel,
        private bool $trackLimitsEnforced,
        private bool $falseStartDetection,
        private bool $collisionPenalties,
        private bool $mandatoryPitStop,
        private ?int $minimumPitTime, // seconds
        private ?string $assistsRestrictions,
        private bool $raceDivisions, // If true, race has separate results per division
        private PointsSystem $pointsSystem,
        private ?array $bonusPoints, // JSON: ['pole' => 1, 'fastest_lap' => 1, ...]
        private int $dnfPoints,
        private int $dnsPoints,
        private ?string $raceNotes,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
    ) {}

    // Static factories and business methods similar to Round...
    // (Abbreviated for brevity - full implementation follows same pattern)

    public static function create(
        int $roundId,
        int $raceNumber,
        ?RaceName $name,
        ?RaceType $type,
        QualifyingFormat $qualifyingFormat,
        ?int $qualifyingLength,
        ?string $qualifyingTire,
        GridSource $gridSource,
        ?int $gridSourceRaceId,
        RaceLengthType $lengthType,
        int $lengthValue,
        bool $extraLapAfterTime,
        ?string $weather,
        ?string $tireRestrictions,
        ?string $fuelUsage,
        ?string $damageModel,
        bool $trackLimitsEnforced,
        bool $falseStartDetection,
        bool $collisionPenalties,
        bool $mandatoryPitStop,
        ?int $minimumPitTime,
        ?string $assistsRestrictions,
        bool $raceDivisions,
        PointsSystem $pointsSystem,
        ?array $bonusPoints,
        int $dnfPoints,
        int $dnsPoints,
        ?string $raceNotes,
    ): self {
        return new self(
            id: null,
            roundId: $roundId,
            raceNumber: $raceNumber,
            name: $name,
            type: $type,
            qualifyingFormat: $qualifyingFormat,
            qualifyingLength: $qualifyingLength,
            qualifyingTire: $qualifyingTire,
            gridSource: $gridSource,
            gridSourceRaceId: $gridSourceRaceId,
            lengthType: $lengthType,
            lengthValue: $lengthValue,
            extraLapAfterTime: $extraLapAfterTime,
            weather: $weather,
            tireRestrictions: $tireRestrictions,
            fuelUsage: $fuelUsage,
            damageModel: $damageModel,
            trackLimitsEnforced: $trackLimitsEnforced,
            falseStartDetection: $falseStartDetection,
            collisionPenalties: $collisionPenalties,
            mandatoryPitStop: $mandatoryPitStop,
            minimumPitTime: $minimumPitTime,
            assistsRestrictions: $assistsRestrictions,
            raceDivisions: $raceDivisions,
            pointsSystem: $pointsSystem,
            bonusPoints: $bonusPoints,
            dnfPoints: $dnfPoints,
            dnsPoints: $dnsPoints,
            raceNotes: $raceNotes,
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable(),
        );
    }

    // Getters, setters, event methods...
}
```

---

### 3. Value Objects

#### RoundNumber
**Location:** `app/Domain/Competition/ValueObjects/RoundNumber.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

use App\Domain\Competition\Exceptions\InvalidRoundNumberException;

final readonly class RoundNumber
{
    private function __construct(private int $value)
    {
        $this->validate();
    }

    public static function from(int $value): self
    {
        return new self($value);
    }

    private function validate(): void
    {
        if ($this->value < 1 || $this->value > 99) {
            throw InvalidRoundNumberException::outOfRange($this->value);
        }
    }

    public function value(): int
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}
```

#### RoundName
**Location:** `app/Domain/Competition/ValueObjects/RoundName.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

use InvalidArgumentException;

final readonly class RoundName
{
    private function __construct(private string $value)
    {
        $this->validate();
    }

    public static function from(string $value): self
    {
        return new self(trim($value));
    }

    private function validate(): void
    {
        if (mb_strlen($this->value) < 3) {
            throw new InvalidArgumentException('Round name must be at least 3 characters');
        }

        if (mb_strlen($this->value) > 100) {
            throw new InvalidArgumentException('Round name cannot exceed 100 characters');
        }
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(?self $other): bool
    {
        if ($other === null) {
            return false;
        }
        return $this->value === $other->value;
    }
}
```

#### RoundSlug
**Location:** `app/Domain/Competition/ValueObjects/RoundSlug.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

use Illuminate\Support\Str;

final readonly class RoundSlug
{
    private function __construct(private string $value)
    {
        $this->validate();
    }

    public static function from(string $value): self
    {
        return new self(Str::slug($value));
    }

    public static function fromName(?string $name, int $roundNumber): self
    {
        if ($name !== null && trim($name) !== '') {
            return self::from($name);
        }

        return self::from("round-{$roundNumber}");
    }

    private function validate(): void
    {
        if (empty($this->value)) {
            throw new \InvalidArgumentException('Slug cannot be empty');
        }

        if (!preg_match('/^[a-z0-9-]+$/', $this->value)) {
            throw new \InvalidArgumentException('Slug must contain only lowercase letters, numbers, and hyphens');
        }
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

#### RoundStatus (Enum)
**Location:** `app/Domain/Competition/ValueObjects/RoundStatus.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

enum RoundStatus: string
{
    case SCHEDULED = 'scheduled';
    case PRE_RACE = 'pre_race';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match($this) {
            self::SCHEDULED => 'Scheduled',
            self::PRE_RACE => 'Pre-Race',
            self::IN_PROGRESS => 'In Progress',
            self::COMPLETED => 'Completed',
            self::CANCELLED => 'Cancelled',
        };
    }

    public function isActive(): bool
    {
        return $this === self::IN_PROGRESS;
    }

    public function isCompleted(): bool
    {
        return $this === self::COMPLETED;
    }
}
```

#### Other Race Value Objects (Enums)

**RaceType**: sprint, feature, endurance, qualifying, custom
**QualifyingFormat**: standard, time_trial, none, previous_race
**GridSource**: qualifying, previous_race, reverse_previous, championship, reverse_championship, manual
**RaceLengthType**: laps, time

All follow similar enum pattern.

#### PointsSystem
**Location:** `app/Domain/Competition/ValueObjects/PointsSystem.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

final readonly class PointsSystem
{
    /**
     * @param array<int, int> $positions Position => Points mapping (1 => 25, 2 => 18, ...)
     */
    private function __construct(private array $positions)
    {
        $this->validate();
    }

    public static function from(array $positions): self
    {
        return new self($positions);
    }

    public static function f1Standard(): self
    {
        return new self([
            1 => 25, 2 => 18, 3 => 15, 4 => 12, 5 => 10,
            6 => 8, 7 => 6, 8 => 4, 9 => 2, 10 => 1,
        ]);
    }

    private function validate(): void
    {
        if (empty($this->positions)) {
            throw new \InvalidArgumentException('Points system cannot be empty');
        }

        foreach ($this->positions as $position => $points) {
            if (!is_int($position) || $position < 1) {
                throw new \InvalidArgumentException('Position must be positive integer');
            }
            if (!is_int($points) || $points < 0) {
                throw new \InvalidArgumentException('Points must be non-negative integer');
            }
        }
    }

    public function toArray(): array
    {
        return $this->positions;
    }

    public function getPointsForPosition(int $position): int
    {
        return $this->positions[$position] ?? 0;
    }
}
```

---

### 4. Domain Events

#### RoundCreated
**Location:** `app/Domain/Competition/Events/RoundCreated.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

final readonly class RoundCreated
{
    public function __construct(
        public int $roundId,
        public int $seasonId,
        public int $roundNumber,
        public ?string $name,
        public string $slug,
        public string $scheduledAt,
        public int $platformTrackId,
        public int $createdByUserId,
        public string $occurredAt,
    ) {}
}
```

Other events (RoundUpdated, RoundDeleted, RoundStatusChanged, RaceCreated, RaceUpdated) follow similar pattern.

---

### 5. Domain Exceptions

**Location:** `app/Domain/Competition/Exceptions/`

```php
// RoundNotFoundException.php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

final class RoundNotFoundException extends DomainException
{
    public static function withId(int $id): self
    {
        return new self("Round with ID {$id} not found");
    }
}

// InvalidRoundNumberException.php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

final class InvalidRoundNumberException extends DomainException
{
    public static function outOfRange(int $value): self
    {
        return new self("Round number must be between 1 and 99, got {$value}");
    }
}

// Similar exceptions: RaceNotFoundException, InvalidRaceConfigurationException
```

---

### 6. Repository Interfaces

#### RoundRepositoryInterface
**Location:** `app/Domain/Competition/Repositories/RoundRepositoryInterface.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Repositories;

use App\Domain\Competition\Entities\Round;

interface RoundRepositoryInterface
{
    public function save(Round $round): void;

    public function findById(int $id): Round;

    /** @return array<Round> */
    public function findBySeasonId(int $seasonId): array;

    public function delete(Round $round): void;

    public function generateUniqueSlug(string $baseSlug, int $seasonId, ?int $excludeId = null): string;

    public function getNextRoundNumber(int $seasonId): int;

    public function exists(int $id): bool;
}
```

#### RaceRepositoryInterface
**Location:** `app/Domain/Competition/Repositories/RaceRepositoryInterface.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Repositories;

use App\Domain\Competition\Entities\Race;

interface RaceRepositoryInterface
{
    public function save(Race $race): void;

    public function findById(int $id): Race;

    /** @return array<Race> */
    public function findByRoundId(int $roundId): array;

    public function delete(Race $race): void;

    public function getNextRaceNumber(int $roundId): int;

    public function exists(int $id): bool;
}
```

---

## Application Layer

### 1. DTOs (Data Transfer Objects)

Using `spatie/laravel-data` for type-safe DTOs.

#### CreateRoundData
**Location:** `app/Application/Competition/DTOs/CreateRoundData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Integer;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\DateFormat;
use Spatie\LaravelData\Attributes\Validation\Url;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Sometimes;
use Spatie\LaravelData\Data;

final class CreateRoundData extends Data
{
    public function __construct(
        #[Required, Integer, Min(1), Max(99)]
        public readonly int $round_number,

        #[Nullable, Sometimes, Min(3), Max(100)]
        public readonly ?string $name,

        #[Required, DateFormat('Y-m-d H:i:s')]
        public readonly string $scheduled_at,

        #[Required, Integer]
        public readonly int $platform_track_id,

        #[Nullable, Sometimes, Max(100)]
        public readonly ?string $track_layout,

        #[Nullable, Sometimes, Max(500)]
        public readonly ?string $track_conditions,

        #[Nullable, Sometimes, Max(2000)]
        public readonly ?string $technical_notes,

        #[Nullable, Sometimes, Url, Max(255)]
        public readonly ?string $stream_url,

        #[Nullable, Sometimes, Max(2000)]
        public readonly ?string $internal_notes,
    ) {}
}
```

#### UpdateRoundData
Similar to CreateRoundData but all fields optional (Sometimes).

#### RoundData (Response DTO)
**Location:** `app/Application/Competition/DTOs/RoundData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use App\Domain\Competition\Entities\Round;
use Spatie\LaravelData\Data;

final class RoundData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly int $season_id,
        public readonly int $round_number,
        public readonly ?string $name,
        public readonly string $slug,
        public readonly string $scheduled_at,
        public readonly string $timezone,
        public readonly int $platform_track_id,
        public readonly ?string $track_layout,
        public readonly ?string $track_conditions,
        public readonly ?string $technical_notes,
        public readonly ?string $stream_url,
        public readonly ?string $internal_notes,
        public readonly string $status,
        public readonly string $status_label,
        public readonly int $created_by_user_id,
        public readonly string $created_at,
        public readonly string $updated_at,
        public readonly ?string $deleted_at,
    ) {}

    public static function fromEntity(Round $round): self
    {
        return new self(
            id: $round->id() ?? 0,
            season_id: $round->seasonId(),
            round_number: $round->roundNumber()->value(),
            name: $round->name()?->value(),
            slug: $round->slug()->value(),
            scheduled_at: $round->scheduledAt()->format('Y-m-d H:i:s'),
            timezone: $round->timezone(),
            platform_track_id: $round->platformTrackId(),
            track_layout: $round->trackLayout(),
            track_conditions: $round->trackConditions(),
            technical_notes: $round->technicalNotes(),
            stream_url: $round->streamUrl(),
            internal_notes: $round->internalNotes(),
            status: $round->status()->value,
            status_label: $round->status()->label(),
            created_by_user_id: $round->createdByUserId(),
            created_at: $round->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $round->updatedAt()->format('Y-m-d H:i:s'),
            deleted_at: $round->deletedAt()?->format('Y-m-d H:i:s'),
        );
    }
}
```

#### CreateRaceData, UpdateRaceData, RaceData
Similar pattern, with all race configuration fields.

---

### 2. Application Services

#### RoundApplicationService
**Location:** `app/Application/Competition/Services/RoundApplicationService.php`

**Responsibilities:**
- Orchestrate round CRUD operations
- Manage transactions
- Dispatch domain events
- Return DTOs
- Handle authorization

```php
<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Competition\DTOs\CreateRoundData;
use App\Application\Competition\DTOs\UpdateRoundData;
use App\Application\Competition\DTOs\RoundData;
use App\Domain\Competition\Entities\Round;
use App\Domain\Competition\Repositories\RoundRepositoryInterface;
use App\Domain\Competition\ValueObjects\RoundName;
use App\Domain\Competition\ValueObjects\RoundNumber;
use App\Domain\Competition\ValueObjects\RoundSlug;
use App\Domain\Competition\Exceptions\RoundNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use DateTimeImmutable;

final class RoundApplicationService
{
    public function __construct(
        private readonly RoundRepositoryInterface $roundRepository,
    ) {}

    public function createRound(
        CreateRoundData $data,
        int $seasonId,
        string $timezone,
        int $userId,
    ): RoundData {
        return DB::transaction(function () use ($data, $seasonId, $timezone, $userId) {
            // Generate slug
            $slug = RoundSlug::fromName($data->name, $data->round_number);
            $uniqueSlug = RoundSlug::from(
                $this->roundRepository->generateUniqueSlug($slug->value(), $seasonId)
            );

            // Create entity
            $round = Round::create(
                seasonId: $seasonId,
                roundNumber: RoundNumber::from($data->round_number),
                name: $data->name ? RoundName::from($data->name) : null,
                slug: $uniqueSlug,
                scheduledAt: new DateTimeImmutable($data->scheduled_at),
                timezone: $timezone,
                platformTrackId: $data->platform_track_id,
                trackLayout: $data->track_layout,
                trackConditions: $data->track_conditions,
                technicalNotes: $data->technical_notes,
                streamUrl: $data->stream_url,
                internalNotes: $data->internal_notes,
                createdByUserId: $userId,
            );

            // Save (sets ID)
            $this->roundRepository->save($round);

            // Record creation event (now has ID)
            $round->recordCreationEvent();

            // Dispatch events
            $this->dispatchEvents($round);

            return RoundData::fromEntity($round);
        });
    }

    public function updateRound(int $roundId, UpdateRoundData $data): RoundData
    {
        return DB::transaction(function () use ($roundId, $data) {
            $round = $this->roundRepository->findById($roundId);

            // Generate slug if name changed
            $slug = $data->name
                ? RoundSlug::fromName($data->name, $data->round_number ?? $round->roundNumber()->value())
                : $round->slug();

            $uniqueSlug = RoundSlug::from(
                $this->roundRepository->generateUniqueSlug(
                    $slug->value(),
                    $round->seasonId(),
                    $roundId
                )
            );

            $round->updateDetails(
                roundNumber: $data->round_number ? RoundNumber::from($data->round_number) : $round->roundNumber(),
                name: $data->name ? RoundName::from($data->name) : $round->name(),
                slug: $uniqueSlug,
                scheduledAt: $data->scheduled_at ? new DateTimeImmutable($data->scheduled_at) : $round->scheduledAt(),
                platformTrackId: $data->platform_track_id ?? $round->platformTrackId(),
                trackLayout: $data->track_layout ?? $round->trackLayout(),
                trackConditions: $data->track_conditions ?? $round->trackConditions(),
                technicalNotes: $data->technical_notes ?? $round->technicalNotes(),
                streamUrl: $data->stream_url ?? $round->streamUrl(),
                internalNotes: $data->internal_notes ?? $round->internalNotes(),
            );

            $this->roundRepository->save($round);
            $this->dispatchEvents($round);

            return RoundData::fromEntity($round);
        });
    }

    public function getRound(int $roundId): RoundData
    {
        $round = $this->roundRepository->findById($roundId);
        return RoundData::fromEntity($round);
    }

    /** @return array<RoundData> */
    public function getRoundsBySeason(int $seasonId): array
    {
        $rounds = $this->roundRepository->findBySeasonId($seasonId);
        return array_map(
            fn(Round $round) => RoundData::fromEntity($round),
            $rounds
        );
    }

    public function deleteRound(int $roundId): void
    {
        DB::transaction(function () use ($roundId) {
            $round = $this->roundRepository->findById($roundId);
            $round->delete();
            $this->roundRepository->delete($round);
            $this->dispatchEvents($round);
        });
    }

    public function changeRoundStatus(int $roundId, string $status): RoundData
    {
        return DB::transaction(function () use ($roundId, $status) {
            $round = $this->roundRepository->findById($roundId);
            $round->changeStatus(RoundStatus::from($status));
            $this->roundRepository->save($round);
            $this->dispatchEvents($round);
            return RoundData::fromEntity($round);
        });
    }

    public function getNextRoundNumber(int $seasonId): int
    {
        return $this->roundRepository->getNextRoundNumber($seasonId);
    }

    private function dispatchEvents(Round $round): void
    {
        foreach ($round->releaseEvents() as $event) {
            Event::dispatch($event);
        }
    }
}
```

#### RaceApplicationService
Similar pattern, manages race CRUD operations.

---

## Infrastructure Layer

### 1. Eloquent Models

#### RoundEloquent
**Location:** `app/Infrastructure/Persistence/Eloquent/Models/Round.php`

```php
<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $season_id
 * @property int $round_number
 * @property string|null $name
 * @property string $slug
 * @property string $scheduled_at
 * @property string $timezone
 * @property int $platform_track_id
 * @property string|null $track_layout
 * @property string|null $track_conditions
 * @property string|null $technical_notes
 * @property string|null $stream_url
 * @property string|null $internal_notes
 * @property string $status
 * @property int $created_by_user_id
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 */
final class Round extends Model
{
    use SoftDeletes;

    protected $table = 'rounds';

    protected $fillable = [
        'season_id',
        'round_number',
        'name',
        'slug',
        'scheduled_at',
        'timezone',
        'platform_track_id',
        'track_layout',
        'track_conditions',
        'technical_notes',
        'stream_url',
        'internal_notes',
        'status',
        'created_by_user_id',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relationships
    public function season(): BelongsTo
    {
        return $this->belongsTo(SeasonEloquent::class, 'season_id');
    }

    public function platformTrack(): BelongsTo
    {
        return $this->belongsTo(PlatformTrack::class, 'platform_track_id');
    }

    public function races(): HasMany
    {
        return $this->hasMany(Race::class, 'round_id');
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
```

#### RaceEloquent (Race model)
Similar pattern with JSON casts for `points_system` and `bonus_points`.

---

### 2. Repository Implementations

#### EloquentRoundRepository
**Location:** `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentRoundRepository.php`

```php
<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Competition\Entities\Round;
use App\Domain\Competition\Repositories\RoundRepositoryInterface;
use App\Domain\Competition\ValueObjects\RoundName;
use App\Domain\Competition\ValueObjects\RoundNumber;
use App\Domain\Competition\ValueObjects\RoundSlug;
use App\Domain\Competition\ValueObjects\RoundStatus;
use App\Domain\Competition\Exceptions\RoundNotFoundException;
use App\Infrastructure\Persistence\Eloquent\Models\Round as RoundEloquent;
use DateTimeImmutable;

final class EloquentRoundRepository implements RoundRepositoryInterface
{
    public function save(Round $round): void
    {
        if ($round->id() === null) {
            // Create new
            $eloquent = new RoundEloquent();
            $this->fillEloquentModel($eloquent, $round);
            $eloquent->save();
            $round->setId($eloquent->id);
        } else {
            // Update existing
            $eloquent = RoundEloquent::findOrFail($round->id());
            $this->fillEloquentModel($eloquent, $round);
            $eloquent->save();
        }
    }

    public function findById(int $id): Round
    {
        $eloquent = RoundEloquent::find($id);

        if ($eloquent === null) {
            throw RoundNotFoundException::withId($id);
        }

        return $this->toDomainEntity($eloquent);
    }

    /** @return array<Round> */
    public function findBySeasonId(int $seasonId): array
    {
        $eloquentModels = RoundEloquent::where('season_id', $seasonId)
            ->orderBy('round_number')
            ->get();

        return $eloquentModels->map(fn($model) => $this->toDomainEntity($model))->all();
    }

    public function delete(Round $round): void
    {
        if ($round->id() === null) {
            return;
        }

        $eloquent = RoundEloquent::find($round->id());
        if ($eloquent !== null) {
            $eloquent->delete(); // Soft delete
        }
    }

    public function generateUniqueSlug(string $baseSlug, int $seasonId, ?int $excludeId = null): string
    {
        $slug = $baseSlug;
        $counter = 1;

        while ($this->slugExists($slug, $seasonId, $excludeId)) {
            $slug = $baseSlug . '-' . str_pad((string)$counter, 2, '0', STR_PAD_LEFT);
            $counter++;
        }

        return $slug;
    }

    public function getNextRoundNumber(int $seasonId): int
    {
        $maxRound = RoundEloquent::where('season_id', $seasonId)->max('round_number');
        return ($maxRound ?? 0) + 1;
    }

    public function exists(int $id): bool
    {
        return RoundEloquent::where('id', $id)->exists();
    }

    private function slugExists(string $slug, int $seasonId, ?int $excludeId): bool
    {
        $query = RoundEloquent::where('season_id', $seasonId)
            ->where('slug', $slug);

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    private function fillEloquentModel(RoundEloquent $model, Round $entity): void
    {
        $model->season_id = $entity->seasonId();
        $model->round_number = $entity->roundNumber()->value();
        $model->name = $entity->name()?->value();
        $model->slug = $entity->slug()->value();
        $model->scheduled_at = $entity->scheduledAt();
        $model->timezone = $entity->timezone();
        $model->platform_track_id = $entity->platformTrackId();
        $model->track_layout = $entity->trackLayout();
        $model->track_conditions = $entity->trackConditions();
        $model->technical_notes = $entity->technicalNotes();
        $model->stream_url = $entity->streamUrl();
        $model->internal_notes = $entity->internalNotes();
        $model->status = $entity->status()->value;
        $model->created_by_user_id = $entity->createdByUserId();
    }

    private function toDomainEntity(RoundEloquent $model): Round
    {
        return Round::reconstitute(
            id: $model->id,
            seasonId: $model->season_id,
            roundNumber: RoundNumber::from($model->round_number),
            name: $model->name ? RoundName::from($model->name) : null,
            slug: RoundSlug::from($model->slug),
            scheduledAt: new DateTimeImmutable($model->scheduled_at->toDateTimeString()),
            timezone: $model->timezone,
            platformTrackId: $model->platform_track_id,
            trackLayout: $model->track_layout,
            trackConditions: $model->track_conditions,
            technicalNotes: $model->technical_notes,
            streamUrl: $model->stream_url,
            internalNotes: $model->internal_notes,
            status: RoundStatus::from($model->status),
            createdByUserId: $model->created_by_user_id,
            createdAt: new DateTimeImmutable($model->created_at->toDateTimeString()),
            updatedAt: new DateTimeImmutable($model->updated_at->toDateTimeString()),
            deletedAt: $model->deleted_at ? new DateTimeImmutable($model->deleted_at->toDateTimeString()) : null,
        );
    }
}
```

#### EloquentRaceRepository
Similar pattern for Race entities.

---

### 3. Service Provider Registration

**Location:** `app/Providers/RepositoryServiceProvider.php`

```php
// Add bindings:
$this->app->bind(
    RoundRepositoryInterface::class,
    EloquentRoundRepository::class
);

$this->app->bind(
    RaceRepositoryInterface::class,
    EloquentRaceRepository::class
);
```

---

## Interface Layer

### 1. Controllers

#### RoundController
**Location:** `app/Http/Controllers/User/RoundController.php`

**Pattern:** Thin controllers (3-5 lines per method)

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\CreateRoundData;
use App\Application\Competition\DTOs\UpdateRoundData;
use App\Application\Competition\Services\RoundApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class RoundController extends Controller
{
    public function __construct(
        private readonly RoundApplicationService $roundService,
    ) {}

    public function index(int $seasonId): JsonResponse
    {
        $rounds = $this->roundService->getRoundsBySeason($seasonId);
        return ApiResponse::success($rounds);
    }

    public function store(CreateRoundData $data, int $seasonId): JsonResponse
    {
        // TODO: Get timezone from season/league
        // TODO: Authorize user owns league
        $timezone = 'UTC'; // Placeholder
        $userId = auth()->id();

        $round = $this->roundService->createRound($data, $seasonId, $timezone, $userId);
        return ApiResponse::created($round->toArray(), 'Round created successfully');
    }

    public function show(int $roundId): JsonResponse
    {
        $round = $this->roundService->getRound($roundId);
        return ApiResponse::success($round->toArray());
    }

    public function update(UpdateRoundData $data, int $roundId): JsonResponse
    {
        // TODO: Authorize user owns league
        $round = $this->roundService->updateRound($roundId, $data);
        return ApiResponse::success($round->toArray(), 'Round updated successfully');
    }

    public function destroy(int $roundId): JsonResponse
    {
        // TODO: Authorize user owns league
        $this->roundService->deleteRound($roundId);
        return ApiResponse::success(null, 'Round deleted successfully');
    }

    public function nextRoundNumber(int $seasonId): JsonResponse
    {
        $nextNumber = $this->roundService->getNextRoundNumber($seasonId);
        return ApiResponse::success(['next_round_number' => $nextNumber]);
    }
}
```

#### RaceController
Similar pattern for race CRUD operations.

#### PlatformSettingsController
**Location:** `app/Http/Controllers/User/PlatformSettingsController.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class PlatformSettingsController extends Controller
{
    public function getRaceSettings(int $platformId): JsonResponse
    {
        // Load config based on platform slug/name
        // For now, hardcoded mapping (improve later with platform repository)
        $platformSlug = $this->getPlatformSlug($platformId); // e.g., 'gt7', 'acc', 'iracing'

        $settings = config("race_settings.{$platformSlug}", []);

        if (empty($settings)) {
            return ApiResponse::error('Platform settings not found', null, 404);
        }

        return ApiResponse::success($settings);
    }

    private function getPlatformSlug(int $platformId): string
    {
        // TODO: Fetch from platforms table
        // Placeholder mapping
        $mapping = [
            1 => 'gt7',
            2 => 'acc',
            3 => 'iracing',
        ];

        return $mapping[$platformId] ?? 'gt7';
    }
}
```

---

### 2. Routes

**Location:** `routes/subdomain.php`

```php
// App subdomain (user dashboard)
Route::domain('app.virtualracingleagues.localhost')->group(function () {
    Route::prefix('api')->middleware(['auth:web', 'user.authenticate'])->group(function () {

        // Round routes
        Route::get('/seasons/{seasonId}/rounds', [RoundController::class, 'index']);
        Route::post('/seasons/{seasonId}/rounds', [RoundController::class, 'store']);
        Route::get('/seasons/{seasonId}/rounds/next-number', [RoundController::class, 'nextRoundNumber']);
        Route::get('/rounds/{roundId}', [RoundController::class, 'show']);
        Route::put('/rounds/{roundId}', [RoundController::class, 'update']);
        Route::delete('/rounds/{roundId}', [RoundController::class, 'destroy']);

        // Race routes
        Route::get('/rounds/{roundId}/races', [RaceController::class, 'index']);
        Route::post('/rounds/{roundId}/races', [RaceController::class, 'store']);
        Route::get('/races/{raceId}', [RaceController::class, 'show']);
        Route::put('/races/{raceId}', [RaceController::class, 'update']);
        Route::delete('/races/{raceId}', [RaceController::class, 'destroy']);

        // Platform settings
        Route::get('/platforms/{platformId}/race-settings', [PlatformSettingsController::class, 'getRaceSettings']);
    });
});
```

---

## Platform Settings Configuration

### Config File Structure

**Location:** `config/race_settings/gt7.php`

```php
<?php

return [
    'weather_conditions' => [
        ['value' => 'clear', 'label' => 'Clear/Dry'],
        ['value' => 'wet', 'label' => 'Wet/Rain'],
        ['value' => 'dynamic', 'label' => 'Dynamic Weather'],
    ],

    'tire_restrictions' => [
        ['value' => 'any', 'label' => 'Any Compound'],
        ['value' => 'soft_only', 'label' => 'Soft Only'],
        ['value' => 'medium_only', 'label' => 'Medium Only'],
        ['value' => 'hard_only', 'label' => 'Hard Only'],
        ['value' => 'multiple_required', 'label' => 'Multiple Compounds Required'],
    ],

    'fuel_usage' => [
        ['value' => 'standard', 'label' => 'Standard'],
        ['value' => 'limited', 'label' => 'Limited Fuel'],
        ['value' => 'unlimited', 'label' => 'Unlimited'],
    ],

    'damage_model' => [
        ['value' => 'off', 'label' => 'Off (No Damage)'],
        ['value' => 'visual', 'label' => 'Visual Only'],
        ['value' => 'mechanical', 'label' => 'Mechanical Damage'],
        ['value' => 'full', 'label' => 'Full Damage'],
        ['value' => 'simulation', 'label' => 'Simulation (Realistic)'],
    ],
];
```

Create similar files for:
- `config/race_settings/acc.php` (Assetto Corsa Competizione)
- `config/race_settings/iracing.php` (iRacing)
- `config/race_settings/f1_2024.php` (F1 2024)
- etc.

---

## Database Migrations

### rounds Table Migration

**Location:** `database/migrations/YYYY_MM_DD_HHMMSS_create_rounds_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rounds', function (Blueprint $table) {
            $table->id();

            $table->foreignId('season_id')
                ->constrained('seasons')
                ->onDelete('cascade')
                ->comment('Season this round belongs to');

            // Basic Info
            $table->integer('round_number')->comment('Round number (1-99)');
            $table->string('name', 100)->nullable()->comment('Optional round name');
            $table->string('slug', 150)->comment('URL-friendly slug');

            // Schedule
            $table->dateTime('scheduled_at')->comment('Round date and time');
            $table->string('timezone', 50)->comment('Timezone (inherited from league)');

            // Track
            $table->foreignId('platform_track_id')
                ->constrained('platform_tracks')
                ->onDelete('restrict')
                ->comment('Track for this round');
            $table->string('track_layout', 100)->nullable()->comment('Track layout/configuration');
            $table->text('track_conditions')->nullable()->comment('Track conditions description');

            // Specifications
            $table->text('technical_notes')->nullable()->comment('BOP, restrictions, etc.');
            $table->string('stream_url', 255)->nullable()->comment('Stream/broadcast URL');
            $table->text('internal_notes')->nullable()->comment('Internal notes for organizers');

            // Status
            $table->enum('status', ['scheduled', 'pre_race', 'in_progress', 'completed', 'cancelled'])
                ->default('scheduled')
                ->comment('Round status');

            // Metadata
            $table->foreignId('created_by_user_id')
                ->constrained('users')
                ->onDelete('restrict')
                ->comment('User who created this round');

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('season_id');
            $table->index('status');
            $table->index('scheduled_at');
            $table->unique(['season_id', 'slug'], 'unique_season_slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rounds');
    }
};
```

### races Table Migration

**Location:** `database/migrations/YYYY_MM_DD_HHMMSS_create_races_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('races', function (Blueprint $table) {
            $table->id();

            $table->foreignId('round_id')
                ->constrained('rounds')
                ->onDelete('cascade')
                ->comment('Round this race belongs to');

            // Basic Info
            $table->integer('race_number')->comment('Race number within round (1, 2, 3...)');
            $table->string('name', 100)->nullable()->comment('Optional race name');
            $table->string('race_type', 50)->nullable()->comment('sprint, feature, endurance, etc.');

            // Qualifying Configuration
            $table->enum('qualifying_format', ['standard', 'time_trial', 'none', 'previous_race'])
                ->comment('Qualifying format');
            $table->integer('qualifying_length')->nullable()->comment('Qualifying session length in minutes');
            $table->string('qualifying_tire', 50)->nullable()->comment('Tire compound for qualifying');

            // Starting Grid Determination
            $table->enum('grid_source', [
                'qualifying',
                'previous_race',
                'reverse_previous',
                'championship',
                'reverse_championship',
                'manual'
            ])->comment('How starting grid is determined');
            $table->foreignId('grid_source_race_id')
                ->nullable()
                ->constrained('races')
                ->onDelete('set null')
                ->comment('Reference to previous race if grid_source uses it');

            // Race Length
            $table->enum('length_type', ['laps', 'time'])->comment('Race length type');
            $table->integer('length_value')->comment('Number of laps or minutes');
            $table->boolean('extra_lap_after_time')->default(true)->comment('Plus 1 lap after time expires');

            // Race Settings (Platform-Specific - stored as strings)
            $table->string('weather', 100)->nullable()->comment('Weather conditions');
            $table->string('tire_restrictions', 100)->nullable()->comment('Tire restrictions');
            $table->string('fuel_usage', 100)->nullable()->comment('Fuel usage setting');
            $table->string('damage_model', 100)->nullable()->comment('Damage model setting');

            // Penalties & Rules
            $table->boolean('track_limits_enforced')->default(true);
            $table->boolean('false_start_detection')->default(true);
            $table->boolean('collision_penalties')->default(true);
            $table->boolean('mandatory_pit_stop')->default(false);
            $table->integer('minimum_pit_time')->nullable()->comment('Minimum pit stop time in seconds');

            // Assists
            $table->text('assists_restrictions')->nullable()->comment('Allowed/forbidden assists');

            // Division Support
            $table->boolean('race_divisions')->default(false)->comment('If true, race has separate results per division');

            // Points System (JSON)
            $table->json('points_system')->comment('Position to points mapping');
            $table->json('bonus_points')->nullable()->comment('Bonus points configuration');
            $table->integer('dnf_points')->default(0)->comment('Points for DNF');
            $table->integer('dns_points')->default(0)->comment('Points for DNS');

            // Notes
            $table->text('race_notes')->nullable()->comment('Race-specific notes');

            $table->timestamps();

            // Indexes
            $table->index('round_id');
            $table->index(['round_id', 'race_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('races');
    }
};
```

---

## Testing Strategy

### Unit Tests (Domain Layer)

#### RoundEntityTest
**Location:** `tests/Unit/Domain/Competition/Entities/RoundTest.php`

```php
<?php

namespace Tests\Unit\Domain\Competition\Entities;

use Tests\TestCase;
use App\Domain\Competition\Entities\Round;
use App\Domain\Competition\ValueObjects\RoundNumber;
use App\Domain\Competition\ValueObjects\RoundName;
use App\Domain\Competition\ValueObjects\RoundSlug;
use App\Domain\Competition\ValueObjects\RoundStatus;
use PHPUnit\Framework\Attributes\Test;
use DateTimeImmutable;

class RoundTest extends TestCase
{
    #[Test]
    public function it_creates_new_round_with_required_fields(): void
    {
        $round = Round::create(
            seasonId: 1,
            roundNumber: RoundNumber::from(5),
            name: RoundName::from('Season Opener'),
            slug: RoundSlug::from('season-opener'),
            scheduledAt: new DateTimeImmutable('2025-02-18 19:00:00'),
            timezone: 'Australia/Sydney',
            platformTrackId: 10,
            trackLayout: null,
            trackConditions: null,
            technicalNotes: null,
            streamUrl: null,
            internalNotes: null,
            createdByUserId: 1,
        );

        $this->assertNull($round->id());
        $this->assertEquals(1, $round->seasonId());
        $this->assertEquals(5, $round->roundNumber()->value());
        $this->assertEquals('Season Opener', $round->name()->value());
        $this->assertEquals('season-opener', $round->slug()->value());
        $this->assertEquals(RoundStatus::SCHEDULED, $round->status());
    }

    #[Test]
    public function it_updates_round_details(): void
    {
        $round = Round::create(/* ... */);

        $round->updateDetails(
            roundNumber: RoundNumber::from(6),
            name: RoundName::from('Updated Name'),
            slug: RoundSlug::from('updated-name'),
            scheduledAt: new DateTimeImmutable('2025-02-25 19:00:00'),
            platformTrackId: 11,
            trackLayout: 'GP Layout',
            trackConditions: 'Dry, 20°C',
            technicalNotes: 'BOP enabled',
            streamUrl: 'https://twitch.tv/stream',
            internalNotes: 'Notes here',
        );

        $this->assertEquals(6, $round->roundNumber()->value());
        $this->assertEquals('Updated Name', $round->name()->value());
        $this->assertTrue($round->hasEvents());
    }

    #[Test]
    public function it_changes_status(): void
    {
        $round = Round::create(/* ... */);

        $round->changeStatus(RoundStatus::IN_PROGRESS);

        $this->assertEquals(RoundStatus::IN_PROGRESS, $round->status());
        $this->assertTrue($round->hasEvents());
    }

    #[Test]
    public function it_records_creation_event(): void
    {
        $round = Round::create(/* ... */);
        $round->setId(1);
        $round->recordCreationEvent();

        $events = $round->releaseEvents();

        $this->assertCount(1, $events);
        $this->assertInstanceOf(RoundCreated::class, $events[0]);
    }
}
```

#### Value Object Tests
Test validation rules for each value object (RoundNumber, RoundName, PointsSystem, etc.).

---

### Feature Tests (API Integration)

#### RoundApiTest
**Location:** `tests/Feature/User/RoundApiTest.php`

```php
<?php

namespace Tests\Feature\User;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\SeasonEloquent;
use App\Infrastructure\Persistence\Eloquent\Models\PlatformTrack;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class RoundApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private SeasonEloquent $season;
    private PlatformTrack $track;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->season = SeasonEloquent::factory()->create();
        $this->track = PlatformTrack::factory()->create();
    }

    #[Test]
    public function authenticated_user_can_create_round(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/seasons/{$this->season->id}/rounds", [
            'round_number' => 5,
            'name' => 'Season Opener',
            'scheduled_at' => '2025-02-18 19:00:00',
            'platform_track_id' => $this->track->id,
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure(['data' => ['id', 'round_number', 'slug']]);
        $this->assertDatabaseHas('rounds', [
            'round_number' => 5,
            'name' => 'Season Opener',
        ]);
    }

    #[Test]
    public function round_creation_requires_authentication(): void
    {
        $response = $this->postJson("/api/seasons/{$this->season->id}/rounds", [
            'round_number' => 5,
            'scheduled_at' => '2025-02-18 19:00:00',
            'platform_track_id' => $this->track->id,
        ]);

        $response->assertStatus(401);
    }

    #[Test]
    public function round_creation_validates_required_fields(): void
    {
        $this->actingAs($this->user, 'web');

        $response = $this->postJson("/api/seasons/{$this->season->id}/rounds", []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['round_number', 'scheduled_at', 'platform_track_id']);
    }

    #[Test]
    public function authenticated_user_can_list_rounds_for_season(): void
    {
        $this->actingAs($this->user, 'web');

        // Create rounds via service (not direct DB)
        // ...

        $response = $this->getJson("/api/seasons/{$this->season->id}/rounds");

        $response->assertStatus(200);
        $response->assertJsonStructure(['data' => [['id', 'round_number', 'name']]]);
    }

    #[Test]
    public function authenticated_user_can_update_round(): void
    {
        $this->actingAs($this->user, 'web');

        // Create round first
        // ...

        $response = $this->putJson("/api/rounds/{$roundId}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('rounds', ['name' => 'Updated Name']);
    }

    #[Test]
    public function authenticated_user_can_delete_round(): void
    {
        $this->actingAs($this->user, 'web');

        // Create round first
        // ...

        $response = $this->deleteJson("/api/rounds/{$roundId}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('rounds', ['id' => $roundId]);
    }
}
```

#### RaceApiTest
Similar tests for race CRUD operations.

---

## Implementation Checklist

### Phase 1: Round Backend (Domain → Infrastructure)

- [ ] **Domain Layer**
  - [ ] `RoundNumber` value object
  - [ ] `RoundName` value object
  - [ ] `RoundSlug` value object
  - [ ] `RoundStatus` enum
  - [ ] `Round` entity with create/reconstitute/update methods
  - [ ] `RoundCreated` event
  - [ ] `RoundUpdated` event
  - [ ] `RoundDeleted` event
  - [ ] `RoundStatusChanged` event
  - [ ] `RoundNotFoundException` exception
  - [ ] `InvalidRoundNumberException` exception
  - [ ] `RoundRepositoryInterface`
  - [ ] Unit tests for Round entity
  - [ ] Unit tests for value objects

- [ ] **Application Layer**
  - [ ] `CreateRoundData` DTO
  - [ ] `UpdateRoundData` DTO
  - [ ] `RoundData` response DTO
  - [ ] `RoundApplicationService` with all methods
  - [ ] Unit tests for service (if applicable)

- [ ] **Infrastructure Layer**
  - [ ] `rounds` table migration
  - [ ] `RoundEloquent` model
  - [ ] `EloquentRoundRepository` implementation
  - [ ] RoundFactory (for testing)
  - [ ] Register repository in `RepositoryServiceProvider`

- [ ] **Interface Layer**
  - [ ] `RoundController` with thin methods
  - [ ] Routes in `routes/subdomain.php`
  - [ ] Feature tests for Round API

- [ ] **Verification**
  - [ ] Run `composer test` (all pass)
  - [ ] Run `composer phpstan` (level 8, no errors)
  - [ ] Run `composer phpcs` (PSR-12, no errors)
  - [ ] Test API endpoints with Postman/Insomnia

---

### Phase 2: Race Backend (Domain → Infrastructure)

- [ ] **Platform Settings**
  - [ ] `config/race_settings/gt7.php`
  - [ ] `config/race_settings/acc.php`
  - [ ] `config/race_settings/iracing.php`
  - [ ] `PlatformSettingsController`
  - [ ] Route for platform settings API

- [ ] **Domain Layer**
  - [ ] `RaceName` value object
  - [ ] `RaceType` enum
  - [ ] `QualifyingFormat` enum
  - [ ] `GridSource` enum
  - [ ] `RaceLengthType` enum
  - [ ] `PointsSystem` value object
  - [ ] `Race` entity with create/reconstitute/update methods
  - [ ] `RaceCreated` event
  - [ ] `RaceUpdated` event
  - [ ] `RaceNotFoundException` exception
  - [ ] `InvalidRaceConfigurationException` exception
  - [ ] `RaceRepositoryInterface`
  - [ ] Unit tests for Race entity
  - [ ] Unit tests for value objects

- [ ] **Application Layer**
  - [ ] `CreateRaceData` DTO
  - [ ] `UpdateRaceData` DTO
  - [ ] `RaceData` response DTO
  - [ ] `RaceApplicationService` with all methods

- [ ] **Infrastructure Layer**
  - [ ] `races` table migration
  - [ ] `RaceEloquent` model
  - [ ] `EloquentRaceRepository` implementation
  - [ ] RaceFactory (for testing)
  - [ ] Register repository in `RepositoryServiceProvider`

- [ ] **Interface Layer**
  - [ ] `RaceController` with thin methods
  - [ ] Routes in `routes/subdomain.php`
  - [ ] Feature tests for Race API

- [ ] **Verification**
  - [ ] Run `composer test` (all pass)
  - [ ] Run `composer phpstan` (level 8, no errors)
  - [ ] Run `composer phpcs` (PSR-12, no errors)
  - [ ] Test API endpoints with Postman/Insomnia

---

### Final Backend Verification

- [ ] Full test suite passes (100%)
- [ ] Code coverage meets target (80%+)
- [ ] PHPStan level 8 passes
- [ ] PHPCS PSR-12 passes
- [ ] All API endpoints documented
- [ ] Database migrations run cleanly
- [ ] Seeders created (if applicable)
- [ ] Domain events dispatch correctly
- [ ] Authorization implemented (league ownership)
- [ ] Timezone handling correct (inherit from league)

---

## Notes

1. **Authorization**: Add middleware/policies to ensure users can only manage rounds for leagues they own
2. **Timezone**: Fetch timezone from season → competition → league relationship
3. **Track Filtering**: Ensure track API filters by platform_id from season
4. **Circular References**: Validate race grid_source_race_id doesn't create circular references
5. **Division Flag**: Ensure race_divisions flag integrates properly for future results feature
6. **Soft Deletes**: Rounds use soft deletes, races may cascade delete (decide based on requirements)

---

**End of Backend Implementation Plan**

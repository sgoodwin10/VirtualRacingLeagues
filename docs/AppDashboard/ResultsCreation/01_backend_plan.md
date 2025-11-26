# Race Results Feature - Backend Implementation Plan

## Overview

This document details the backend implementation for the Race Results feature following the project's DDD architecture.

**Agent**: `dev-be` (Laravel Backend Expert)

---

## Implementation Order

1. Database Migration
2. Domain Layer (Entity, Value Objects, Events, Exceptions, Repository Interface)
3. Infrastructure Layer (Eloquent Model, Repository Implementation)
4. Application Layer (DTOs, Application Service)
5. Interface Layer (Controller, Form Requests)
6. Routes
7. Tests

---

## Step 1: Database Migration

### File: `database/migrations/2025_xx_xx_create_race_results_table.php`

```php
Schema::create('race_results', function (Blueprint $table) {
    $table->id();
    $table->foreignId('race_id')->constrained('races')->cascadeOnDelete();
    $table->foreignId('driver_id')->constrained('season_drivers')->cascadeOnDelete();
    $table->unsignedSmallInteger('position')->nullable();
    $table->string('race_time', 15)->nullable();      // hh:mm:ss.ms format
    $table->string('race_time_difference', 15)->nullable();
    $table->string('fastest_lap', 15)->nullable();
    $table->string('penalties', 15)->nullable();
    $table->boolean('has_fastest_lap')->default(false);
    $table->boolean('has_pole')->default(false);
    $table->enum('status', ['pending', 'confirmed'])->default('pending');
    $table->unsignedSmallInteger('race_points')->default(0);
    $table->timestamps();

    // Unique constraint: one result per driver per race
    $table->unique(['race_id', 'driver_id']);

    // Index for querying results by race
    $table->index('race_id');
});
```

**Notes**:
- Using `string` for time fields to preserve exact format (hh:mm:ss.ms with variable milliseconds)
- `driver_id` references `season_drivers` (not `drivers` directly) as per existing pattern
- Cascade delete ensures results are removed when race is deleted

---

## Step 2: Domain Layer

### 2.1 Value Objects

#### File: `app/Domain/Competition/ValueObjects/RaceTime.php`

A value object for race time validation and formatting.

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

use App\Domain\Competition\Exceptions\InvalidRaceTimeException;

final readonly class RaceTime
{
    private function __construct(
        private ?string $value
    ) {}

    public static function fromString(?string $value): self
    {
        if ($value === null || $value === '') {
            return new self(null);
        }

        // Validate format: hh:mm:ss.ms (ms can be 1-3 digits)
        // Also allow +hh:mm:ss.ms for differences
        $pattern = '/^[+]?(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/';

        if (!preg_match($pattern, $value)) {
            throw InvalidRaceTimeException::invalidFormat($value);
        }

        return new self($value);
    }

    public function value(): ?string
    {
        return $this->value;
    }

    public function isNull(): bool
    {
        return $this->value === null;
    }

    /**
     * Convert to milliseconds for calculations.
     */
    public function toMilliseconds(): ?int
    {
        if ($this->value === null) {
            return null;
        }

        $isNegative = str_starts_with($this->value, '+');
        $timeStr = ltrim($this->value, '+');

        preg_match('/^(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/', $timeStr, $matches);

        $hours = (int) $matches[1];
        $minutes = (int) $matches[2];
        $seconds = (int) $matches[3];
        $ms = str_pad($matches[4], 3, '0', STR_PAD_RIGHT); // Normalize to 3 digits
        $milliseconds = (int) $ms;

        $total = ($hours * 3600000) + ($minutes * 60000) + ($seconds * 1000) + $milliseconds;

        return $isNegative ? $total : $total;
    }

    /**
     * Create from milliseconds.
     */
    public static function fromMilliseconds(int $ms): self
    {
        $hours = floor($ms / 3600000);
        $ms -= $hours * 3600000;

        $minutes = floor($ms / 60000);
        $ms -= $minutes * 60000;

        $seconds = floor($ms / 1000);
        $milliseconds = $ms - ($seconds * 1000);

        $value = sprintf('%02d:%02d:%02d.%03d', $hours, $minutes, $seconds, $milliseconds);

        return new self($value);
    }

    /**
     * Add another RaceTime (for calculating race_time from difference).
     */
    public function add(RaceTime $other): self
    {
        if ($this->value === null || $other->value === null) {
            return new self(null);
        }

        $totalMs = $this->toMilliseconds() + $other->toMilliseconds();
        return self::fromMilliseconds($totalMs);
    }

    public function equals(RaceTime $other): bool
    {
        return $this->value === $other->value;
    }
}
```

#### File: `app/Domain/Competition/ValueObjects/RaceResultStatus.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\ValueObjects;

enum RaceResultStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';

    public function isPending(): bool
    {
        return $this === self::PENDING;
    }

    public function isConfirmed(): bool
    {
        return $this === self::CONFIRMED;
    }
}
```

### 2.2 Entity

#### File: `app/Domain/Competition/Entities/RaceResult.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Entities;

use App\Domain\Competition\Events\RaceResultCreated;
use App\Domain\Competition\Events\RaceResultUpdated;
use App\Domain\Competition\ValueObjects\RaceResultStatus;
use App\Domain\Competition\ValueObjects\RaceTime;
use DateTimeImmutable;

final class RaceResult
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private int $raceId,
        private int $driverId,
        private ?int $position,
        private RaceTime $raceTime,
        private RaceTime $raceTimeDifference,
        private RaceTime $fastestLap,
        private RaceTime $penalties,
        private bool $hasFastestLap,
        private bool $hasPole,
        private RaceResultStatus $status,
        private int $racePoints,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
    ) {}

    public static function create(
        int $raceId,
        int $driverId,
        ?int $position = null,
        ?string $raceTime = null,
        ?string $raceTimeDifference = null,
        ?string $fastestLap = null,
        ?string $penalties = null,
        bool $hasFastestLap = false,
        bool $hasPole = false,
    ): self {
        $now = new DateTimeImmutable();

        $result = new self(
            id: null,
            raceId: $raceId,
            driverId: $driverId,
            position: $position,
            raceTime: RaceTime::fromString($raceTime),
            raceTimeDifference: RaceTime::fromString($raceTimeDifference),
            fastestLap: RaceTime::fromString($fastestLap),
            penalties: RaceTime::fromString($penalties),
            hasFastestLap: $hasFastestLap,
            hasPole: $hasPole,
            status: RaceResultStatus::PENDING,
            racePoints: 0,
            createdAt: $now,
            updatedAt: $now,
        );

        return $result;
    }

    public static function reconstitute(
        int $id,
        int $raceId,
        int $driverId,
        ?int $position,
        ?string $raceTime,
        ?string $raceTimeDifference,
        ?string $fastestLap,
        ?string $penalties,
        bool $hasFastestLap,
        bool $hasPole,
        RaceResultStatus $status,
        int $racePoints,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
    ): self {
        return new self(
            id: $id,
            raceId: $raceId,
            driverId: $driverId,
            position: $position,
            raceTime: RaceTime::fromString($raceTime),
            raceTimeDifference: RaceTime::fromString($raceTimeDifference),
            fastestLap: RaceTime::fromString($fastestLap),
            penalties: RaceTime::fromString($penalties),
            hasFastestLap: $hasFastestLap,
            hasPole: $hasPole,
            status: $status,
            racePoints: $racePoints,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
        );
    }

    public function recordCreationEvent(): void
    {
        if ($this->id === null) {
            throw new \LogicException('Cannot record creation event before entity has an ID');
        }

        $this->recordEvent(new RaceResultCreated(
            raceResultId: $this->id,
            raceId: $this->raceId,
            driverId: $this->driverId,
            position: $this->position,
            occurredAt: $this->createdAt->format('Y-m-d H:i:s'),
        ));
    }

    // Getters
    public function id(): ?int { return $this->id; }
    public function setId(int $id): void { $this->id = $id; }
    public function raceId(): int { return $this->raceId; }
    public function driverId(): int { return $this->driverId; }
    public function position(): ?int { return $this->position; }
    public function raceTime(): RaceTime { return $this->raceTime; }
    public function raceTimeDifference(): RaceTime { return $this->raceTimeDifference; }
    public function fastestLap(): RaceTime { return $this->fastestLap; }
    public function penalties(): RaceTime { return $this->penalties; }
    public function hasFastestLap(): bool { return $this->hasFastestLap; }
    public function hasPole(): bool { return $this->hasPole; }
    public function status(): RaceResultStatus { return $this->status; }
    public function racePoints(): int { return $this->racePoints; }
    public function createdAt(): DateTimeImmutable { return $this->createdAt; }
    public function updatedAt(): DateTimeImmutable { return $this->updatedAt; }

    // Business Logic
    public function update(
        ?int $position,
        ?string $raceTime,
        ?string $raceTimeDifference,
        ?string $fastestLap,
        ?string $penalties,
        bool $hasFastestLap,
        bool $hasPole,
    ): void {
        $changes = [];

        if ($this->position !== $position) {
            $changes['position'] = ['old' => $this->position, 'new' => $position];
            $this->position = $position;
        }

        $newRaceTime = RaceTime::fromString($raceTime);
        if (!$this->raceTime->equals($newRaceTime)) {
            $changes['race_time'] = ['old' => $this->raceTime->value(), 'new' => $raceTime];
            $this->raceTime = $newRaceTime;
        }

        $newRaceTimeDifference = RaceTime::fromString($raceTimeDifference);
        if (!$this->raceTimeDifference->equals($newRaceTimeDifference)) {
            $changes['race_time_difference'] = ['old' => $this->raceTimeDifference->value(), 'new' => $raceTimeDifference];
            $this->raceTimeDifference = $newRaceTimeDifference;
        }

        $newFastestLap = RaceTime::fromString($fastestLap);
        if (!$this->fastestLap->equals($newFastestLap)) {
            $changes['fastest_lap'] = ['old' => $this->fastestLap->value(), 'new' => $fastestLap];
            $this->fastestLap = $newFastestLap;
        }

        $newPenalties = RaceTime::fromString($penalties);
        if (!$this->penalties->equals($newPenalties)) {
            $changes['penalties'] = ['old' => $this->penalties->value(), 'new' => $penalties];
            $this->penalties = $newPenalties;
        }

        if ($this->hasFastestLap !== $hasFastestLap) {
            $changes['has_fastest_lap'] = ['old' => $this->hasFastestLap, 'new' => $hasFastestLap];
            $this->hasFastestLap = $hasFastestLap;
        }

        if ($this->hasPole !== $hasPole) {
            $changes['has_pole'] = ['old' => $this->hasPole, 'new' => $hasPole];
            $this->hasPole = $hasPole;
        }

        if (!empty($changes)) {
            $this->updatedAt = new DateTimeImmutable();
            $this->recordEvent(new RaceResultUpdated(
                raceResultId: $this->id ?? 0,
                raceId: $this->raceId,
                changes: $changes,
                occurredAt: $this->updatedAt->format('Y-m-d H:i:s'),
            ));
        }
    }

    public function setRacePoints(int $points): void
    {
        $this->racePoints = $points;
        $this->updatedAt = new DateTimeImmutable();
    }

    public function confirm(): void
    {
        $this->status = RaceResultStatus::CONFIRMED;
        $this->updatedAt = new DateTimeImmutable();
    }

    // Domain Events
    private function recordEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }

    /** @return array<object> */
    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];
        return $events;
    }

    public function clearEvents(): void
    {
        $this->domainEvents = [];
    }
}
```

### 2.3 Domain Events

#### File: `app/Domain/Competition/Events/RaceResultCreated.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

final readonly class RaceResultCreated
{
    public function __construct(
        public int $raceResultId,
        public int $raceId,
        public int $driverId,
        public ?int $position,
        public string $occurredAt,
    ) {}
}
```

#### File: `app/Domain/Competition/Events/RaceResultUpdated.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Events;

final readonly class RaceResultUpdated
{
    /** @param array<string, array{old: mixed, new: mixed}> $changes */
    public function __construct(
        public int $raceResultId,
        public int $raceId,
        public array $changes,
        public string $occurredAt,
    ) {}
}
```

### 2.4 Exceptions

#### File: `app/Domain/Competition/Exceptions/InvalidRaceTimeException.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

final class InvalidRaceTimeException extends DomainException
{
    public static function invalidFormat(string $value): self
    {
        return new self("Invalid race time format: '{$value}'. Expected format: hh:mm:ss.ms");
    }
}
```

#### File: `app/Domain/Competition/Exceptions/RaceResultException.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Exceptions;

use DomainException;

final class RaceResultException extends DomainException
{
    public static function duplicateDriver(int $raceId, int $driverId): self
    {
        return new self("Driver {$driverId} already has a result for race {$raceId}");
    }

    public static function notFound(int $id): self
    {
        return new self("Race result with ID {$id} not found");
    }

    public static function raceNotFound(int $raceId): self
    {
        return new self("Race with ID {$raceId} not found");
    }
}
```

### 2.5 Repository Interface

#### File: `app/Domain/Competition/Repositories/RaceResultRepositoryInterface.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Competition\Repositories;

use App\Domain\Competition\Entities\RaceResult;

interface RaceResultRepositoryInterface
{
    public function save(RaceResult $result): void;

    /** @param RaceResult[] $results */
    public function saveMany(array $results): void;

    public function findById(int $id): ?RaceResult;

    /** @return RaceResult[] */
    public function findByRaceId(int $raceId): array;

    public function findByRaceAndDriver(int $raceId, int $driverId): ?RaceResult;

    public function delete(RaceResult $result): void;

    public function deleteByRaceId(int $raceId): void;
}
```

---

## Step 3: Infrastructure Layer

### 3.1 Eloquent Model

#### File: `app/Infrastructure/Persistence/Eloquent/Models/RaceResult.php`

```php
<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $race_id
 * @property int $driver_id
 * @property int|null $position
 * @property string|null $race_time
 * @property string|null $race_time_difference
 * @property string|null $fastest_lap
 * @property string|null $penalties
 * @property bool $has_fastest_lap
 * @property bool $has_pole
 * @property string $status
 * @property int $race_points
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class RaceResult extends Model
{
    protected $table = 'race_results';

    protected $fillable = [
        'race_id',
        'driver_id',
        'position',
        'race_time',
        'race_time_difference',
        'fastest_lap',
        'penalties',
        'has_fastest_lap',
        'has_pole',
        'status',
        'race_points',
    ];

    protected $casts = [
        'has_fastest_lap' => 'boolean',
        'has_pole' => 'boolean',
        'race_points' => 'integer',
        'position' => 'integer',
    ];

    public function race(): BelongsTo
    {
        return $this->belongsTo(Race::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(SeasonDriverEloquent::class, 'driver_id');
    }
}
```

### 3.2 Repository Implementation

#### File: `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentRaceResultRepository.php`

```php
<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Competition\Entities\RaceResult as RaceResultEntity;
use App\Domain\Competition\Repositories\RaceResultRepositoryInterface;
use App\Domain\Competition\ValueObjects\RaceResultStatus;
use App\Infrastructure\Persistence\Eloquent\Models\RaceResult;
use DateTimeImmutable;

final class EloquentRaceResultRepository implements RaceResultRepositoryInterface
{
    public function save(RaceResultEntity $result): void
    {
        $model = $result->id()
            ? RaceResult::find($result->id())
            : new RaceResult();

        $model->race_id = $result->raceId();
        $model->driver_id = $result->driverId();
        $model->position = $result->position();
        $model->race_time = $result->raceTime()->value();
        $model->race_time_difference = $result->raceTimeDifference()->value();
        $model->fastest_lap = $result->fastestLap()->value();
        $model->penalties = $result->penalties()->value();
        $model->has_fastest_lap = $result->hasFastestLap();
        $model->has_pole = $result->hasPole();
        $model->status = $result->status()->value;
        $model->race_points = $result->racePoints();
        $model->save();

        if ($result->id() === null) {
            $result->setId($model->id);
        }
    }

    /** @param RaceResultEntity[] $results */
    public function saveMany(array $results): void
    {
        foreach ($results as $result) {
            $this->save($result);
        }
    }

    public function findById(int $id): ?RaceResultEntity
    {
        $model = RaceResult::find($id);
        return $model ? $this->toEntity($model) : null;
    }

    /** @return RaceResultEntity[] */
    public function findByRaceId(int $raceId): array
    {
        return RaceResult::where('race_id', $raceId)
            ->orderBy('position')
            ->get()
            ->map(fn (RaceResult $model) => $this->toEntity($model))
            ->all();
    }

    public function findByRaceAndDriver(int $raceId, int $driverId): ?RaceResultEntity
    {
        $model = RaceResult::where('race_id', $raceId)
            ->where('driver_id', $driverId)
            ->first();

        return $model ? $this->toEntity($model) : null;
    }

    public function delete(RaceResultEntity $result): void
    {
        if ($result->id()) {
            RaceResult::destroy($result->id());
        }
    }

    public function deleteByRaceId(int $raceId): void
    {
        RaceResult::where('race_id', $raceId)->delete();
    }

    private function toEntity(RaceResult $model): RaceResultEntity
    {
        return RaceResultEntity::reconstitute(
            id: $model->id,
            raceId: $model->race_id,
            driverId: $model->driver_id,
            position: $model->position,
            raceTime: $model->race_time,
            raceTimeDifference: $model->race_time_difference,
            fastestLap: $model->fastest_lap,
            penalties: $model->penalties,
            hasFastestLap: $model->has_fastest_lap,
            hasPole: $model->has_pole,
            status: RaceResultStatus::from($model->status),
            racePoints: $model->race_points,
            createdAt: new DateTimeImmutable($model->created_at->toDateTimeString()),
            updatedAt: new DateTimeImmutable($model->updated_at->toDateTimeString()),
        );
    }
}
```

---

## Step 4: Application Layer

### 4.1 DTOs

#### File: `app/Application/Competition/DTOs/RaceResultData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use App\Domain\Competition\Entities\RaceResult;
use Spatie\LaravelData\Data;

final class RaceResultData extends Data
{
    public function __construct(
        public int $id,
        public int $race_id,
        public int $driver_id,
        public ?int $position,
        public ?string $race_time,
        public ?string $race_time_difference,
        public ?string $fastest_lap,
        public ?string $penalties,
        public bool $has_fastest_lap,
        public bool $has_pole,
        public string $status,
        public int $race_points,
        public string $created_at,
        public string $updated_at,
        // Eager loaded driver info
        public ?array $driver = null,
    ) {}

    public static function fromEntity(RaceResult $entity, ?array $driverData = null): self
    {
        return new self(
            id: $entity->id(),
            race_id: $entity->raceId(),
            driver_id: $entity->driverId(),
            position: $entity->position(),
            race_time: $entity->raceTime()->value(),
            race_time_difference: $entity->raceTimeDifference()->value(),
            fastest_lap: $entity->fastestLap()->value(),
            penalties: $entity->penalties()->value(),
            has_fastest_lap: $entity->hasFastestLap(),
            has_pole: $entity->hasPole(),
            status: $entity->status()->value,
            race_points: $entity->racePoints(),
            created_at: $entity->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $entity->updatedAt()->format('Y-m-d H:i:s'),
            driver: $driverData,
        );
    }
}
```

#### File: `app/Application/Competition/DTOs/CreateRaceResultData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Data;

final class CreateRaceResultData extends Data
{
    public function __construct(
        public int $driver_id,
        public ?int $position = null,
        public ?string $race_time = null,
        public ?string $race_time_difference = null,
        public ?string $fastest_lap = null,
        public ?string $penalties = null,
        public bool $has_fastest_lap = false,
        public bool $has_pole = false,
    ) {}
}
```

#### File: `app/Application/Competition/DTOs/BulkRaceResultsData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Competition\DTOs;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;

final class BulkRaceResultsData extends Data
{
    /** @param DataCollection<CreateRaceResultData> $results */
    public function __construct(
        #[DataCollectionOf(CreateRaceResultData::class)]
        public DataCollection $results,
    ) {}
}
```

### 4.2 Application Service

#### File: `app/Application/Competition/Services/RaceResultApplicationService.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Competition\Services;

use App\Application\Competition\DTOs\BulkRaceResultsData;
use App\Application\Competition\DTOs\CreateRaceResultData;
use App\Application\Competition\DTOs\RaceResultData;
use App\Domain\Competition\Entities\RaceResult;
use App\Domain\Competition\Exceptions\RaceResultException;
use App\Domain\Competition\Repositories\RaceRepositoryInterface;
use App\Domain\Competition\Repositories\RaceResultRepositoryInterface;
use Illuminate\Support\Facades\DB;

final class RaceResultApplicationService
{
    public function __construct(
        private RaceResultRepositoryInterface $raceResultRepository,
        private RaceRepositoryInterface $raceRepository,
    ) {}

    /**
     * Get all results for a race.
     *
     * @return RaceResultData[]
     */
    public function getResultsForRace(int $raceId): array
    {
        $results = $this->raceResultRepository->findByRaceId($raceId);

        return array_map(
            fn (RaceResult $result) => RaceResultData::fromEntity($result),
            $results
        );
    }

    /**
     * Save/update results for a race (bulk operation).
     * Replaces all existing results for the race.
     *
     * @return RaceResultData[]
     */
    public function saveResults(int $raceId, BulkRaceResultsData $data): array
    {
        // Verify race exists
        $race = $this->raceRepository->findById($raceId);
        if (!$race) {
            throw RaceResultException::raceNotFound($raceId);
        }

        return DB::transaction(function () use ($raceId, $data) {
            // Delete existing results
            $this->raceResultRepository->deleteByRaceId($raceId);

            // Create new results
            $entities = [];
            foreach ($data->results as $resultData) {
                /** @var CreateRaceResultData $resultData */
                $entity = RaceResult::create(
                    raceId: $raceId,
                    driverId: $resultData->driver_id,
                    position: $resultData->position,
                    raceTime: $resultData->race_time,
                    raceTimeDifference: $resultData->race_time_difference,
                    fastestLap: $resultData->fastest_lap,
                    penalties: $resultData->penalties,
                    hasFastestLap: $resultData->has_fastest_lap,
                    hasPole: $resultData->has_pole,
                );
                $entities[] = $entity;
            }

            // Save all
            $this->raceResultRepository->saveMany($entities);

            // Record creation events
            foreach ($entities as $entity) {
                $entity->recordCreationEvent();
            }

            return array_map(
                fn (RaceResult $result) => RaceResultData::fromEntity($result),
                $entities
            );
        });
    }

    /**
     * Delete all results for a race.
     */
    public function deleteResults(int $raceId): void
    {
        $this->raceResultRepository->deleteByRaceId($raceId);
    }
}
```

---

## Step 5: Interface Layer

### 5.1 Form Request

#### File: `app/Http/Requests/User/BulkRaceResultsRequest.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

final class BulkRaceResultsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $timePattern = '/^[+]?(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/';

        return [
            'results' => ['required', 'array'],
            'results.*.driver_id' => ['required', 'integer', 'exists:season_drivers,id'],
            'results.*.position' => ['nullable', 'integer', 'min:1'],
            'results.*.race_time' => ['nullable', 'string', "regex:{$timePattern}"],
            'results.*.race_time_difference' => ['nullable', 'string', "regex:{$timePattern}"],
            'results.*.fastest_lap' => ['nullable', 'string', "regex:{$timePattern}"],
            'results.*.penalties' => ['nullable', 'string', "regex:{$timePattern}"],
            'results.*.has_fastest_lap' => ['boolean'],
            'results.*.has_pole' => ['boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'results.*.race_time.regex' => 'Race time must be in format hh:mm:ss.ms',
            'results.*.race_time_difference.regex' => 'Race time difference must be in format hh:mm:ss.ms',
            'results.*.fastest_lap.regex' => 'Fastest lap must be in format hh:mm:ss.ms',
            'results.*.penalties.regex' => 'Penalties must be in format hh:mm:ss.ms',
        ];
    }
}
```

### 5.2 Controller

#### File: `app/Http/Controllers/User/RaceResultController.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\User;

use App\Application\Competition\DTOs\BulkRaceResultsData;
use App\Application\Competition\Services\RaceResultApplicationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\BulkRaceResultsRequest;
use Illuminate\Http\JsonResponse;

final class RaceResultController extends Controller
{
    public function __construct(
        private RaceResultApplicationService $raceResultService,
    ) {}

    /**
     * Get all results for a race.
     */
    public function index(int $raceId): JsonResponse
    {
        $results = $this->raceResultService->getResultsForRace($raceId);
        return ApiResponse::success($results);
    }

    /**
     * Save/update results for a race (bulk operation).
     */
    public function store(BulkRaceResultsRequest $request, int $raceId): JsonResponse
    {
        $data = BulkRaceResultsData::from($request->validated());
        $results = $this->raceResultService->saveResults($raceId, $data);
        return ApiResponse::created($results);
    }

    /**
     * Delete all results for a race.
     */
    public function destroy(int $raceId): JsonResponse
    {
        $this->raceResultService->deleteResults($raceId);
        return ApiResponse::noContent();
    }
}
```

---

## Step 6: Routes

### File: `routes/subdomain.php` (Add to user dashboard domain)

```php
// Inside the app.virtualracingleagues.localhost domain group
// After existing race routes

// Race Results
Route::get('/races/{raceId}/results', [RaceResultController::class, 'index']);
Route::post('/races/{raceId}/results', [RaceResultController::class, 'store']);
Route::delete('/races/{raceId}/results', [RaceResultController::class, 'destroy']);
```

---

## Step 7: Service Provider Registration

### File: `app/Providers/AppServiceProvider.php` (Add binding)

```php
use App\Domain\Competition\Repositories\RaceResultRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentRaceResultRepository;

// In register() method
$this->app->bind(RaceResultRepositoryInterface::class, EloquentRaceResultRepository::class);
```

---

## Testing Plan

### Unit Tests

1. **RaceTime Value Object Tests**
   - Test valid format parsing
   - Test invalid format rejection
   - Test millisecond conversion
   - Test time addition

2. **RaceResult Entity Tests**
   - Test creation
   - Test update with change tracking
   - Test status transitions

### Feature Tests

1. **RaceResultController Tests**
   - GET `/races/{raceId}/results` - returns results
   - POST `/races/{raceId}/results` - creates results
   - DELETE `/races/{raceId}/results` - deletes results
   - Validation error handling
   - Non-existent race handling

---

## Summary

| Component | File | Status |
|-----------|------|--------|
| Migration | `create_race_results_table.php` | To create |
| Value Object | `RaceTime.php` | To create |
| Value Object | `RaceResultStatus.php` | To create |
| Entity | `RaceResult.php` | To create |
| Event | `RaceResultCreated.php` | To create |
| Event | `RaceResultUpdated.php` | To create |
| Exception | `InvalidRaceTimeException.php` | To create |
| Exception | `RaceResultException.php` | To create |
| Repository Interface | `RaceResultRepositoryInterface.php` | To create |
| Eloquent Model | `RaceResult.php` | To create |
| Repository | `EloquentRaceResultRepository.php` | To create |
| DTO | `RaceResultData.php` | To create |
| DTO | `CreateRaceResultData.php` | To create |
| DTO | `BulkRaceResultsData.php` | To create |
| Application Service | `RaceResultApplicationService.php` | To create |
| Form Request | `BulkRaceResultsRequest.php` | To create |
| Controller | `RaceResultController.php` | To create |
| Routes | `subdomain.php` | To update |
| Service Provider | `AppServiceProvider.php` | To update |

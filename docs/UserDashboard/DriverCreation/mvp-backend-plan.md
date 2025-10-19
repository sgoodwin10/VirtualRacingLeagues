# MVP Backend Implementation Plan: League-Level Driver Management

**Version:** 1.0 MVP
**Date:** October 18, 2025
**Architecture:** Domain-Driven Design (DDD) - Simplified
**Context:** User Dashboard (Authenticated Users)

---

## Table of Contents

1. [Overview](#overview)
2. [Domain Layer Design](#domain-layer-design)
3. [Application Layer Design](#application-layer-design)
4. [Infrastructure Layer Design](#infrastructure-layer-design)
5. [Interface Layer Design](#interface-layer-design)
6. [Database Schema](#database-schema)
7. [Implementation Order](#implementation-order)
8. [Testing Strategy](#testing-strategy)

---

## Overview

### MVP Scope

This plan implements a **simplified driver management system** focusing on core CRUD operations:
- Create driver and add to league
- Update league-specific driver settings
- Remove driver from league
- List/search drivers in league
- Simple CSV import (no preview)

**NOT in scope:**
- ❌ CSV import preview/conflict resolution
- ❌ Global driver editing (separate from league)
- ❌ Multi-league indicators in responses
- ❌ Advanced duplicate detection
- ❌ Driver participation statistics

### Architecture Principles

Following simplified DDD principles:
- **Domain Layer**: Pure PHP, business logic in entities
- **Application Layer**: Use case orchestration, simple DTOs
- **Infrastructure Layer**: Anemic Eloquent models, repositories
- **Interface Layer**: Thin controllers (3-5 lines per method)

---

## Domain Layer Design

### 1. Value Objects (Simplified)

#### DriverName

**Location:** `app/Domain/League/ValueObjects/DriverName.php`

```php
<?php

namespace App\Domain\League\ValueObjects;

use App\Domain\League\Exceptions\InvalidDriverNameException;

final readonly class DriverName
{
    private function __construct(
        private ?string $firstName,
        private ?string $lastName,
        private ?string $nickname
    ) {
        $this->validate();
    }

    public static function create(
        ?string $firstName,
        ?string $lastName,
        ?string $nickname = null
    ): self {
        return new self($firstName, $lastName, $nickname);
    }

    private function validate(): void
    {
        // At least first OR last name required
        if (empty($this->firstName) && empty($this->lastName)) {
            throw InvalidDriverNameException::nameRequired();
        }

        // Length validations
        if ($this->firstName && mb_strlen($this->firstName) > 100) {
            throw InvalidDriverNameException::firstNameTooLong();
        }

        if ($this->lastName && mb_strlen($this->lastName) > 100) {
            throw InvalidDriverNameException::lastNameTooLong();
        }

        if ($this->nickname && mb_strlen($this->nickname) > 100) {
            throw InvalidDriverNameException::nicknameTooLong();
        }
    }

    public function firstName(): ?string
    {
        return $this->firstName;
    }

    public function lastName(): ?string
    {
        return $this->lastName;
    }

    public function nickname(): ?string
    {
        return $this->nickname;
    }

    public function displayName(): string
    {
        if ($this->nickname) {
            return $this->nickname;
        }
        return trim(($this->firstName ?? '') . ' ' . ($this->lastName ?? ''));
    }

    public function fullName(): string
    {
        return trim(($this->firstName ?? '') . ' ' . ($this->lastName ?? ''));
    }
}
```

---

#### PlatformIdentifiers (Simplified - 3 Platforms Only)

**Location:** `app/Domain/League/ValueObjects/PlatformIdentifiers.php`

```php
<?php

namespace App\Domain\League\ValueObjects;

use App\Domain\League\Exceptions\InvalidPlatformIdentifiersException;

final readonly class PlatformIdentifiers
{
    private function __construct(
        private ?string $psnId,
        private ?string $gt7Id,
        private ?string $iracingId,
        private ?int $iracingCustomerId
    ) {
        $this->validate();
    }

    public static function create(
        ?string $psnId = null,
        ?string $gt7Id = null,
        ?string $iracingId = null,
        ?int $iracingCustomerId = null
    ): self {
        return new self($psnId, $gt7Id, $iracingId, $iracingCustomerId);
    }

    private function validate(): void
    {
        // At least ONE platform ID required
        if (empty($this->psnId)
            && empty($this->gt7Id)
            && empty($this->iracingId)
            && empty($this->iracingCustomerId)
        ) {
            throw InvalidPlatformIdentifiersException::noPlatformIdProvided();
        }

        // Length validations
        if ($this->psnId && mb_strlen($this->psnId) > 255) {
            throw InvalidPlatformIdentifiersException::fieldTooLong('psn_id');
        }

        if ($this->gt7Id && mb_strlen($this->gt7Id) > 255) {
            throw InvalidPlatformIdentifiersException::fieldTooLong('gt7_id');
        }

        if ($this->iracingId && mb_strlen($this->iracingId) > 255) {
            throw InvalidPlatformIdentifiersException::fieldTooLong('iracing_id');
        }
    }

    public function psnId(): ?string
    {
        return $this->psnId;
    }

    public function gt7Id(): ?string
    {
        return $this->gt7Id;
    }

    public function iracingId(): ?string
    {
        return $this->iracingId;
    }

    public function iracingCustomerId(): ?int
    {
        return $this->iracingCustomerId;
    }

    public function primaryPlatformId(): string
    {
        return $this->psnId
            ?? $this->gt7Id
            ?? $this->iracingId
            ?? (string) $this->iracingCustomerId
            ?? '';
    }
}
```

---

#### DriverStatus (Enum)

**Location:** `app/Domain/League/ValueObjects/DriverStatus.php`

```php
<?php

namespace App\Domain\League\ValueObjects;

enum DriverStatus: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case BANNED = 'banned';

    public static function default(): self
    {
        return self::ACTIVE;
    }

    public function isActive(): bool
    {
        return $this === self::ACTIVE;
    }

    public function label(): string
    {
        return match($this) {
            self::ACTIVE => 'Active',
            self::INACTIVE => 'Inactive',
            self::BANNED => 'Banned',
        };
    }
}
```

---

#### DriverNumber

**Location:** `app/Domain/League/ValueObjects/DriverNumber.php`

```php
<?php

namespace App\Domain\League\ValueObjects;

use App\Domain\League\Exceptions\InvalidDriverNumberException;

final readonly class DriverNumber
{
    private function __construct(
        private int $value
    ) {
        $this->validate();
    }

    public static function from(int $value): self
    {
        return new self($value);
    }

    private function validate(): void
    {
        if ($this->value < 1 || $this->value > 999) {
            throw InvalidDriverNumberException::outOfRange($this->value);
        }
    }

    public function value(): int
    {
        return $this->value;
    }
}
```

---

#### PhoneNumber

**Location:** `app/Domain/Shared/ValueObjects/PhoneNumber.php`

```php
<?php

namespace App\Domain\Shared\ValueObjects;

use App\Domain\Shared\Exceptions\InvalidPhoneNumberException;

final readonly class PhoneNumber
{
    private function __construct(
        private string $value
    ) {
        $this->validate();
    }

    public static function from(string $value): self
    {
        return new self($value);
    }

    public static function fromNullable(?string $value): ?self
    {
        return $value !== null && $value !== '' ? new self($value) : null;
    }

    private function validate(): void
    {
        if (empty(trim($this->value))) {
            throw InvalidPhoneNumberException::empty();
        }

        if (mb_strlen($this->value) > 20) {
            throw InvalidPhoneNumberException::tooLong();
        }
    }

    public function value(): string
    {
        return $this->value;
    }
}
```

---

### 2. Entities (Simplified)

#### Driver Entity

**Location:** `app/Domain/League/Entities/Driver.php`

```php
<?php

namespace App\Domain\League\Entities;

use App\Domain\League\ValueObjects\DriverName;
use App\Domain\League\ValueObjects\PlatformIdentifiers;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\PhoneNumber;
use App\Domain\League\Events\DriverCreated;
use App\Domain\League\Events\DriverUpdated;

final class Driver
{
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private DriverName $name,
        private PlatformIdentifiers $platforms,
        private ?EmailAddress $email,
        private ?PhoneNumber $phoneNumber
    ) {
    }

    public static function create(
        DriverName $name,
        PlatformIdentifiers $platforms,
        ?EmailAddress $email = null,
        ?PhoneNumber $phoneNumber = null
    ): self {
        return new self(null, $name, $platforms, $email, $phoneNumber);
    }

    public static function reconstitute(
        int $id,
        DriverName $name,
        PlatformIdentifiers $platforms,
        ?EmailAddress $email,
        ?PhoneNumber $phoneNumber
    ): self {
        return new self($id, $name, $platforms, $email, $phoneNumber);
    }

    public function updateName(DriverName $name): void
    {
        $this->name = $name;
        $this->recordEvent(new DriverUpdated($this));
    }

    public function updatePlatforms(PlatformIdentifiers $platforms): void
    {
        $this->platforms = $platforms;
        $this->recordEvent(new DriverUpdated($this));
    }

    public function updateContactInfo(?EmailAddress $email, ?PhoneNumber $phoneNumber): void
    {
        $this->email = $email;
        $this->phoneNumber = $phoneNumber;
        $this->recordEvent(new DriverUpdated($this));
    }

    public function recordCreationEvent(): void
    {
        $this->recordEvent(new DriverCreated($this));
    }

    private function recordEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }

    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];
        return $events;
    }

    // Getters
    public function id(): ?int
    {
        return $this->id;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function name(): DriverName
    {
        return $this->name;
    }

    public function platforms(): PlatformIdentifiers
    {
        return $this->platforms;
    }

    public function email(): ?EmailAddress
    {
        return $this->email;
    }

    public function phoneNumber(): ?PhoneNumber
    {
        return $this->phoneNumber;
    }
}
```

---

#### LeagueDriver Entity

**Location:** `app/Domain/League/Entities/LeagueDriver.php`

```php
<?php

namespace App\Domain\League\Entities;

use App\Domain\League\ValueObjects\DriverNumber;
use App\Domain\League\ValueObjects\DriverStatus;
use App\Domain\League\Events\DriverAddedToLeague;
use App\Domain\League\Events\DriverRemovedFromLeague;
use App\Domain\League\Events\LeagueDriverUpdated;
use App\Domain\League\Events\DriverStatusChanged;

final class LeagueDriver
{
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private int $leagueId,
        private int $driverId,
        private ?DriverNumber $driverNumber,
        private DriverStatus $status,
        private ?string $leagueNotes
    ) {
    }

    public static function create(
        int $leagueId,
        int $driverId,
        ?DriverNumber $driverNumber = null,
        ?DriverStatus $status = null,
        ?string $leagueNotes = null
    ): self {
        return new self(
            null,
            $leagueId,
            $driverId,
            $driverNumber,
            $status ?? DriverStatus::default(),
            $leagueNotes
        );
    }

    public static function reconstitute(
        int $id,
        int $leagueId,
        int $driverId,
        ?DriverNumber $driverNumber,
        DriverStatus $status,
        ?string $leagueNotes
    ): self {
        return new self($id, $leagueId, $driverId, $driverNumber, $status, $leagueNotes);
    }

    public function updateDriverNumber(?DriverNumber $driverNumber): void
    {
        $this->driverNumber = $driverNumber;
        $this->recordEvent(new LeagueDriverUpdated($this));
    }

    public function changeStatus(DriverStatus $status): void
    {
        $oldStatus = $this->status;
        $this->status = $status;
        $this->recordEvent(new DriverStatusChanged($this, $oldStatus, $status));
    }

    public function updateNotes(?string $notes): void
    {
        $this->leagueNotes = $notes;
        $this->recordEvent(new LeagueDriverUpdated($this));
    }

    public function recordCreationEvent(): void
    {
        $this->recordEvent(new DriverAddedToLeague($this));
    }

    private function recordEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }

    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];
        return $events;
    }

    // Getters
    public function id(): ?int
    {
        return $this->id;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function leagueId(): int
    {
        return $this->leagueId;
    }

    public function driverId(): int
    {
        return $this->driverId;
    }

    public function driverNumber(): ?DriverNumber
    {
        return $this->driverNumber;
    }

    public function status(): DriverStatus
    {
        return $this->status;
    }

    public function leagueNotes(): ?string
    {
        return $this->leagueNotes;
    }
}
```

---

### 3. Domain Events (Simplified)

**Location:** `app/Domain/League/Events/`

```php
// DriverCreated.php
final readonly class DriverCreated
{
    public function __construct(public Driver $driver) {}
}

// DriverUpdated.php
final readonly class DriverUpdated
{
    public function __construct(public Driver $driver) {}
}

// DriverAddedToLeague.php
final readonly class DriverAddedToLeague
{
    public function __construct(public LeagueDriver $leagueDriver) {}
}

// DriverRemovedFromLeague.php
final readonly class DriverRemovedFromLeague
{
    public function __construct(
        public int $leagueId,
        public int $driverId
    ) {}
}

// LeagueDriverUpdated.php
final readonly class LeagueDriverUpdated
{
    public function __construct(public LeagueDriver $leagueDriver) {}
}

// DriverStatusChanged.php
final readonly class DriverStatusChanged
{
    public function __construct(
        public LeagueDriver $leagueDriver,
        public DriverStatus $oldStatus,
        public DriverStatus $newStatus
    ) {}
}
```

---

### 4. Domain Exceptions

**Location:** `app/Domain/League/Exceptions/`

```php
// InvalidDriverNameException.php
final class InvalidDriverNameException extends \DomainException
{
    public static function nameRequired(): self
    {
        return new self('At least first name or last name is required');
    }

    public static function firstNameTooLong(): self
    {
        return new self('First name must not exceed 100 characters');
    }

    public static function lastNameTooLong(): self
    {
        return new self('Last name must not exceed 100 characters');
    }

    public static function nicknameTooLong(): self
    {
        return new self('Nickname must not exceed 100 characters');
    }
}

// InvalidPlatformIdentifiersException.php
final class InvalidPlatformIdentifiersException extends \DomainException
{
    public static function noPlatformIdProvided(): self
    {
        return new self('At least one platform ID is required');
    }

    public static function fieldTooLong(string $field): self
    {
        return new self("Platform field '{$field}' exceeds maximum length");
    }
}

// InvalidDriverNumberException.php
final class InvalidDriverNumberException extends \DomainException
{
    public static function outOfRange(int $value): self
    {
        return new self("Driver number must be between 1 and 999, got {$value}");
    }
}

// DriverNotFoundException.php
final class DriverNotFoundException extends \DomainException
{
    public static function withId(int $id): self
    {
        return new self("Driver with ID {$id} not found");
    }
}

// LeagueDriverNotFoundException.php
final class LeagueDriverNotFoundException extends \DomainException
{
    public static function withIds(int $leagueId, int $driverId): self
    {
        return new self("Driver {$driverId} not found in league {$leagueId}");
    }
}

// DriverAlreadyInLeagueException.php
final class DriverAlreadyInLeagueException extends \DomainException
{
    public static function withIds(int $leagueId, int $driverId): self
    {
        return new self("Driver {$driverId} is already in league {$leagueId}");
    }
}
```

---

### 5. Repository Interfaces

#### DriverRepositoryInterface

**Location:** `app/Domain/League/Repositories/DriverRepositoryInterface.php`

```php
<?php

namespace App\Domain\League\Repositories;

use App\Domain\League\Entities\Driver;

interface DriverRepositoryInterface
{
    public function findById(int $id): Driver;
    public function findByIdOrNull(int $id): ?Driver;
    public function save(Driver $driver): void;
    public function update(Driver $driver): void;
    public function delete(Driver $driver): void;
}
```

---

#### LeagueDriverRepositoryInterface

**Location:** `app/Domain/League/Repositories/LeagueDriverRepositoryInterface.php`

```php
<?php

namespace App\Domain\League\Repositories;

use App\Domain\League\Entities\LeagueDriver;
use App\Domain\League\ValueObjects\DriverStatus;

interface LeagueDriverRepositoryInterface
{
    public function findByLeagueAndDriver(int $leagueId, int $driverId): LeagueDriver;
    public function findByLeagueAndDriverOrNull(int $leagueId, int $driverId): ?LeagueDriver;
    public function findByLeague(int $leagueId): array;
    public function isDriverInLeague(int $leagueId, int $driverId): bool;
    public function save(LeagueDriver $leagueDriver): void;
    public function update(LeagueDriver $leagueDriver): void;
    public function delete(LeagueDriver $leagueDriver): void;
    public function countByLeagueAndStatus(int $leagueId, DriverStatus $status): int;

    // MVP: Check if platform ID exists in league
    public function existsByLeagueAndPlatformId(int $leagueId, string $platformField, string $platformValue): bool;
}
```

---

## Application Layer Design

### DTOs (Simplified)

#### CreateDriverData

**Location:** `app/Application/League/DTOs/CreateDriverData.php`

```php
<?php

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

final class CreateDriverData extends Data
{
    public function __construct(
        // Names
        public ?string $first_name,
        public ?string $last_name,
        public ?string $nickname,

        // Platform IDs (simplified to 3)
        public ?string $psn_id,
        public ?string $gt7_id,
        public ?string $iracing_id,
        public ?int $iracing_customer_id,

        // Contact
        public ?string $email,
        public ?string $phone,

        // League-specific
        public ?int $driver_number,
        public ?string $status,
        public ?string $league_notes,
    ) {
    }

    public static function rules(): array
    {
        return [
            'first_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'nickname' => ['nullable', 'string', 'max:100'],

            'psn_id' => ['nullable', 'string', 'max:255'],
            'gt7_id' => ['nullable', 'string', 'max:255'],
            'iracing_id' => ['nullable', 'string', 'max:255'],
            'iracing_customer_id' => ['nullable', 'integer', 'min:1'],

            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],

            'driver_number' => ['nullable', 'integer', 'min:1', 'max:999'],
            'status' => ['nullable', 'in:active,inactive,banned'],
            'league_notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
```

---

#### UpdateLeagueDriverData

**Location:** `app/Application/League/DTOs/UpdateLeagueDriverData.php`

```php
<?php

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

final class UpdateLeagueDriverData extends Data
{
    public function __construct(
        public ?int $driver_number,
        public ?string $status,
        public ?string $league_notes,
    ) {
    }

    public static function rules(): array
    {
        return [
            'driver_number' => ['nullable', 'integer', 'min:1', 'max:999'],
            'status' => ['nullable', 'in:active,inactive,banned'],
            'league_notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
```

---

#### LeagueDriverData (Output)

**Location:** `app/Application/League/DTOs/LeagueDriverData.php`

```php
<?php

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;
use App\Domain\League\Entities\LeagueDriver;
use App\Domain\League\Entities\Driver;

final class LeagueDriverData extends Data
{
    public function __construct(
        public int $id,
        public int $league_id,
        public int $driver_id,
        public ?int $driver_number,
        public string $status,
        public ?string $league_notes,
        public string $added_to_league_at,
        public string $updated_at,

        // Nested driver data
        public int $driver_global_id,
        public ?string $first_name,
        public ?string $last_name,
        public ?string $nickname,
        public string $display_name,
        public ?string $psn_id,
        public ?string $gt7_id,
        public ?string $iracing_id,
        public ?int $iracing_customer_id,
        public ?string $email,
        public ?string $phone,
    ) {
    }

    public static function fromEntities(LeagueDriver $leagueDriver, Driver $driver, string $addedAt, string $updatedAt): self
    {
        return new self(
            id: $leagueDriver->id() ?? 0,
            league_id: $leagueDriver->leagueId(),
            driver_id: $leagueDriver->driverId(),
            driver_number: $leagueDriver->driverNumber()?->value(),
            status: $leagueDriver->status()->value,
            league_notes: $leagueDriver->leagueNotes(),
            added_to_league_at: $addedAt,
            updated_at: $updatedAt,

            driver_global_id: $driver->id() ?? 0,
            first_name: $driver->name()->firstName(),
            last_name: $driver->name()->lastName(),
            nickname: $driver->name()->nickname(),
            display_name: $driver->name()->displayName(),
            psn_id: $driver->platforms()->psnId(),
            gt7_id: $driver->platforms()->gt7Id(),
            iracing_id: $driver->platforms()->iracingId(),
            iracing_customer_id: $driver->platforms()->iracingCustomerId(),
            email: $driver->email()?->value(),
            phone: $driver->phoneNumber()?->value(),
        );
    }
}
```

---

#### CSVImportData (Simplified)

**Location:** `app/Application/League/DTOs/CSVImportData.php`

```php
<?php

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

final class CSVImportData extends Data
{
    public function __construct(
        public string $csv_content,
        public bool $mark_all_active = true,
        public bool $skip_invalid_rows = true,
    ) {
    }

    public static function rules(): array
    {
        return [
            'csv_content' => ['required', 'string'],
            'mark_all_active' => ['boolean'],
            'skip_invalid_rows' => ['boolean'],
        ];
    }
}
```

---

#### CSVImportResult (Output)

**Location:** `app/Application/League/DTOs/CSVImportResult.php`

```php
<?php

namespace App\Application\League\DTOs;

use Spatie\LaravelData\Data;

final class CSVImportResult extends Data
{
    public function __construct(
        public int $total_rows,
        public int $created_count,
        public int $skipped_count,
        public int $error_count,
        /** @var array<array{row: int, message: string}> */
        public array $errors,
    ) {
    }
}
```

---

### Application Service (Simplified)

**Location:** `app/Application/League/Services/DriverApplicationService.php`

```php
<?php

namespace App\Application\League\Services;

use App\Domain\League\Repositories\DriverRepositoryInterface;
use App\Domain\League\Repositories\LeagueDriverRepositoryInterface;
use App\Domain\League\Repositories\LeagueRepositoryInterface;
use App\Domain\League\Entities\Driver;
use App\Domain\League\Entities\LeagueDriver;
use App\Domain\League\ValueObjects\DriverName;
use App\Domain\League\ValueObjects\PlatformIdentifiers;
use App\Domain\League\ValueObjects\DriverNumber;
use App\Domain\League\ValueObjects\DriverStatus;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\PhoneNumber;
use App\Application\League\DTOs\CreateDriverData;
use App\Application\League\DTOs\UpdateLeagueDriverData;
use App\Application\League\DTOs\LeagueDriverData;
use App\Application\League\DTOs\CSVImportData;
use App\Application\League\DTOs\CSVImportResult;
use Illuminate\Support\Facades\DB;

final class DriverApplicationService
{
    public function __construct(
        private readonly DriverRepositoryInterface $driverRepository,
        private readonly LeagueDriverRepositoryInterface $leagueDriverRepository,
        private readonly LeagueRepositoryInterface $leagueRepository,
    ) {
    }

    /**
     * Get all drivers in a league
     */
    public function getLeagueDrivers(int $leagueId, int $userId): array
    {
        $this->authorizeLeagueOwner($leagueId, $userId);

        $leagueDrivers = $this->leagueDriverRepository->findByLeague($leagueId);

        return array_map(function ($leagueDriver) {
            $driver = $this->driverRepository->findById($leagueDriver->driverId());
            // In real implementation, get timestamps from Eloquent
            return LeagueDriverData::fromEntities($leagueDriver, $driver, '', '');
        }, $leagueDrivers);
    }

    /**
     * Create driver and add to league
     */
    public function createAndAddDriverToLeague(
        int $leagueId,
        CreateDriverData $data,
        int $userId
    ): LeagueDriverData {
        return DB::transaction(function () use ($leagueId, $data, $userId) {
            $this->authorizeLeagueOwner($leagueId, $userId);

            // Create domain entities
            $driver = Driver::create(
                DriverName::create($data->first_name, $data->last_name, $data->nickname),
                PlatformIdentifiers::create(
                    $data->psn_id,
                    $data->gt7_id,
                    $data->iracing_id,
                    $data->iracing_customer_id
                ),
                $data->email ? EmailAddress::from($data->email) : null,
                $data->phone ? PhoneNumber::fromNullable($data->phone) : null
            );

            // Save driver
            $this->driverRepository->save($driver);
            $driver->recordCreationEvent();

            // Create league association
            $leagueDriver = LeagueDriver::create(
                $leagueId,
                $driver->id(),
                $data->driver_number ? DriverNumber::from($data->driver_number) : null,
                $data->status ? DriverStatus::from($data->status) : null,
                $data->league_notes
            );

            $this->leagueDriverRepository->save($leagueDriver);
            $leagueDriver->recordCreationEvent();

            return LeagueDriverData::fromEntities($leagueDriver, $driver, '', '');
        });
    }

    /**
     * Update league-specific driver settings
     */
    public function updateLeagueDriver(
        int $leagueId,
        int $driverId,
        UpdateLeagueDriverData $data,
        int $userId
    ): LeagueDriverData {
        return DB::transaction(function () use ($leagueId, $driverId, $data, $userId) {
            $this->authorizeLeagueOwner($leagueId, $userId);

            $leagueDriver = $this->leagueDriverRepository->findByLeagueAndDriver($leagueId, $driverId);

            if ($data->driver_number !== null) {
                $leagueDriver->updateDriverNumber(DriverNumber::from($data->driver_number));
            }

            if ($data->status !== null) {
                $leagueDriver->changeStatus(DriverStatus::from($data->status));
            }

            if ($data->league_notes !== null) {
                $leagueDriver->updateNotes($data->league_notes);
            }

            $this->leagueDriverRepository->update($leagueDriver);

            $driver = $this->driverRepository->findById($leagueDriver->driverId());
            return LeagueDriverData::fromEntities($leagueDriver, $driver, '', '');
        });
    }

    /**
     * Remove driver from league
     */
    public function removeDriverFromLeague(int $leagueId, int $driverId, int $userId): void
    {
        DB::transaction(function () use ($leagueId, $driverId, $userId) {
            $this->authorizeLeagueOwner($leagueId, $userId);

            $leagueDriver = $this->leagueDriverRepository->findByLeagueAndDriver($leagueId, $driverId);
            $this->leagueDriverRepository->delete($leagueDriver);
        });
    }

    /**
     * Import drivers from CSV (simplified - no preview)
     */
    public function importDriversFromCSV(
        int $leagueId,
        CSVImportData $data,
        int $userId
    ): CSVImportResult {
        return DB::transaction(function () use ($leagueId, $data, $userId) {
            $this->authorizeLeagueOwner($leagueId, $userId);

            $rows = $this->parseCSV($data->csv_content);
            $createdCount = 0;
            $skippedCount = 0;
            $errors = [];

            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2; // +2 for header + 0-index

                try {
                    // Validate row
                    if (!$this->isValidRow($row)) {
                        $errors[] = ['row' => $rowNumber, 'message' => 'Invalid data: missing name or platform ID'];
                        $skippedCount++;
                        continue;
                    }

                    // Check if platform ID already in league
                    $platformId = $row['psn_id'] ?? $row['gt7_id'] ?? $row['iracing_id'] ?? null;
                    $platformField = $this->detectPlatformField($row);

                    if ($platformId && $this->leagueDriverRepository->existsByLeagueAndPlatformId($leagueId, $platformField, $platformId)) {
                        $errors[] = ['row' => $rowNumber, 'message' => "Driver with {$platformField} '{$platformId}' already in league"];
                        $skippedCount++;
                        continue;
                    }

                    // Create driver
                    $createData = CreateDriverData::from([
                        'first_name' => $row['first_name'] ?? null,
                        'last_name' => $row['last_name'] ?? null,
                        'nickname' => $row['nickname'] ?? null,
                        'psn_id' => $row['psn_id'] ?? null,
                        'gt7_id' => $row['gt7_id'] ?? null,
                        'iracing_id' => $row['iracing_id'] ?? null,
                        'iracing_customer_id' => isset($row['iracing_customer_id']) ? (int)$row['iracing_customer_id'] : null,
                        'email' => $row['email'] ?? null,
                        'phone' => $row['phone'] ?? null,
                        'driver_number' => isset($row['driver_number']) ? (int)$row['driver_number'] : null,
                        'status' => $data->mark_all_active ? 'active' : ($row['status'] ?? 'active'),
                        'league_notes' => null,
                    ]);

                    $this->createAndAddDriverToLeague($leagueId, $createData, $userId);
                    $createdCount++;
                } catch (\Exception $e) {
                    $errors[] = ['row' => $rowNumber, 'message' => $e->getMessage()];
                    $skippedCount++;
                }
            }

            return new CSVImportResult(
                total_rows: count($rows),
                created_count: $createdCount,
                skipped_count: $skippedCount,
                error_count: count($errors),
                errors: $errors
            );
        });
    }

    /**
     * Get driver statistics for a league
     */
    public function getLeagueDriverStatistics(int $leagueId, int $userId): array
    {
        $this->authorizeLeagueOwner($leagueId, $userId);

        return [
            'total' => count($this->leagueDriverRepository->findByLeague($leagueId)),
            'active' => $this->leagueDriverRepository->countByLeagueAndStatus($leagueId, DriverStatus::ACTIVE),
            'inactive' => $this->leagueDriverRepository->countByLeagueAndStatus($leagueId, DriverStatus::INACTIVE),
            'banned' => $this->leagueDriverRepository->countByLeagueAndStatus($leagueId, DriverStatus::BANNED),
        ];
    }

    // Private helpers

    private function authorizeLeagueOwner(int $leagueId, int $userId): void
    {
        $league = $this->leagueRepository->findById($leagueId);
        if ($league->ownerUserId() !== $userId) {
            throw new \Exception('Unauthorized');
        }
    }

    private function parseCSV(string $csvContent): array
    {
        $lines = explode("\n", trim($csvContent));
        $header = str_getcsv(array_shift($lines));
        $header = array_map('strtolower', $header);

        $rows = [];
        foreach ($lines as $line) {
            if (empty(trim($line))) continue;
            $values = str_getcsv($line);
            $rows[] = array_combine($header, $values);
        }

        return $rows;
    }

    private function isValidRow(array $row): bool
    {
        // At least one name
        $hasName = !empty($row['first_name'] ?? '') || !empty($row['last_name'] ?? '');

        // At least one platform ID
        $hasPlatform = !empty($row['psn_id'] ?? '')
            || !empty($row['gt7_id'] ?? '')
            || !empty($row['iracing_id'] ?? '')
            || !empty($row['iracing_customer_id'] ?? '');

        return $hasName && $hasPlatform;
    }

    private function detectPlatformField(array $row): string
    {
        if (!empty($row['psn_id'])) return 'psn_id';
        if (!empty($row['gt7_id'])) return 'gt7_id';
        if (!empty($row['iracing_id'])) return 'iracing_id';
        return 'unknown';
    }
}
```

---

## Infrastructure Layer Design

### Eloquent Models (Anemic)

#### Driver Model

**Location:** `app/Infrastructure/Persistence/Eloquent/Models/Driver.php`

```php
<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

final class Driver extends Model
{
    use SoftDeletes;

    protected $table = 'drivers';

    protected $fillable = [
        'first_name',
        'last_name',
        'nickname',
        'email',
        'phone',
        'psn_id',
        'gt7_id',
        'iracing_id',
        'iracing_customer_id',
    ];

    protected $casts = [
        'iracing_customer_id' => 'integer',
    ];

    public function leagueDrivers()
    {
        return $this->hasMany(LeagueDriver::class, 'driver_id');
    }
}
```

---

#### LeagueDriver Model

**Location:** `app/Infrastructure/Persistence/Eloquent/Models/LeagueDriver.php`

```php
<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;

final class LeagueDriver extends Model
{
    protected $table = 'league_drivers';

    protected $fillable = [
        'league_id',
        'driver_id',
        'driver_number',
        'status',
        'league_notes',
    ];

    protected $casts = [
        'league_id' => 'integer',
        'driver_id' => 'integer',
        'driver_number' => 'integer',
    ];

    const CREATED_AT = 'added_to_league_at';
    const UPDATED_AT = 'updated_at';

    public function league()
    {
        return $this->belongsTo(League::class, 'league_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }
}
```

---

### Repository Implementations

**Location:** `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentDriverRepository.php`

**Location:** `app/Infrastructure/Persistence/Eloquent/Repositories/EloquentLeagueDriverRepository.php`

*(Implementation details similar to full plan but simplified - follow existing League repository patterns)*

---

## Database Schema

### Migration: Create drivers Table

**Location:** `database/migrations/2025_10_17_124731_create_drivers_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();

            // Names (at least first OR last required)
            $table->string('first_name', 100)->nullable();
            $table->string('last_name', 100)->nullable();
            $table->string('nickname', 100)->nullable();

            // Contact
            $table->string('email', 255)->nullable();
            $table->string('phone', 20)->nullable();

            // Platform IDs (simplified to 3)
            $table->string('psn_id', 255)->nullable()->index();
            $table->string('gt7_id', 255)->nullable()->index();
            $table->string('iracing_id', 255)->nullable()->index();
            $table->unsignedInteger('iracing_customer_id')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['first_name', 'last_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
```

---

### Migration: Create league_drivers Table

**Location:** `database/migrations/2025_10_17_124824_create_league_drivers_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('league_drivers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('league_id')->constrained('leagues')->onDelete('cascade');
            $table->foreignId('driver_id')->constrained('drivers')->onDelete('cascade');

            $table->unsignedSmallInteger('driver_number')->nullable();
            $table->enum('status', ['active', 'inactive', 'banned'])->default('active');
            $table->text('league_notes')->nullable();

            $table->timestamp('added_to_league_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['league_id', 'driver_id'], 'unique_league_driver');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('league_drivers');
    }
};
```

---

## Interface Layer Design

### Controllers (Thin)

**Location:** `app/Http/Controllers/User/LeagueDriverController.php`

```php
<?php

namespace App\Http\Controllers\User;

use App\Application\League\Services\DriverApplicationService;
use App\Application\League\DTOs\CreateDriverData;
use App\Application\League\DTOs\UpdateLeagueDriverData;
use App\Application\League\DTOs\CSVImportData;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

final class LeagueDriverController
{
    public function __construct(
        private readonly DriverApplicationService $driverService
    ) {
    }

    /**
     * GET /api/leagues/{league}/drivers
     */
    public function index(int $league, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $drivers = $this->driverService->getLeagueDrivers($league, $user->id);
            $stats = $this->driverService->getLeagueDriverStatistics($league, $user->id);

            return ApiResponse::success([
                'drivers' => array_map(fn($d) => $d->toArray(), $drivers),
                'statistics' => $stats,
            ]);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * POST /api/leagues/{league}/drivers
     */
    public function store(int $league, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $data = CreateDriverData::from($request->all());
            $driver = $this->driverService->createAndAddDriverToLeague($league, $data, $user->id);

            return ApiResponse::created($driver->toArray());
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    /**
     * PUT /api/leagues/{league}/drivers/{driver}
     */
    public function update(int $league, int $driver, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $data = UpdateLeagueDriverData::from($request->all());
            $updated = $this->driverService->updateLeagueDriver($league, $driver, $data, $user->id);

            return ApiResponse::success($updated->toArray());
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    /**
     * DELETE /api/leagues/{league}/drivers/{driver}
     */
    public function destroy(int $league, int $driver, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $this->driverService->removeDriverFromLeague($league, $driver, $user->id);

            return ApiResponse::noContent();
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage());
        }
    }

    /**
     * POST /api/leagues/{league}/drivers/import-csv
     */
    public function importCSV(int $league, Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $data = CSVImportData::from($request->all());
            $result = $this->driverService->importDriversFromCSV($league, $data, $user->id);

            return ApiResponse::success($result->toArray());
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }
}
```

---

### Routes

**Location:** `routes/subdomain.php`

```php
// User Dashboard (app.{domain}) - Authenticated Only
Route::domain('app.virtualracingleagues.localhost')->group(function () {
    Route::prefix('api')->middleware(['auth:web', 'user.authenticate'])->group(function () {
        // League driver management
        Route::get('/leagues/{league}/drivers', [LeagueDriverController::class, 'index']);
        Route::post('/leagues/{league}/drivers', [LeagueDriverController::class, 'store']);
        Route::put('/leagues/{league}/drivers/{driver}', [LeagueDriverController::class, 'update']);
        Route::delete('/leagues/{league}/drivers/{driver}', [LeagueDriverController::class, 'destroy']);
        Route::post('/leagues/{league}/drivers/import-csv', [LeagueDriverController::class, 'importCSV']);
    });
});
```

---

## Implementation Order

### Phase 1: Domain Layer (Day 1)
1. ✅ Value Objects: `PhoneNumber`, `DriverNumber`, `DriverStatus`, `DriverName`, `PlatformIdentifiers`
2. ✅ Domain Exceptions: All exception classes
3. ✅ Entities: `Driver`, `LeagueDriver`
4. ✅ Domain Events: All event classes
5. ✅ Repository Interfaces

### Phase 2: Infrastructure (Day 2)
6. ✅ Migrations: `drivers`, `league_drivers`
7. ✅ Eloquent Models: `Driver`, `LeagueDriver`
8. ✅ Repository Implementations
9. ✅ Service Provider Registration

### Phase 3: Application Layer (Day 3)
10. ✅ DTOs: Input and output DTOs
11. ✅ `DriverApplicationService`: All methods
12. ✅ CSV parsing logic

### Phase 4: Interface Layer (Day 4)
13. ✅ Controller: `LeagueDriverController`
14. ✅ Routes in `subdomain.php`
15. ✅ API response helpers

---

## Testing Strategy

### Unit Tests (Domain Layer)
- `DriverNameTest` - All validation cases
- `PlatformIdentifiersTest` - Validation, primary platform
- `DriverNumberTest` - Range validation
- `DriverTest` - Entity creation, updates, events
- `LeagueDriverTest` - Entity creation, updates, events

### Feature Tests (HTTP Layer)
- `LeagueDriverControllerTest`:
  - List drivers
  - Create driver
  - Update driver
  - Remove driver
  - Import CSV (success + errors)
  - Authorization tests

### Repository Tests
- `EloquentDriverRepositoryTest` - CRUD operations
- `EloquentLeagueDriverRepositoryTest` - CRUD, platform ID checks

---

**Document Version:** 1.0 MVP
**Last Updated:** October 18, 2025
**Status:** Ready for Implementation
**Estimated Time:** 4 days

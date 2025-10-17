# User Backend Development Guide

**Version**: 3.0
**Last Updated**: January 2025
**Purpose**: Complete guide for developing User-related backend features

**Prerequisites**: Read [DDD Backend Architecture Overview](./ddd-overview.md) first.

**Note**: This guide is prepared for future User context development. Admin development should be completed first.

---

## Table of Contents

1. [User Context Overview](#user-context-overview)
2. [User vs Admin Context](#user-vs-admin-context)
3. [User Entity Patterns](#user-entity-patterns)
4. [Application Services](#application-services)
5. [Controllers & Routes](#controllers--routes)
6. [Step-by-Step Workflows](#step-by-step-workflows)
7. [Testing User Features](#testing-user-features)

---

## User Context Overview

### What is the User Context?

The User context manages **end-user accounts** - the actual users of your application who are managed BY administrators through the admin dashboard.

**Location**:
- Domain: `app/Domain/User/`
- Application: `app/Application/User/`
- Infrastructure: `app/Infrastructure/Persistence/Eloquent/Models/UserEloquent.php`
- Controllers: `app/Http/Controllers/Admin/UserController.php` (for admin management)

### Key Concepts

- Users are **managed by admins** (not self-managed)
- Users have profiles, preferences, and application-specific data
- Users authenticate via the `web` guard
- Users have statuses (active, inactive, suspended)
- Users can have optional fields like alias, UUID

---

## User vs Admin Context

### Critical Differences

| Aspect | User Context | Admin Context |
|--------|-------------|--------------|
| **Purpose** | End-user accounts | Administrator accounts |
| **Managed by** | Managed BY admins | Self-managed by admins |
| **Auth Guard** | `web` | `admin` |
| **Routes** | `/api/users` | `/api/admin-users` |
| **Controller** | `UserController` | `AdminUserController` |
| **Business Rules** | Status, email verification, profile | Role hierarchy, permissions |
| **Domain Entity** | `App\Domain\User\Entities\User` | `App\Domain\Admin\Entities\Admin` |

**Important Controller Naming:**
- `UserController` → manages **User entities** (for admin CRUD on users)
- `AdminUserController` → manages **Admin entities** (for admin CRUD on admins)

---

## User Entity Patterns

### User Entity Structure

**Location**: `app/Domain/User/Entities/User.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\User\Entities;

use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use App\Domain\User\Events\EmailVerified;
use App\Domain\User\Events\UserCreated;
use App\Domain\User\Events\UserDeleted;
use App\Domain\User\Events\UserUpdated;
use App\Domain\User\Exceptions\UserAlreadyDeletedException;
use App\Domain\User\ValueObjects\UserAlias;
use App\Domain\User\ValueObjects\UserStatus;
use App\Domain\User\ValueObjects\UserUuid;
use DateTimeImmutable;

final class User
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private FullName $fullName,
        private EmailAddress $email,
        private ?UserAlias $alias,
        private ?UserUuid $uuid,
        private UserStatus $status,
        private ?DateTimeImmutable $emailVerifiedAt,
        private ?DateTimeImmutable $createdAt,
        private ?DateTimeImmutable $updatedAt,
        private ?DateTimeImmutable $deletedAt,
    ) {
    }

    /**
     * Create a new user (for new instances).
     */
    public static function create(
        FullName $fullName,
        EmailAddress $email,
        ?UserAlias $alias = null,
        ?UserUuid $uuid = null,
        ?UserStatus $status = null,
    ): self {
        return new self(
            id: null,
            fullName: $fullName,
            email: $email,
            alias: $alias,
            uuid: $uuid ?? UserUuid::generate(),
            status: $status ?? UserStatus::ACTIVE,
            emailVerifiedAt: null,
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable(),
            deletedAt: null,
        );
    }

    /**
     * Record creation event after ID is set.
     * Must be called by application service after save().
     */
    public function recordCreationEvent(): void
    {
        if ($this->id === null) {
            throw new \LogicException('Cannot record creation event before entity has an ID');
        }

        $this->recordEvent(new UserCreated(
            userId: $this->id,
            email: $this->email->value(),
            firstName: $this->fullName->firstName(),
            lastName: $this->fullName->lastName(),
            alias: $this->alias?->value(),
            uuid: $this->uuid?->value(),
        ));
    }

    /**
     * Reconstitute from persistence.
     */
    public static function reconstitute(
        int $id,
        FullName $fullName,
        EmailAddress $email,
        ?UserAlias $alias,
        ?UserUuid $uuid,
        UserStatus $status,
        ?DateTimeImmutable $emailVerifiedAt,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
        ?DateTimeImmutable $deletedAt,
    ): self {
        return new self(
            id: $id,
            fullName: $fullName,
            email: $email,
            alias: $alias,
            uuid: $uuid,
            status: $status,
            emailVerifiedAt: $emailVerifiedAt,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
            deletedAt: $deletedAt,
        );
    }

    // Getters
    public function id(): ?int { return $this->id; }
    public function fullName(): FullName { return $this->fullName; }
    public function email(): EmailAddress { return $this->email; }
    public function alias(): ?UserAlias { return $this->alias; }
    public function uuid(): ?UserUuid { return $this->uuid; }
    public function status(): UserStatus { return $this->status; }
    public function emailVerifiedAt(): ?DateTimeImmutable { return $this->emailVerifiedAt; }
    public function createdAt(): ?DateTimeImmutable { return $this->createdAt; }
    public function updatedAt(): ?DateTimeImmutable { return $this->updatedAt; }
    public function deletedAt(): ?DateTimeImmutable { return $this->deletedAt; }

    // Exception: needed for persistence
    public function setId(int $id): void { $this->id = $id; }

    // Business logic methods
    public function updateProfile(FullName $fullName, EmailAddress $email): void
    {
        $changes = [];

        if (!$fullName->equals($this->fullName)) {
            $this->fullName = $fullName;
            $changes['first_name'] = $fullName->firstName();
            $changes['last_name'] = $fullName->lastName();
        }

        if (!$email->equals($this->email)) {
            $this->email = $email;
            $changes['email'] = $email->value();
        }

        if (!empty($changes)) {
            $this->updatedAt = new DateTimeImmutable();
            $this->recordEvent(new UserUpdated($this->id ?? 0, $changes));
        }
    }

    public function changeStatus(UserStatus $newStatus): void
    {
        if ($this->status === $newStatus) {
            return;
        }

        $this->status = $newStatus;
        $this->updatedAt = new DateTimeImmutable();
        $this->recordEvent(new UserStatusChanged($this->id ?? 0, $newStatus->value));
    }

    public function suspend(): void
    {
        $this->changeStatus(UserStatus::SUSPENDED);
    }

    public function activate(): void
    {
        $this->changeStatus(UserStatus::ACTIVE);
    }

    public function deactivate(): void
    {
        $this->changeStatus(UserStatus::INACTIVE);
    }

    public function delete(): void
    {
        if ($this->isDeleted()) {
            throw UserAlreadyDeletedException::withId($this->id ?? 0);
        }

        $this->status = UserStatus::INACTIVE;
        $this->deletedAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new UserDeleted($this->id ?? 0));
    }

    public function verifyEmail(): void
    {
        if ($this->isEmailVerified()) {
            return; // Already verified
        }

        $this->emailVerifiedAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
        $this->recordEvent(new EmailVerified($this->id ?? 0, $this->email->value()));
    }

    // Status checks
    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::ACTIVE && !$this->isDeleted();
    }

    public function isSuspended(): bool
    {
        return $this->status === UserStatus::SUSPENDED;
    }

    public function isEmailVerified(): bool
    {
        return $this->emailVerifiedAt !== null;
    }

    // Domain event management
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

    public function hasEvents(): bool
    {
        return !empty($this->domainEvents);
    }
}
```

### User Value Objects

**UserStatus** (Enum): `app/Domain/User/ValueObjects/UserStatus.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\User\ValueObjects;

enum UserStatus: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case SUSPENDED = 'suspended';

    public function isActive(): bool
    {
        return $this === self::ACTIVE;
    }

    public function isSuspended(): bool
    {
        return $this === self::SUSPENDED;
    }
}
```

**UserAlias** (Value Object): `app/Domain/User/ValueObjects/UserAlias.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain/User\ValueObjects;

use InvalidArgumentException;

final readonly class UserAlias
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
        if ($value === null || trim($value) === '') {
            return null;
        }
        return new self($value);
    }

    private function validate(): void
    {
        $trimmed = trim($this->value);

        if ($trimmed === '') {
            throw new InvalidArgumentException('User alias cannot be empty');
        }

        if (mb_strlen($trimmed) > 100) {
            throw new InvalidArgumentException('User alias cannot exceed 100 characters');
        }

        // Optional: Add regex validation for alias format
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $trimmed)) {
            throw new InvalidArgumentException('User alias can only contain letters, numbers, underscores, and hyphens');
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

    public function __toString(): string
    {
        return $this->value;
    }
}
```

**UserUuid** (Value Object): `app/Domain/User/ValueObjects/UserUuid.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\User\ValueObjects;

use InvalidArgumentException;
use Ramsey\Uuid\Uuid;

final readonly class UserUuid
{
    private function __construct(
        private string $value
    ) {
        $this->validate();
    }

    public static function generate(): self
    {
        return new self(Uuid::uuid4()->toString());
    }

    public static function from(string $value): self
    {
        return new self($value);
    }

    public static function fromNullable(?string $value): ?self
    {
        if ($value === null || trim($value) === '') {
            return null;
        }
        return new self($value);
    }

    private function validate(): void
    {
        if (!Uuid::isValid($this->value)) {
            throw new InvalidArgumentException("Invalid UUID: {$this->value}");
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

    public function __toString(): string
    {
        return $this->value;
    }
}
```

---

## Application Services

### UserApplicationService

**Location**: `app/Application/User/Services/UserApplicationService.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\User\Services;

use App\Application\User\DTOs\CreateUserData;
use App\Application\User\DTOs\UpdateUserData;
use App\Application\User\DTOs\UserData;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use App\Domain\User\Entities\User;
use App\Domain\User\Exceptions\UserAlreadyExistsException;
use App\Domain\User\Exceptions\UserNotFoundException;
use App\Domain\User\Repositories\UserRepositoryInterface;
use App\Domain\User\ValueObjects\UserAlias;
use App\Domain\User\ValueObjects\UserStatus;
use App\Domain\User\ValueObjects\UserUuid;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;

final class UserApplicationService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {
    }

    /**
     * Create a new user.
     */
    public function createUser(CreateUserData $data): UserData
    {
        // Check business rules
        if ($this->userRepository->existsByEmail($data->email)) {
            throw UserAlreadyExistsException::withEmail($data->email);
        }

        // Check UUID uniqueness if provided
        if ($data->uuid !== null && $this->userRepository->existsByUuid($data->uuid)) {
            throw UserAlreadyExistsException::withUuid($data->uuid);
        }

        // Create domain entity
        $user = User::create(
            fullName: FullName::from($data->first_name, $data->last_name),
            email: EmailAddress::from($data->email),
            alias: UserAlias::fromNullable($data->alias),
            uuid: $data->uuid ? UserUuid::from($data->uuid) : null,
            status: $data->status ? UserStatus::from($data->status) : null,
        );

        // Hash password (infrastructure concern)
        $hashedPassword = Hash::make($data->password);

        // Persist in transaction
        return DB::transaction(function () use ($user, $hashedPassword) {
            $this->userRepository->save($user, $hashedPassword);

            // Record creation event now that ID is set
            $user->recordCreationEvent();

            $this->dispatchEvents($user);

            return UserData::fromEntity($user);
        });
    }

    /**
     * Update an existing user.
     */
    public function updateUser(int $id, UpdateUserData $data): UserData
    {
        $user = $this->userRepository->findById($id);

        // Check email uniqueness if changed
        if ($data->email !== null && $data->email !== $user->email()->value()) {
            if ($this->userRepository->existsByEmail($data->email)) {
                throw UserAlreadyExistsException::withEmail($data->email);
            }
        }

        // Update profile if name or email changed
        if ($data->first_name !== null || $data->last_name !== null || $data->email !== null) {
            $user->updateProfile(
                fullName: FullName::from(
                    $data->first_name ?? $user->fullName()->firstName(),
                    $data->last_name ?? $user->fullName()->lastName(),
                ),
                email: EmailAddress::from($data->email ?? $user->email()->value()),
            );
        }

        // Change status if specified
        if ($data->status !== null) {
            $user->changeStatus(UserStatus::from($data->status));
        }

        $hashedPassword = $data->password !== null ? Hash::make($data->password) : null;

        // Persist in transaction
        return DB::transaction(function () use ($user, $hashedPassword) {
            $this->userRepository->save($user, $hashedPassword);
            $this->dispatchEvents($user);

            return UserData::fromEntity($user);
        });
    }

    /**
     * Get user by ID.
     */
    public function getUserById(int $id): UserData
    {
        $user = $this->userRepository->findById($id);
        return UserData::fromEntity($user);
    }

    /**
     * Get paginated list of users.
     */
    public function getPaginatedUsers(int $page, int $perPage, array $filters): array
    {
        $result = $this->userRepository->paginate($page, $perPage, $filters);

        // Transform entities to DTOs
        $result['data'] = array_map(
            fn($user) => UserData::fromEntity($user),
            $result['data']
        );

        return $result;
    }

    /**
     * Delete a user.
     */
    public function deleteUser(int $id): void
    {
        $user = $this->userRepository->findById($id);
        $user->delete();

        DB::transaction(function () use ($user) {
            $this->userRepository->delete($user);
            $this->dispatchEvents($user);
        });
    }

    /**
     * Verify user email.
     */
    public function verifyEmail(int $userId): UserData
    {
        $user = $this->userRepository->findById($userId);
        $user->verifyEmail();

        return DB::transaction(function () use ($user) {
            $this->userRepository->save($user);
            $this->dispatchEvents($user);

            return UserData::fromEntity($user);
        });
    }

    /**
     * Suspend a user.
     */
    public function suspendUser(int $id): UserData
    {
        $user = $this->userRepository->findById($id);
        $user->suspend();

        return DB::transaction(function () use ($user) {
            $this->userRepository->save($user);
            $this->dispatchEvents($user);

            return UserData::fromEntity($user);
        });
    }

    /**
     * Activate a user.
     */
    public function activateUser(int $id): UserData
    {
        $user = $this->userRepository->findById($id);
        $user->activate();

        return DB::transaction(function () use ($user) {
            $this->userRepository->save($user);
            $this->dispatchEvents($user);

            return UserData::fromEntity($user);
        });
    }

    /**
     * Dispatch domain events.
     */
    private function dispatchEvents(User $user): void
    {
        foreach ($user->releaseEvents() as $event) {
            Event::dispatch($event);
        }
    }
}
```

### User DTOs

**CreateUserData**: `app/Application/User/DTOs/CreateUserData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\User\DTOs;

use Spatie\LaravelData\Data;

final class CreateUserData extends Data
{
    public function __construct(
        public readonly string $first_name,
        public readonly string $last_name,
        public readonly string $email,
        public readonly string $password,
        public readonly ?string $alias = null,
        public readonly ?string $uuid = null,
        public readonly string $status = 'active',
    ) {
    }

    public static function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'alias' => ['nullable', 'string', 'max:100', 'regex:/^[a-zA-Z0-9_-]+$/'],
            'uuid' => ['nullable', 'string', 'max:60'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
        ];
    }
}
```

**UserData**: `app/Application/User/DTOs/UserData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\User\DTOs;

use App\Domain\User\Entities\User;
use Spatie\LaravelData\Data;

final class UserData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly string $first_name,
        public readonly string $last_name,
        public readonly string $name,
        public readonly string $email,
        public readonly ?string $alias,
        public readonly ?string $uuid,
        public readonly string $status,
        public readonly bool $is_active,
        public readonly bool $is_deleted,
        public readonly bool $is_email_verified,
        public readonly ?string $email_verified_at,
        public readonly string $created_at,
        public readonly string $updated_at,
        public readonly ?string $deleted_at,
    ) {
    }

    /**
     * Create from domain entity.
     */
    public static function fromEntity(User $user): self
    {
        return new self(
            id: $user->id() ?? 0,
            first_name: $user->fullName()->firstName(),
            last_name: $user->fullName()->lastName(),
            name: $user->fullName()->full(),
            email: $user->email()->value(),
            alias: $user->alias()?->value(),
            uuid: $user->uuid()?->value(),
            status: $user->status()->value,
            is_active: $user->isActive(),
            is_deleted: $user->isDeleted(),
            is_email_verified: $user->isEmailVerified(),
            email_verified_at: $user->emailVerifiedAt()?->format('Y-m-d H:i:s'),
            created_at: $user->createdAt()?->format('Y-m-d H:i:s') ?? '',
            updated_at: $user->updatedAt()?->format('Y-m-d H:i:s') ?? '',
            deleted_at: $user->deletedAt()?->format('Y-m-d H:i:s'),
        );
    }
}
```

---

## Controllers & Routes

### UserController (for Admin Dashboard)

**Location**: `app/Http/Controllers/Admin/UserController.php`

**Note**: This controller is used BY ADMINS to manage User entities.

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Application\User\DTOs\CreateUserData;
use App\Application\User\DTOs\UpdateUserData;
use App\Application\User\Services\UserApplicationService;
use App\Domain\User\Exceptions\UserAlreadyExistsException;
use App\Domain\User\Exceptions\UserNotFoundException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * User Controller - manages User entities (for admin dashboard).
 *
 * NOTE: This is different from AdminUserController which manages Admin entities.
 */
final class UserController extends Controller
{
    public function __construct(
        private readonly UserApplicationService $userService,
    ) {
    }

    /**
     * Display a listing of users.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [
            'search' => $request->input('search'),
            'status' => $request->input('status'),
            'include_deleted' => $request->boolean('include_deleted'),
            'order_by' => $request->input('order_by', 'created_at'),
            'order_direction' => $request->input('order_direction', 'desc'),
        ];

        $result = $this->userService->getPaginatedUsers(
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
     * Store a newly created user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(CreateUserData::rules());

        try {
            $data = CreateUserData::from($validated);
            $userData = $this->userService->createUser($data);
            return ApiResponse::created($userData->toArray(), 'User created successfully');
        } catch (UserAlreadyExistsException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    /**
     * Display the specified user.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $userData = $this->userService->getUserById($id);
            return ApiResponse::success($userData->toArray());
        } catch (UserNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'password' => 'nullable|string|min:8',
            'alias' => 'nullable|string|max:100|regex:/^[a-zA-Z0-9_-]+$/',
            'status' => 'nullable|in:active,inactive,suspended',
        ]);

        try {
            $data = UpdateUserData::from($validated);
            $userData = $this->userService->updateUser($id, $data);
            return ApiResponse::success($userData->toArray(), 'User updated successfully');
        } catch (UserNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (UserAlreadyExistsException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        }
    }

    /**
     * Remove the specified user.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->userService->deleteUser($id);
            return ApiResponse::success(null, 'User deleted successfully');
        } catch (UserNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Suspend a user.
     */
    public function suspend(int $id): JsonResponse
    {
        try {
            $userData = $this->userService->suspendUser($id);
            return ApiResponse::success($userData->toArray(), 'User suspended successfully');
        } catch (UserNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Activate a user.
     */
    public function activate(int $id): JsonResponse
    {
        try {
            $userData = $this->userService->activateUser($id);
            return ApiResponse::success($userData->toArray(), 'User activated successfully');
        } catch (UserNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }
}
```

### Routes

**Location**: `routes/api.php`

```php
Route::prefix('admin')
    ->middleware(['auth:admin', 'admin.authenticate'])
    ->group(function () {
        // User management (manages User entities)
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);

        // User actions
        Route::post('/users/{id}/suspend', [UserController::class, 'suspend']);
        Route::post('/users/{id}/activate', [UserController::class, 'activate']);
    });
```

---

## Step-by-Step Workflows

### Workflow: Adding Email Verification

**Example: Implement email verification for User entities**

#### Step 1: Domain Layer (Already Implemented)

The User entity already has:
- `emailVerifiedAt` property
- `verifyEmail()` method
- `isEmailVerified()` check
- `EmailVerified` event

#### Step 2: Application Service (Already Implemented)

`UserApplicationService::verifyEmail()` already exists.

#### Step 3: Add Controller Endpoint

```php
// app/Http/Controllers/Admin/UserController.php
public function verifyEmail(int $id): JsonResponse
{
    try {
        $userData = $this->userService->verifyEmail($id);
        return ApiResponse::success($userData->toArray(), 'Email verified successfully');
    } catch (UserNotFoundException $e) {
        return ApiResponse::error($e->getMessage(), null, 404);
    }
}
```

#### Step 4: Add Route

```php
// routes/api.php
Route::post('/api/users/{id}/verify-email', [UserController::class, 'verifyEmail'])
    ->middleware(['auth:admin', 'admin.authenticate']);
```

#### Step 5: Test

```php
// tests/Feature/Admin/UserControllerTest.php
public function test_admin_can_verify_user_email(): void
{
    $user = User::factory()->create(['email_verified_at' => null]);
    $admin = Admin::factory()->create(['role' => 'super_admin']);

    $response = $this->actingAs($admin, 'admin')
        ->postJson("/api/users/{$user->id}/verify-email");

    $response->assertOk();
    $this->assertNotNull($user->fresh()->email_verified_at);
}
```

---

## Testing User Features

### Unit Tests

**Location**: `tests/Unit/Domain/User/Entities/UserTest.php`

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\User\Entities;

use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use App\Domain\User\Entities\User;
use App\Domain\User\ValueObjects\UserStatus;
use Tests\TestCase;

class UserTest extends TestCase
{
    public function test_can_create_user(): void
    {
        $user = User::create(
            fullName: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john@example.com'),
        );

        $this->assertNull($user->id());
        $this->assertEquals('John', $user->fullName()->firstName());
        $this->assertEquals('Doe', $user->fullName()->lastName());
        $this->assertEquals('john@example.com', $user->email()->value());
        $this->assertEquals(UserStatus::ACTIVE, $user->status());
        $this->assertTrue($user->isActive());
        $this->assertFalse($user->isEmailVerified());
    }

    public function test_can_verify_email(): void
    {
        $user = User::reconstitute(
            id: 1,
            fullName: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john@example.com'),
            alias: null,
            uuid: null,
            status: UserStatus::ACTIVE,
            emailVerifiedAt: null,
            createdAt: new \DateTimeImmutable(),
            updatedAt: new \DateTimeImmutable(),
            deletedAt: null,
        );

        $this->assertFalse($user->isEmailVerified());

        $user->verifyEmail();

        $this->assertTrue($user->isEmailVerified());
        $this->assertNotNull($user->emailVerifiedAt());
    }

    public function test_can_suspend_user(): void
    {
        $user = User::create(
            fullName: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john@example.com'),
        );

        $user->suspend();

        $this->assertEquals(UserStatus::SUSPENDED, $user->status());
        $this->assertTrue($user->isSuspended());
        $this->assertFalse($user->isActive());
    }
}
```

### Feature Tests

**Location**: `tests/Feature/Admin/UserControllerTest.php`

```php
<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    private Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = Admin::factory()->create(['role' => 'super_admin']);
    }

    public function test_admin_can_list_users(): void
    {
        User::factory()->count(3)->create();

        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/users');

        $response->assertOk();
        $response->assertJsonCount(3, 'data');
    }

    public function test_admin_can_create_user(): void
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/users', [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john@example.com',
                'password' => 'password123',
                'alias' => 'johndoe',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'alias' => 'johndoe',
        ]);
    }

    public function test_admin_can_suspend_user(): void
    {
        $user = User::factory()->create(['status' => 'active']);

        $response = $this->actingAs($this->admin, 'admin')
            ->postJson("/api/users/{$user->id}/suspend");

        $response->assertOk();
        $this->assertEquals('suspended', $user->fresh()->status);
    }
}
```

---

## Next Steps

- **For architecture overview**: See [DDD Backend Architecture Overview](./ddd-overview.md)
- **For Admin development**: See [Admin Backend Development Guide](./admin-backend-guide.md)

---

**End of User Backend Development Guide v3.0**

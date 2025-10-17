# Admin Backend Development Guide

**Version**: 3.0
**Last Updated**: January 2025
**Purpose**: Complete guide for developing Admin-related backend features

**Prerequisites**: Read [DDD Backend Architecture Overview](./ddd-overview.md) first.

---

## Table of Contents

1. [Admin Context Overview](#admin-context-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Admin Entity Patterns](#admin-entity-patterns)
4. [Application Services](#application-services)
5. [Controllers & Routes](#controllers--routes)
6. [Step-by-Step Workflows](#step-by-step-workflows)
7. [Testing Admin Features](#testing-admin-features)

---

## Admin Context Overview

### What is the Admin Context?

The Admin context manages **administrator accounts** who have access to the admin dashboard. This is completely separate from the User context.

**Location**:
- Domain: `app/Domain/Admin/`
- Application: `app/Application/Admin/`
- Infrastructure: `app/Infrastructure/Persistence/Eloquent/Models/AdminEloquent.php`
- Controllers: `app/Http/Controllers/Admin/AdminUserController.php`

### Admin vs User - Key Differences

| Aspect | Admin Context | User Context |
|--------|--------------|--------------|
| **Purpose** | Administrator accounts | End-user accounts |
| **Managed by** | Self-managed by admins | Managed BY admins |
| **Auth Guard** | `admin` | `web` |
| **Routes** | `/api/admin-users` | `/api/users` |
| **Controller** | `AdminUserController` | `UserController` |
| **Business Rules** | Role hierarchy, permissions | Status, email verification |
| **Domain Entity** | `App\Domain\Admin\Entities\Admin` | `App\Domain\User\Entities\User` |

**Important**: `UserController` manages User entities (for admin dashboard), `AdminUserController` manages Admin entities.

---

## Authentication & Authorization

### Authentication Guard

Admins use the `admin` authentication guard defined in `config/auth.php`:

```php
'guards' => [
    'admin' => [
        'driver' => 'session',
        'provider' => 'admins',
    ],
],

'providers' => [
    'admins' => [
        'driver' => 'eloquent',
        'model' => App\Models\Admin::class,
    ],
],
```

### Admin Routes

All admin API routes are protected by the `auth:admin` middleware:

```php
// routes/api.php
Route::prefix('api')->middleware(['auth:admin', 'admin.authenticate'])->group(function () {
    // Admin user management (manages Admin entities)
    Route::get('/admin-users', [AdminUserController::class, 'index']);
    Route::post('/admin-users', [AdminUserController::class, 'store']);
    Route::get('/admin-users/{id}', [AdminUserController::class, 'show']);
    Route::put('/admin-users/{id}', [AdminUserController::class, 'update']);
    Route::delete('/admin-users/{id}', [AdminUserController::class, 'destroy']);

    // User management (manages User entities - different context!)
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    // ...
});
```

### Role-Based Authorization

Admins have roles with a hierarchy:

```php
// app/Domain/Admin/ValueObjects/AdminRole.php
enum AdminRole: string
{
    case SUPER_ADMIN = 'super_admin';  // Level 3
    case ADMIN = 'admin';               // Level 2
    case MODERATOR = 'moderator';       // Level 1

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
}
```

**Business Rules:**
- Only super admins can assign super admin role
- Admins can only manage admins with lower role levels
- Admins cannot modify their own role

---

## Admin Entity Patterns

### Admin Entity Structure

**Location**: `app/Domain/Admin/Entities/Admin.php`

```php
<?php

declare(strict_types=1);

namespace App\Domain\Admin\Entities;

use App\Domain\Admin\Events\AdminCreated;
use App\Domain\Admin\Events\AdminUpdated;
use App\Domain\Admin\Exceptions\InvalidRoleAssignmentException;
use App\Domain\Admin\ValueObjects\AdminRole;
use App\Domain\Admin\ValueObjects\AdminStatus;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use DateTimeImmutable;

final class Admin
{
    /** @var array<object> */
    private array $domainEvents = [];

    private function __construct(
        private ?int $id,
        private FullName $name,
        private EmailAddress $email,
        private AdminRole $role,
        private AdminStatus $status,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt,
        private ?DateTimeImmutable $deletedAt,
    ) {
    }

    /**
     * Create a new admin (for new instances).
     */
    public static function create(
        FullName $name,
        EmailAddress $email,
        AdminRole $role,
    ): self {
        $admin = new self(
            id: null,
            name: $name,
            email: $email,
            role: $role,
            status: AdminStatus::ACTIVE,
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable(),
            deletedAt: null,
        );

        // Note: Event should be recorded after ID is set
        // For consistency with User entity pattern
        return $admin;
    }

    /**
     * Record creation event after ID is set.
     */
    public function recordCreationEvent(): void
    {
        if ($this->id === null) {
            throw new \LogicException('Cannot record creation event before entity has an ID');
        }

        $this->recordEvent(new AdminCreated(
            adminId: $this->id,
            email: $this->email->value(),
            name: $this->name->full(),
            role: $this->role->value,
        ));
    }

    /**
     * Reconstitute from persistence.
     */
    public static function reconstitute(
        int $id,
        FullName $name,
        EmailAddress $email,
        AdminRole $role,
        AdminStatus $status,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt,
        ?DateTimeImmutable $deletedAt,
    ): self {
        return new self(
            id: $id,
            name: $name,
            email: $email,
            role: $role,
            status: $status,
            createdAt: $createdAt,
            updatedAt: $updatedAt,
            deletedAt: $deletedAt,
        );
    }

    // Getters
    public function id(): ?int { return $this->id; }
    public function name(): FullName { return $this->name; }
    public function email(): EmailAddress { return $this->email; }
    public function role(): AdminRole { return $this->role; }
    public function status(): AdminStatus { return $this->status; }
    public function createdAt(): DateTimeImmutable { return $this->createdAt; }
    public function updatedAt(): DateTimeImmutable { return $this->updatedAt; }
    public function deletedAt(): ?DateTimeImmutable { return $this->deletedAt; }

    // Exception for persistence
    public function setId(int $id): void { $this->id = $id; }

    // Business logic methods
    public function updateProfile(FullName $name, EmailAddress $email): void
    {
        $changes = [];

        if (!$name->equals($this->name)) {
            $this->name = $name;
            $changes['name'] = $name->full();
        }

        if (!$email->equals($this->email)) {
            $this->email = $email;
            $changes['email'] = $email->value();
        }

        if (!empty($changes)) {
            $this->updatedAt = new DateTimeImmutable();
            $this->recordEvent(new AdminUpdated($this->id ?? 0, $changes));
        }
    }

    /**
     * Change role with authorization check.
     *
     * @param AdminRole $newRole The role to assign
     * @param Admin $performingAdmin The admin performing this action
     * @throws InvalidRoleAssignmentException
     */
    public function changeRole(AdminRole $newRole, Admin $performingAdmin): void
    {
        // Business Rule: Only super admins can assign super admin role
        if ($newRole === AdminRole::SUPER_ADMIN && !$performingAdmin->role()->isSuperAdmin()) {
            throw InvalidRoleAssignmentException::cannotAssignSuperAdmin();
        }

        // Business Rule: Cannot assign role higher than your own
        if ($newRole->hierarchyLevel() >= $performingAdmin->role()->hierarchyLevel()) {
            throw InvalidRoleAssignmentException::cannotAssignHigherRole($newRole);
        }

        if ($this->role === $newRole) {
            return; // No change
        }

        $oldRole = $this->role;
        $this->role = $newRole;
        $this->updatedAt = new DateTimeImmutable();

        $this->recordEvent(new AdminRoleChanged(
            adminId: $this->id ?? 0,
            oldRole: $oldRole->value,
            newRole: $newRole->value,
            performedBy: $performingAdmin->id() ?? 0,
        ));
    }

    /**
     * Check if this admin can manage another admin.
     */
    public function canManage(Admin $other): bool
    {
        // Cannot manage yourself
        if ($this->id === $other->id) {
            return false;
        }

        // Can only manage admins with lower role level
        return $this->role->isHigherThan($other->role);
    }

    public function activate(): void
    {
        if ($this->status === AdminStatus::ACTIVE) {
            return;
        }

        $this->status = AdminStatus::ACTIVE;
        $this->updatedAt = new DateTimeImmutable();
        $this->recordEvent(new AdminActivated($this->id ?? 0));
    }

    public function deactivate(): void
    {
        if ($this->status === AdminStatus::INACTIVE) {
            return;
        }

        $this->status = AdminStatus::INACTIVE;
        $this->updatedAt = new DateTimeImmutable();
        $this->recordEvent(new AdminDeactivated($this->id ?? 0));
    }

    public function delete(): void
    {
        if ($this->isDeleted()) {
            throw AdminAlreadyDeletedException::withId($this->id ?? 0);
        }

        $this->status = AdminStatus::INACTIVE;
        $this->deletedAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
        $this->recordEvent(new AdminDeleted($this->id ?? 0));
    }

    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }

    public function isActive(): bool
    {
        return $this->status === AdminStatus::ACTIVE && !$this->isDeleted();
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

### Admin Value Objects

**AdminRole** (Enum): `app/Domain/Admin/ValueObjects/AdminRole.php`

```php
enum AdminRole: string
{
    case SUPER_ADMIN = 'super_admin';
    case ADMIN = 'admin';
    case MODERATOR = 'moderator';

    public function isSuperAdmin(): bool
    {
        return $this === self::SUPER_ADMIN;
    }

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
}
```

**AdminStatus** (Enum): `app/Domain/Admin/ValueObjects/AdminStatus.php`

```php
enum AdminStatus: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
}
```

---

## Application Services

### AdminApplicationService

**Location**: `app/Application/Admin/Services/AdminApplicationService.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Admin\Services;

use App\Application\Admin\DTOs\AdminData;
use App\Application\Admin\DTOs\CreateAdminData;
use App\Application\Admin\DTOs\UpdateAdminData;
use App\Domain\Admin\Entities\Admin;
use App\Domain\Admin\Exceptions\AdminAlreadyExistsException;
use App\Domain\Admin\Exceptions\AdminNotFoundException;
use App\Domain\Admin\Repositories\AdminRepositoryInterface;
use App\Domain\Admin\ValueObjects\AdminRole;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use App\Infrastructure\Persistence\Eloquent\Repositories\AdminReadModelService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;

final class AdminApplicationService
{
    public function __construct(
        private readonly AdminRepositoryInterface $adminRepository,
        private readonly AdminReadModelService $adminReadModelService,
    ) {
    }

    /**
     * Create a new admin.
     */
    public function createAdmin(CreateAdminData $data): AdminData
    {
        // Check if email already exists
        if ($this->adminRepository->existsByEmail($data->email)) {
            throw AdminAlreadyExistsException::withEmail($data->email);
        }

        // Get performing admin for authorization
        $performingAdmin = $this->getAuthenticatedAdmin();

        // Create domain entity
        $admin = Admin::create(
            name: FullName::from($data->first_name, $data->last_name),
            email: EmailAddress::from($data->email),
            role: AdminRole::from($data->role),
        );

        // Check authorization for role assignment
        $role = AdminRole::from($data->role);
        if ($role === AdminRole::SUPER_ADMIN && !$performingAdmin->role()->isSuperAdmin()) {
            throw InvalidRoleAssignmentException::cannotAssignSuperAdmin();
        }

        // Hash password (infrastructure concern)
        $hashedPassword = Hash::make($data->password);

        // Persist in transaction
        return DB::transaction(function () use ($admin, $hashedPassword) {
            $this->adminRepository->save($admin, $hashedPassword);

            // Record creation event
            $admin->recordCreationEvent();

            $this->dispatchEvents($admin);

            return AdminData::fromEntity($admin);
        });
    }

    /**
     * Update an existing admin.
     */
    public function updateAdmin(int $id, UpdateAdminData $data): AdminData
    {
        $admin = $this->adminRepository->findById($id);
        $performingAdmin = $this->getAuthenticatedAdmin();

        // Check if performing admin can manage this admin
        if (!$performingAdmin->canManage($admin)) {
            throw UnauthorizedAdminActionException::cannotManageAdmin($admin->id() ?? 0);
        }

        // Check email uniqueness if changed
        if ($data->email !== null && $data->email !== $admin->email()->value()) {
            if ($this->adminRepository->existsByEmail($data->email)) {
                throw AdminAlreadyExistsException::withEmail($data->email);
            }
        }

        // Update profile if name or email changed
        if ($data->first_name !== null || $data->last_name !== null || $data->email !== null) {
            $admin->updateProfile(
                name: FullName::from(
                    $data->first_name ?? $admin->name()->firstName(),
                    $data->last_name ?? $admin->name()->lastName(),
                ),
                email: EmailAddress::from($data->email ?? $admin->email()->value()),
            );
        }

        // Change role if specified
        if ($data->role !== null) {
            $admin->changeRole(AdminRole::from($data->role), $performingAdmin);
        }

        $hashedPassword = $data->password !== null ? Hash::make($data->password) : null;

        // Persist in transaction
        return DB::transaction(function () use ($admin, $hashedPassword) {
            $this->adminRepository->save($admin, $hashedPassword);
            $this->dispatchEvents($admin);

            return AdminData::fromEntity($admin);
        });
    }

    /**
     * Get paginated list of admins with infrastructure data.
     */
    public function getPaginatedAdmins(int $page, int $perPage, array $filters): array
    {
        $result = $this->adminRepository->paginate($page, $perPage, $filters);

        // Get infrastructure-specific data (last_login_at)
        $adminIds = array_map(fn($admin) => $admin->id(), $result['data']);
        $lastLoginTimestamps = $this->adminReadModelService->getLastLoginTimestamps($adminIds);

        // Combine domain and infrastructure data
        $result['data'] = array_map(function($admin) use ($lastLoginTimestamps) {
            return AdminData::fromEntity($admin, $lastLoginTimestamps[$admin->id()] ?? null);
        }, $result['data']);

        return $result;
    }

    /**
     * Delete an admin.
     */
    public function deleteAdmin(int $id): void
    {
        $admin = $this->adminRepository->findById($id);
        $performingAdmin = $this->getAuthenticatedAdmin();

        // Check if performing admin can manage this admin
        if (!$performingAdmin->canManage($admin)) {
            throw UnauthorizedAdminActionException::cannotManageAdmin($admin->id() ?? 0);
        }

        $admin->delete();

        DB::transaction(function () use ($admin) {
            $this->adminRepository->delete($admin);
            $this->dispatchEvents($admin);
        });
    }

    /**
     * Get authenticated admin.
     */
    private function getAuthenticatedAdmin(): Admin
    {
        /** @var \App\Models\Admin|null $adminModel */
        $adminModel = Auth::guard('admin')->user();

        if ($adminModel === null) {
            throw new \RuntimeException('No authenticated admin found');
        }

        return $this->adminRepository->findById($adminModel->id);
    }

    /**
     * Dispatch domain events.
     */
    private function dispatchEvents(Admin $admin): void
    {
        foreach ($admin->releaseEvents() as $event) {
            Event::dispatch($event);
        }
    }
}
```

### Admin DTOs

**CreateAdminData**: `app/Application/Admin/DTOs/CreateAdminData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Admin\DTOs;

use Spatie\LaravelData\Data;

final class CreateAdminData extends Data
{
    public function __construct(
        public readonly string $first_name,
        public readonly string $last_name,
        public readonly string $email,
        public readonly string $password,
        public readonly string $role,
    ) {
    }

    public static function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:admins,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:super_admin,admin,moderator'],
        ];
    }
}
```

**AdminData** (with infrastructure field): `app/Application/Admin/DTOs/AdminData.php`

```php
<?php

declare(strict_types=1);

namespace App\Application\Admin\DTOs;

use App\Domain\Admin\Entities\Admin;
use Spatie\LaravelData\Data;

final class AdminData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly string $first_name,
        public readonly string $last_name,
        public readonly string $name,
        public readonly string $email,
        public readonly string $role,
        public readonly string $status,
        public readonly bool $is_active,
        public readonly bool $is_deleted,
        public readonly string $created_at,
        public readonly string $updated_at,
        public readonly ?string $deleted_at,
        public readonly ?string $last_login_at, // Infrastructure field
    ) {
    }

    /**
     * Create from domain entity.
     *
     * @param Admin $admin Domain entity
     * @param string|null $lastLoginAt Infrastructure field from AdminReadModelService
     */
    public static function fromEntity(Admin $admin, ?string $lastLoginAt = null): self
    {
        return new self(
            id: $admin->id() ?? 0,
            first_name: $admin->name()->firstName(),
            last_name: $admin->name()->lastName(),
            name: $admin->name()->full(),
            email: $admin->email()->value(),
            role: $admin->role()->value,
            status: $admin->status()->value,
            is_active: $admin->isActive(),
            is_deleted: $admin->isDeleted(),
            created_at: $admin->createdAt()->format('Y-m-d H:i:s'),
            updated_at: $admin->updatedAt()->format('Y-m-d H:i:s'),
            deleted_at: $admin->deletedAt()?->format('Y-m-d H:i:s'),
            last_login_at: $lastLoginAt, // From infrastructure
        );
    }
}
```

---

## Controllers & Routes

### AdminUserController

**Location**: `app/Http/Controllers/Admin/AdminUserController.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Application\Admin\DTOs\CreateAdminData;
use App\Application\Admin\DTOs\UpdateAdminData;
use App\Application\Admin\Services\AdminApplicationService;
use App\Domain\Admin\Exceptions\AdminAlreadyExistsException;
use App\Domain\Admin\Exceptions\AdminNotFoundException;
use App\Domain\Admin\Exceptions\InvalidRoleAssignmentException;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin User Controller - manages Admin entities.
 *
 * NOTE: This is different from UserController which manages User entities.
 */
final class AdminUserController extends Controller
{
    public function __construct(
        private readonly AdminApplicationService $adminService,
    ) {
    }

    /**
     * Display a listing of admins.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [
            'search' => $request->input('search'),
            'role' => $request->input('role'),
            'status' => $request->input('status'),
            'order_by' => $request->input('order_by', 'created_at'),
            'order_direction' => $request->input('order_direction', 'desc'),
        ];

        $result = $this->adminService->getPaginatedAdmins(
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
     * Store a newly created admin.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(CreateAdminData::rules());

        try {
            $data = CreateAdminData::from($validated);
            $adminData = $this->adminService->createAdmin($data);
            return ApiResponse::created($adminData->toArray(), 'Admin created successfully');
        } catch (AdminAlreadyExistsException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        } catch (InvalidRoleAssignmentException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Display the specified admin.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $adminData = $this->adminService->getAdminById($id);
            return ApiResponse::success($adminData->toArray());
        } catch (AdminNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }

    /**
     * Update the specified admin.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'password' => 'nullable|string|min:8',
            'role' => 'nullable|in:super_admin,admin,moderator',
        ]);

        try {
            $data = UpdateAdminData::from($validated);
            $adminData = $this->adminService->updateAdmin($id, $data);
            return ApiResponse::success($adminData->toArray(), 'Admin updated successfully');
        } catch (AdminNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        } catch (AdminAlreadyExistsException $e) {
            return ApiResponse::error($e->getMessage(), null, 422);
        } catch (InvalidRoleAssignmentException $e) {
            return ApiResponse::error($e->getMessage(), null, 403);
        }
    }

    /**
     * Remove the specified admin.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->adminService->deleteAdmin($id);
            return ApiResponse::success(null, 'Admin deleted successfully');
        } catch (AdminNotFoundException $e) {
            return ApiResponse::error($e->getMessage(), null, 404);
        }
    }
}
```

### Routes

**Location**: `routes/api.php`

```php
Route::prefix('api')
    ->middleware(['auth:admin', 'admin.authenticate'])
    ->group(function () {
        // Admin user management (manages Admin entities)
        Route::get('/admin-users', [AdminUserController::class, 'index']);
        Route::post('/admin-users', [AdminUserController::class, 'store']);
        Route::get('/admin-users/{id}', [AdminUserController::class, 'show']);
        Route::put('/admin-users/{id}', [AdminUserController::class, 'update']);
        Route::delete('/admin-users/{id}', [AdminUserController::class, 'destroy']);
    });
```

---

## Step-by-Step Workflows

### Workflow: Adding a New Admin Feature

**Example: Add "Admin Last Login Tracking"**

#### Step 1: Identify if Feature Belongs in Domain or Infrastructure

**Last login tracking** is infrastructure-level metadata (not a business rule), so:
- ✅ Store in database: `last_login_at` column
- ✅ Query via `AdminReadModelService`
- ❌ NOT in Admin domain entity

#### Step 2: Create Migration

```bash
php artisan make:migration add_last_login_at_to_admins_table
```

```php
public function up()
{
    Schema::table('admins', function (Blueprint $table) {
        $table->timestamp('last_login_at')->nullable()->after('updated_at');
    });
}
```

#### Step 3: Update Eloquent Model

```php
// app/Infrastructure/Persistence/Eloquent/Models/AdminEloquent.php
protected $fillable = [
    // ...existing fields...
    'last_login_at',
];

protected function casts(): array
{
    return [
        'last_login_at' => 'datetime',
        // ...existing casts...
    ];
}
```

#### Step 4: Update or Create Read Model Service

```php
// app/Infrastructure/Persistence/Eloquent/Repositories/AdminReadModelService.php
public function getLastLoginTimestamp(int $adminId): ?string
{
    $admin = AdminEloquent::where('id', $adminId)
        ->select(['id', 'last_login_at'])
        ->first();

    return $admin?->last_login_at?->toISOString();
}

public function updateLastLogin(int $adminId): void
{
    AdminEloquent::where('id', $adminId)
        ->update(['last_login_at' => now()]);
}
```

#### Step 5: Use in Authentication Controller

```php
// app/Http/Controllers/Admin/AdminAuthController.php
public function login(LoginRequest $request): JsonResponse
{
    // ... authentication logic ...

    // Update last login (infrastructure concern)
    $this->adminReadModelService->updateLastLogin($admin->id);

    return ApiResponse::success([...]);
}
```

#### Step 6: Update AdminData DTO

Already done! `AdminData::fromEntity()` accepts `$lastLoginAt` parameter.

#### Step 7: Test

```php
// tests/Feature/Admin/AdminAuthTest.php
public function test_updates_last_login_on_successful_login(): void
{
    $admin = Admin::factory()->create();

    $this->assertNull($admin->fresh()->last_login_at);

    $this->postJson('/api/login', [
        'email' => $admin->email,
        'password' => 'password',
    ])->assertOk();

    $this->assertNotNull($admin->fresh()->last_login_at);
}
```

---

## Testing Admin Features

### Unit Tests (Domain Layer)

**Location**: `tests/Unit/Domain/Admin/Entities/AdminTest.php`

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Admin\Entities;

use App\Domain\Admin\Entities\Admin;
use App\Domain\Admin\Events\AdminCreated;
use App\Domain\Admin\ValueObjects\AdminRole;
use App\Domain\Admin\ValueObjects\AdminStatus;
use App\Domain\Shared\ValueObjects\EmailAddress;
use App\Domain\Shared\ValueObjects\FullName;
use Tests\TestCase;

class AdminTest extends TestCase
{
    public function test_can_create_admin(): void
    {
        $admin = Admin::create(
            name: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john@example.com'),
            role: AdminRole::ADMIN,
        );

        $this->assertNull($admin->id());
        $this->assertEquals('John Doe', $admin->name()->full());
        $this->assertEquals('john@example.com', $admin->email()->value());
        $this->assertEquals(AdminRole::ADMIN, $admin->role());
        $this->assertEquals(AdminStatus::ACTIVE, $admin->status());
        $this->assertTrue($admin->isActive());
    }

    public function test_super_admin_can_manage_admin(): void
    {
        $superAdmin = Admin::reconstitute(
            id: 1,
            name: FullName::from('Super', 'Admin'),
            email: EmailAddress::from('super@example.com'),
            role: AdminRole::SUPER_ADMIN,
            status: AdminStatus::ACTIVE,
            createdAt: new \DateTimeImmutable(),
            updatedAt: new \DateTimeImmutable(),
            deletedAt: null,
        );

        $regularAdmin = Admin::reconstitute(
            id: 2,
            name: FullName::from('Regular', 'Admin'),
            email: EmailAddress::from('admin@example.com'),
            role: AdminRole::ADMIN,
            status: AdminStatus::ACTIVE,
            createdAt: new \DateTimeImmutable(),
            updatedAt: new \DateTimeImmutable(),
            deletedAt: null,
        );

        $this->assertTrue($superAdmin->canManage($regularAdmin));
        $this->assertFalse($regularAdmin->canManage($superAdmin));
    }

    public function test_admin_cannot_manage_themselves(): void
    {
        $admin = Admin::reconstitute(
            id: 1,
            name: FullName::from('John', 'Doe'),
            email: EmailAddress::from('john@example.com'),
            role: AdminRole::ADMIN,
            status: AdminStatus::ACTIVE,
            createdAt: new \DateTimeImmutable(),
            updatedAt: new \DateTimeImmutable(),
            deletedAt: null,
        );

        $this->assertFalse($admin->canManage($admin));
    }
}
```

### Feature Tests (HTTP Layer)

**Location**: `tests/Feature/Admin/AdminUserControllerTest.php`

```php
<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserControllerTest extends TestCase
{
    use RefreshDatabase;

    private Admin $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->superAdmin = Admin::factory()->create(['role' => 'super_admin']);
    }

    public function test_can_list_admins(): void
    {
        Admin::factory()->count(3)->create();

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->getJson('/api/admin-users');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'email', 'role', 'last_login_at']
            ],
            'meta' => ['total', 'per_page', 'current_page', 'last_page'],
        ]);
    }

    public function test_can_create_admin_with_valid_role(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')
            ->postJson('/api/admin-users', [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john@example.com',
                'password' => 'password123',
                'role' => 'admin',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('admins', [
            'email' => 'john@example.com',
            'role' => 'admin',
        ]);
    }

    public function test_regular_admin_cannot_assign_super_admin_role(): void
    {
        $regularAdmin = Admin::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($regularAdmin, 'admin')
            ->postJson('/api/admin-users', [
                'first_name' => 'Jane',
                'last_name' => 'Doe',
                'email' => 'jane@example.com',
                'password' => 'password123',
                'role' => 'super_admin',
            ]);

        $response->assertStatus(403);
    }
}
```

---

## Next Steps

- **For architecture overview**: See [DDD Backend Architecture Overview](./ddd-overview.md)
- **For User development**: See [User Backend Development Guide](./user-backend-guide.md)

---

**End of Admin Backend Development Guide v3.0**

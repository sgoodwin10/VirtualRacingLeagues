# DDD Backend Architecture Overview

**Version**: 3.0
**Last Updated**: January 2025
**Purpose**: Core DDD architecture principles and patterns for this Laravel backend

---

## Table of Contents

1. [Architecture Layers](#architecture-layers)
2. [Decision Trees](#decision-trees)
3. [Core Patterns](#core-patterns)
4. [Packages & Tools](#packages--tools)
5. [Testing Strategy](#testing-strategy)
6. [Common Commands](#common-commands)
7. [Do's and Don'ts](#dos-and-donts)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Layers

### Four-Layer Architecture

```
┌─────────────────────────────────────┐
│  Interface Layer                    │  HTTP Controllers (3-5 lines/method)
│  app/Http/Controllers/Admin/        │  Form Requests, ApiResponse helper
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Application Layer                  │  Use case orchestration
│  app/Application/{Context}/         │  DTOs (Spatie Laravel Data)
│    - Services/                      │  Transactions, event dispatching
│    - DTOs/                          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Domain Layer (Pure PHP)            │  Business logic, domain events
│  app/Domain/{Context}/              │  NO Laravel dependencies
│    - Entities/                      │  Value objects for validation
│    - ValueObjects/                  │  Repository interfaces only
│    - Events/                        │
│    - Exceptions/                    │
│    - Repositories/ (interfaces)     │
└─────────────────────────────────────┘
              ↑
┌─────────────────────────────────────┐
│  Infrastructure Layer               │  Eloquent models (anemic)
│  app/Infrastructure/Persistence/    │  Repository implementations
│    - Eloquent/Models/               │  Entity ↔ Eloquent mapping
│    - Eloquent/Repositories/         │  Event listeners
└─────────────────────────────────────┘
```

### Bounded Contexts

This application is organized into three main bounded contexts:

- **Admin**: `/app/Domain/Admin/`, `/app/Application/Admin/` - Administrator management with roles and permissions
- **User**: `/app/Domain/User/`, `/app/Application/User/` - End-user accounts managed by admins
- **SiteConfig**: `/app/Domain/SiteConfig/`, `/app/Application/SiteConfig/` - System-wide configuration
- **Shared**: `/app/Domain/Shared/` - Shared value objects (EmailAddress, FullName)

**Important Note**: Admin and User are **separate bounded contexts** with different business rules and lifecycles. See context-specific guides for details.

### Dependency Rule

**Dependencies point INWARD only**. The domain layer has zero external dependencies.

- ✅ Infrastructure → Domain (implements interfaces)
- ✅ Application → Domain (uses entities, repositories)
- ✅ Interface → Application (calls services)
- ❌ Domain → Infrastructure (NEVER)
- ❌ Domain → Application (NEVER)

---

## Decision Trees

### Where Does This Code Go?

```
┌─ Is it a business rule or invariant?
│  → Domain Entity method
│
├─ Is it validation or a domain concept?
│  → Value Object (readonly class) OR Enum (predefined set)
│
├─ Is it data validation for API input?
│  → DTO with rules() method
│
├─ Is it use case orchestration (multi-step operation)?
│  → Application Service method
│
├─ Is it database access or querying?
│  → Repository implementation
│
├─ Is it HTTP request handling?
│  → Controller (thin, 3-5 lines)
│
├─ Is it external service integration?
│  → Infrastructure layer service
│
└─ Is it data transformation for API output?
   → DTO::fromEntity() method
```

### Entity vs Value Object vs Enum

```
┌─ Does it have identity (needs an ID)?
│  → Entity
│  Examples: User, Admin, SiteConfig
│
├─ Is it a predefined set of values with behavior?
│  → Enum (PHP 8.1+)
│  Examples: AdminRole, UserStatus, AdminStatus
│
└─ Is it a domain concept without identity?
   → Value Object (readonly class)
   Examples: EmailAddress, FullName, TrackingId
```

### When to Create Domain Events

```
┌─ Does this action have side effects elsewhere in the system?
│  YES → Create domain event
│  Examples: UserCreated (send welcome email), AdminUpdated (log activity)
│
└─ Is it a significant state change worth tracking?
   YES → Create domain event
   Examples: UserDeleted, ProfilePictureUpdated
```

### When to Create a New Bounded Context

```
Create a new bounded context when:
✓ The concept has its own lifecycle
✓ It has distinct business rules from existing contexts
✓ It will grow independently
✓ It has different stakeholders or experts

DON'T create a new context for:
✗ Simple CRUD entities without complex business logic
✗ Entities that are just properties of another entity
✗ Entities that share the same lifecycle as another entity
```

---

## Core Patterns

### Layer Responsibilities

#### Domain Layer (`app/Domain/{Context}/`)

**What goes here:**
- ✅ Business logic and invariants
- ✅ Domain entities (aggregate roots)
- ✅ Value objects and enums
- ✅ Domain events
- ✅ Domain exceptions
- ✅ Repository interfaces

**What NEVER goes here:**
- ❌ Laravel framework classes (no `use Illuminate\...`)
- ❌ Database queries
- ❌ HTTP logic
- ❌ Infrastructure concerns (hashing, file storage, etc.)

#### Application Layer (`app/Application/{Context}/`)

**What goes here:**
- ✅ Use case orchestration
- ✅ DTOs (input and output)
- ✅ Transaction management (`DB::transaction()`)
- ✅ Domain event dispatching
- ✅ Calling multiple repositories
- ✅ Infrastructure concerns (hashing passwords, sending emails)

**What NEVER goes here:**
- ❌ Business logic (belongs in entities)
- ❌ HTTP concerns (belongs in controllers)
- ❌ Direct database access (use repositories)

#### Infrastructure Layer (`app/Infrastructure/`)

**What goes here:**
- ✅ Eloquent models (anemic, no business logic)
- ✅ Repository implementations
- ✅ Entity ↔ Eloquent mapping
- ✅ Event listeners
- ✅ External service integrations
- ✅ Read Model Services (for infrastructure-only fields)

**What NEVER goes here:**
- ❌ Business logic (belongs in domain)
- ❌ Use case orchestration (belongs in application)

#### Interface Layer (`app/Http/`)

**What goes here:**
- ✅ Thin controllers (3-5 lines per method, max 10)
- ✅ Request validation (inline or Form Requests)
- ✅ Response formatting (ApiResponse helper)
- ✅ Exception handling

**What NEVER goes here:**
- ❌ Business logic
- ❌ Database queries
- ❌ Fat controllers (>10 lines per method)

---

## Packages & Tools

### Core Dependencies

**Domain-Driven Design:**
- **spatie/laravel-data** (^4.17) - Type-safe DTOs with validation
- **spatie/laravel-activitylog** (^4.10) - User activity tracking

**Testing & Quality:**
- **phpunit/phpunit** - Unit and feature testing
- **phpstan/phpstan** - Static analysis (Level 8)
- **squizlabs/php_codesniffer** - PSR-12 code style checking
- **laravel/pint** - Laravel code formatter

**Infrastructure:**
- **laravel/sanctum** - API authentication
- Docker stack: Nginx, PHP 8.2+, MariaDB 10.11, Redis 7, Elasticsearch 8.11

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

**Key Principles:**
- No database
- Test business logic
- Test invariants
- Test domain events
- Use pure entity/value object creation (no factories)

**Location**: `tests/Unit/Domain/{Context}/`

### Feature Tests (HTTP Layer)

**Target**: Cover all API endpoints

**Key Principles:**
- Test HTTP layer
- Use database (RefreshDatabase trait)
- Test authentication
- Test response structure
- Use factories for test data

**Location**: `tests/Feature/Admin/`

### PHPStan (Level 8)

**Requirements:**
- All properties must have type hints
- All methods must have return type hints
- Arrays must have PHPDoc type hints (`@return array<User>`)
- Nullable values must be handled explicitly

---

## Common Commands

### Testing

```bash
# Run all tests
composer test

# Run specific test file
composer test tests/Unit/Domain/User/Entities/UserTest.php

# Run tests with filter
composer test --filter=UserTest

# Run unit tests only
composer test tests/Unit/

# Run feature tests only
composer test tests/Feature/
```

### Static Analysis & Code Style

```bash
# PHPStan (level 8)
composer phpstan

# PHP CodeSniffer (PSR-12)
composer phpcs

# Auto-fix code style
composer phpcbf

# Laravel Pint
./vendor/bin/pint

# Run all quality checks
composer phpstan && composer phpcs
```

### Migrations & Database

```bash
# Run migrations
php artisan migrate

# Rollback migrations
php artisan migrate:rollback

# Fresh migrations with seeders
php artisan migrate:fresh --seed

# Create migration
php artisan make:migration create_users_table
```

### Cache Management

```bash
# Clear all caches
php artisan optimize:clear

# Clear specific caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

---

## Do's and Don'ts

### ✅ DO

**Domain Layer:**
- ✅ Put ALL business logic in entities
- ✅ Use value objects for domain concepts (EmailAddress, not string)
- ✅ Use enums for predefined sets with behavior
- ✅ Emit domain events for significant state changes
- ✅ Keep domain layer pure PHP (no Laravel)
- ✅ Write unit tests for all entities
- ✅ Throw domain exceptions

**Application Layer:**
- ✅ Use transactions for multi-step operations
- ✅ Dispatch domain events AFTER persistence
- ✅ Return DTOs from application services
- ✅ Hash passwords in application service
- ✅ Orchestrate use cases, don't implement business logic

**Infrastructure Layer:**
- ✅ Keep Eloquent models anemic
- ✅ Map between entities and Eloquent in repositories
- ✅ Use `withTrashed()` for soft-deleted records
- ✅ Use Read Model Services for infrastructure-only fields

**Interface Layer:**
- ✅ Keep controllers thin (3-5 lines per method)
- ✅ Validate input with DTOs
- ✅ Use ApiResponse helper
- ✅ Call `toArray()` on DTOs before returning JSON

### ❌ DON'T

**Domain Layer:**
- ❌ Don't use Laravel classes in domain
- ❌ Don't access database directly
- ❌ Don't use primitive types for domain concepts
- ❌ Don't skip domain events
- ❌ Don't use public setters on entities

**Application Layer:**
- ❌ Don't put business logic in application services
- ❌ Don't return entities (return DTOs)
- ❌ Don't skip transactions
- ❌ Don't hash passwords in domain layer

**Infrastructure Layer:**
- ❌ Don't put business logic in Eloquent models
- ❌ Don't expose Eloquent models outside infrastructure
- ❌ Don't bypass repositories

**Interface Layer:**
- ❌ Don't put business logic in controllers
- ❌ Don't return entities (return DTOs)
- ❌ Don't make controllers fat

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
 * @return array<User>
 */
public function getAll(): array
```

**Possibly null value:**
```php
// ❌ Wrong
$admin = Auth::guard('admin')->user();
$admin->id; // PHPStan error

// ✅ Correct
/** @var Admin $admin */
$admin = Auth::guard('admin')->user();
assert($admin instanceof Admin);
$admin->id;
```

### DTO Issues

**Not serializing:**
```php
// ❌ Wrong
return response()->json(['data' => $userDTO]);

// ✅ Correct
return ApiResponse::success($userDTO->toArray());
```

### Repository Issues

**Soft-deleted records:**
```php
// ❌ Wrong - excludes soft deletes
$eloquentUser = UserEloquent::find($id);

// ✅ Correct - includes soft deletes
$eloquentUser = UserEloquent::withTrashed()->find($id);
```

### Domain Event Issues

**Events not firing - check:**
1. Entity recording event: `$this->recordEvent(new UserCreated(...))`
2. Application service dispatching: `$this->dispatchEvents($user)`
3. Event listener registered in `EventServiceProvider`
4. Transaction committed (events dispatch AFTER commit)

---

## File Location Reference

```
Entity                → app/Domain/{Context}/Entities/
Value Object          → app/Domain/{Context}/ValueObjects/ or Shared/
Enum                  → app/Domain/{Context}/ValueObjects/ (as enum)
Domain Event          → app/Domain/{Context}/Events/
Domain Exception      → app/Domain/{Context}/Exceptions/
Repository Interface  → app/Domain/{Context}/Repositories/
Application Service   → app/Application/{Context}/Services/
DTO                   → app/Application/{Context}/DTOs/
Eloquent Model        → app/Infrastructure/Persistence/Eloquent/Models/
Repository Impl       → app/Infrastructure/Persistence/Eloquent/Repositories/
Read Model Service    → app/Infrastructure/Persistence/Eloquent/Repositories/
Controller            → app/Http/Controllers/Admin/
Form Request          → app/Http/Requests/Admin/
Migration             → database/migrations/
Unit Test             → tests/Unit/Domain/{Context}/
Feature Test          → tests/Feature/Admin/
```

---

## Next Steps

- **For Admin development**: See [Admin Backend Development Guide](./admin-backend-guide.md)
- **For User development**: See [User Backend Development Guide](./user-backend-guide.md)

---

**End of DDD Backend Architecture Overview v3.0**

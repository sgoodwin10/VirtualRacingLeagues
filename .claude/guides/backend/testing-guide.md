# Backend Testing Guide

This guide explains the enhanced PHPUnit testing configuration optimized for Domain-Driven Design (DDD) architecture.

## Test Suite Architecture

The test suite is organized by DDD layers:

```
tests/
├── Unit/
│   ├── Domain/              # Domain Layer (pure business logic)
│   ├── Policies/            # Laravel policies
│   └── Rules/               # Laravel validation rules
├── Integration/
│   └── Persistence/         # Infrastructure Layer (repositories, Eloquent)
└── Feature/
    ├── Admin/               # Admin HTTP/API tests
    ├── Auth/                # Authentication tests
    └── Http/                # Other HTTP tests
```

## Running Tests

### All Tests
```bash
composer test
```

### By Test Suite
```bash
composer test:domain        # Domain tests (fastest - no database)
composer test:unit          # Unit tests (Laravel units without database)
composer test:integration   # Integration tests (with MariaDB)
composer test:feature       # Feature tests (full HTTP stack)
composer test:coverage      # With coverage report
```

## Test Suites

### 1. Domain Suite (`tests/Unit/Domain/`)
- Pure business logic without framework dependencies
- No database required
- Fastest execution
- Tests entities, value objects, domain events

### 2. Unit Suite (`tests/Unit/`)
- Laravel-specific units (policies, rules, helpers)
- SQLite in-memory database
- No HTTP requests

### 3. Integration Suite (`tests/Integration/`)
- Infrastructure layer (repositories, Eloquent)
- Tests against MariaDB (production-like)
- Verifies entity ↔ Eloquent mapping

### 4. Feature Suite (`tests/Feature/`)
- Full application stack (HTTP/API)
- Tests authentication, authorization, validation
- SQLite in-memory (fast)

## Database Strategy

### Dual Database Approach

1. **SQLite (`:memory:`)** - Default for Domain/Unit/Feature
   - Extremely fast (in-memory)
   - No setup required
   - Automatically reset between tests

2. **MariaDB (`testing` connection)** - For Integration tests
   - Production-like environment
   - Tests database-specific features
   - Catches database compatibility issues

## Configuration Features

- **Strict settings**: `failOnRisky`, `failOnWarning`, `executionOrder="random"`
- **Code coverage**: HTML, text, and Clover reports
- **Test isolation**: Random test order catches hidden dependencies
- **PHPUnit cache**: Faster subsequent runs

## Best Practices

1. **Organize by DDD layer** - Keep tests in appropriate suites
2. **Test isolation** - Each test should be independent
3. **Use factories** - Don't manually create test data
4. **Descriptive names** - `it_validates_email_format` not `testEmail`
5. **Appropriate assertions** - Match test type (domain/integration/feature)

## Need Help?

See also:
- [DDD Architecture Overview](./ddd-overview.md)
- [Admin Backend Guide](./admin-backend-guide.md)
- PHPUnit Documentation: https://phpunit.de/documentation.html
- Laravel Testing: https://laravel.com/docs/testing

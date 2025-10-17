# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Laravel 12 + Vue 3 Dual Dashboard Template** - a full-stack web application with two completely separate Single Page Applications (SPAs):

1. **User Dashboard** (`/`) - For end users
2. **Admin Dashboard** (`/admin`) - For administrators

Each dashboard has its own Vue.js application, routing, state management, styles, and test suite. They share the same Laravel backend but are otherwise independent.

## Development Environment

The project runs in Docker containers. All commands can be run directly from the working directory.

### Starting the Development Environment

```bash
# Start all services (from host if needed)
docker-compose up -d
```

### Running Development Servers

```bash
npm run dev                    # Vite dev server with hot reload
composer dev                   # Runs all services: Laravel server, queue, logs, and Vite (uses concurrently)
```

After starting, access:
- User Dashboard: `http://YOUR_DOMAIN.localhost:8000` (renders `resources/views/app.blade.php`)
- Admin Dashboard: `http://YOUR_DOMAIN.localhost:8000/admin` (renders `resources/views/admin.blade.php`)

**Note**: `YOUR_DOMAIN` is a placeholder configured in `.env` as `APP_URL`. Check `.env` for the actual domain.

## Critical Architecture Concepts

### Dual Dashboard Architecture

This is the most important architectural pattern in this codebase:

**Two completely separate Vue.js applications:**

```
resources/
├── user/                    # User Dashboard (Blue theme)
│   ├── css/app.css
│   └── js/
│       ├── app.ts          # Entry point
│       ├── router/         # Vue Router for user routes
│       ├── views/          # User views
│       ├── components/     # User components
│       ├── stores/         # Pinia stores for user
│       └── tests/          # User tests
└── admin/                   # Admin Dashboard (Dark theme)
    ├── css/app.css
    └── js/
        ├── app.ts          # Entry point
        ├── router/         # Vue Router for admin routes
        ├── views/          # Admin views
        ├── components/     # Admin components
        ├── stores/         # Pinia stores for admin
        └── tests/          # Admin tests
```

**Key implications:**
- Components and code are NOT shared between dashboards
- Each dashboard has its own Pinia store instance
- Path aliases: `@user` → `resources/user/js`, `@admin` → `resources/admin/js`
- Vite builds both dashboards separately (see `vite.config.ts`)
- Tests are separated by dashboard: `npm run test:user` and `npm run test:admin`
- use agent `dev-fe-admin` for the admin dashboard
- use agent `dev-fe-user` for the user dashboard

**📖 For admin dashboard development guidelines, see**: [Admin Dashboard Development Guide](./.claude/guides/frontend/admin-dashboard-development-guide.md)

### Laravel Backend Structure
- always use the agent `dev-be`

This project follows **Domain-Driven Design (DDD)** principles for the Laravel backend.

**📖 Backend Development Guides**:
- **[DDD Architecture Overview](./.claude/guides/backend/ddd-overview.md)** - Core architecture principles and patterns
- **[Admin Backend Guide](./.claude/guides/backend/admin-backend-guide.md)** - Admin context development (start here for admin features)
- **[User Backend Guide](./.claude/guides/backend/user-backend-guide.md)** - User context development (for future user features)

#### Quick Overview

The backend is organized into 4 layers:

```
┌─────────────────────────────────────────────────────────┐
│  Interface Layer (HTTP Controllers)                     │
│  Thin controllers (3-5 lines per method)                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Application Layer (Application Services, DTOs)         │
│  Use case orchestration, transactions                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Domain Layer (Entities, Value Objects, Events)         │
│  Pure business logic (NO Laravel dependencies)          │
└─────────────────────────────────────────────────────────┘
                          ↑
┌─────────────────────────────────────────────────────────┐
│  Infrastructure Layer (Eloquent, Repositories)          │
│  Database persistence, Entity ↔ Eloquent mapping       │
└─────────────────────────────────────────────────────────┘
```

```
app/
├── Domain/                  # Domain Layer (pure PHP, no Laravel)
│   ├── User/
│   │   ├── Entities/       # User entity
│   │   ├── ValueObjects/   # UserStatus, UserAlias, etc.
│   │   ├── Events/         # UserCreated, UserUpdated, etc.
│   │   ├── Exceptions/     # Domain-specific exceptions
│   │   └── Repositories/   # Repository interfaces
│   ├── Admin/              # Admin bounded context
│   └── Shared/             # Shared value objects (EmailAddress, FullName)
├── Application/             # Application Layer
│   ├── User/
│   │   ├── Services/       # UserApplicationService
│   │   └── DTOs/           # CreateUserData, UserData, etc.
│   └── Admin/
│       ├── Services/       # AdminApplicationService
│       └── DTOs/           # CreateAdminData, AdminData, etc.
├── Infrastructure/          # Infrastructure Layer
│   └── Persistence/
│       └── Eloquent/
│           ├── Models/     # Anemic Eloquent models
│           └── Repositories/  # Repository implementations
├── Http/                    # Interface Layer
│   ├── Controllers/
│   │   └── Admin/          # Thin controllers (3-5 lines per method)
│   └── Requests/           # Form request validation
└── Helpers/                # API response helpers
```

#### When Developing Backend Features:

1. **Read the relevant guide first**:
   - [DDD Architecture Overview](./.claude/guides/backend/ddd-overview.md) - Understand the architecture
   - [Admin Backend Guide](./.claude/guides/backend/admin-backend-guide.md) - For admin features
   - [User Backend Guide](./.claude/guides/backend/user-backend-guide.md) - For user features
2. Follow the step-by-step workflow for adding features
3. Put business logic in domain entities, NOT controllers
4. Use value objects for validation and domain concepts
5. Keep controllers thin (3-5 lines per method)
6. Write tests for domain layer (unit tests without database)
7. Use transactions in application services for consistency
8. Return DTOs from application services, NOT entities

**Authentication:**
- Users and Admins use separate authentication guards: `web` (users) and `admin` (admins)
- Admin API routes are prefixed with `/api/admin` and protected by `auth:admin` middleware
- Admin authentication managed by `AdminAuthController` at `app/Http/Controllers/Admin/AdminAuthController.php`

### Routing Architecture

**Backend (Laravel):**
```php
// routes/web.php
Route::get('/', fn() => view('app'));                    // User SPA entry
Route::get('/admin/{any?}', fn() => view('admin'))       // Admin SPA entry
    ->where('any', '(?!api).*');                          // Exclude /admin/api

Route::prefix('admin/api')->group(function () {
    // Admin API routes here
});
```

**Frontend (Vue Router):**
- User routes: `resources/user/js/router/index.ts` (handles `/`, `/leagues`, `/races`, `/profile`)
- Admin routes: `resources/admin/js/router/index.ts` (handles `/admin`, `/admin/users`, `/admin/leagues`, `/admin/settings`)

### Vite Configuration

Vite is configured with **dual entry points** for both dashboards:

```typescript
// vite.config.ts
input: [
    'resources/user/css/app.css',
    'resources/user/js/app.ts',
    'resources/admin/css/app.css',
    'resources/admin/js/app.ts',
]
```

When running `npm run build`, Vite compiles both dashboards. HMR works for both simultaneously during development.

## Common Development Commands

### PHP/Laravel

```bash
composer test              # Run PHPUnit tests
composer phpstan           # Static analysis (level 8)
composer phpcs             # Check PSR-12 code style
composer phpcbf            # Auto-fix code style
composer lint              # Run phpstan + phpcs
./vendor/bin/pint          # Laravel Pint (alternative formatter)

# Artisan commands
php artisan migrate
php artisan make:model ModelName
php artisan make:controller Admin/ControllerName
php artisan make:migration create_table_name
php artisan queue:work
php artisan cache:clear
php artisan config:clear
```

### TypeScript/Vue

```bash
npm run dev                # Start Vite dev server
npm run build              # Build for production (runs vue-tsc then vite build)
npm run type-check         # TypeScript type checking only

# Testing
npm test                   # Run all tests (Vitest)
npm run test:user          # Test user dashboard only
npm run test:admin         # Test admin dashboard only
npm run test:ui            # Run tests with UI
npm run test:coverage      # Generate coverage report
npm run test:e2e           # Run Playwright e2e tests
npm run test:e2e:ui        # Run Playwright with UI

# Linting/Formatting
npm run lint               # Lint all (ESLint)
npm run lint:fix           # Fix all linting issues
npm run lint:user          # Lint user dashboard only
npm run lint:admin         # Lint admin dashboard only
npm run format             # Format all (Prettier)
npm run format:user        # Format user dashboard only
npm run format:admin       # Format admin dashboard only
```

### Docker

```bash
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose restart            # Restart services
docker-compose logs -f            # View logs
docker-compose exec app bash     # Enter PHP container
docker-compose exec mariadb mysql -u laravel -psecret laravel  # Access MariaDB
docker-compose exec redis redis-cli                            # Access Redis CLI
```

## Technology Stack & Key Libraries

### Backend
- **Laravel 12** - PHP framework
- **spatie/laravel-data** - Type-safe DTOs
- **spatie/laravel-activitylog** - User activity tracking
- **PHPUnit** - Testing
- **PHPStan** (Level 8) - Static analysis
- **PHP_CodeSniffer** (PSR-12) - Code style

### Frontend
- **Vue 3** with Composition API (`<script setup lang="ts">`)
- **TypeScript** (strict mode)
- **Vite 7** - Build tool
- **Vue Router 4** - Client-side routing
- **Pinia 3** - State management
- **PrimeVue 4** - UI components (Aura theme preset)
- **Tailwind CSS 4** - Utility-first CSS
- **VueUse** - Composition utilities
- **Phosphor Icons** - Icon system
- **Vitest** - Unit testing
- **Playwright** - E2E testing

### Infrastructure (Docker)
- **Nginx** - Web server (port 8000)
- **PHP-FPM 8.2+** - PHP runtime (with Node.js 22.x)
- **MariaDB 10.11** - Database (port 3307 on host)
- **Redis 7** - Cache and queues (port 6379)
- **Elasticsearch 8.11** - Search (ports 9200, 9300)
- **Mailpit** - Email testing (web UI: 8025, SMTP: 1025)

## Code Quality Standards

- **PHP**: PSR-12 coding standard, PHPStan level 8
- **TypeScript**: Strict mode enabled
- **Vue**: Composition API with `<script setup lang="ts">`
- **Testing**: Write tests for all new features (PHPUnit for backend, Vitest for frontend)
- **Formatting**: Prettier for JS/TS/Vue, PHP_CodeSniffer/Pint for PHP
- **Backend Architecture**: Follow DDD principles (see backend guides above)

## PrimeVue Components

PrimeVue is pre-configured in both dashboards with the **Aura theme preset**. See `.claude/guides/primevue-usage.md` for detailed usage examples.

**Common components:**
- Forms: `InputText`, `Dropdown`, `Calendar`, `Checkbox`, `InputSwitch`
- Data: `DataTable`, `DataView`, `Timeline`
- Overlays: `Dialog`, `Sidebar`, `Toast`, `ConfirmDialog`
- Navigation: `Menu`, `Menubar`, `Breadcrumb`, `TabView`
- Buttons: `Button`, `SplitButton`, `SpeedDial`

**Import pattern:**
```typescript
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
```

## Working with Tests

### Adding Frontend Tests

Create tests alongside the code they test:

```typescript
// resources/user/js/components/MyComponent.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MyComponent from './MyComponent.vue';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent);
    expect(wrapper.text()).toContain('Expected text');
  });
});
```

### Adding Backend Tests

```php
// tests/Feature/ExampleTest.php
namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_example(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
    }
}
```

## Database Access

```bash
# MariaDB
mysql -u laravel -psecret laravel

# Redis
redis-cli
```

## Environment Configuration

Key environment variables in `.env`:
```env
APP_NAME=YOUR_APP_NAME
APP_URL=http://YOUR_DOMAIN.localhost:8000

DB_CONNECTION=mysql
DB_HOST=mariadb
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=laravel
DB_PASSWORD=secret

REDIS_HOST=redis

ELASTICSEARCH_HOST=elasticsearch
ELASTICSEARCH_PORT=9200

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
```

## Adding New Features

### Adding a New User Dashboard View

1. Create view: `resources/user/js/views/MyView.vue`
2. Add route: `resources/user/js/router/index.ts`
3. Import using `@user/views/MyView.vue`
4. Add tests: `resources/user/js/views/MyView.test.ts`

### Adding a New Admin Dashboard View

**IMPORTANT**: Follow the established patterns! See [Admin Dashboard Development Guide](./.claude/guides/frontend/admin-dashboard-development-guide.md) for detailed step-by-step workflow.

**Quick workflow**:

1. Create view: `resources/admin/js/views/MyView.vue`
2. Add route: `resources/admin/js/router/index.ts`
3. Import using `@admin/views/MyView.vue`
4. Add tests: `resources/admin/js/views/MyView.test.ts`

### Adding Backend API Endpoints

**IMPORTANT**: Follow DDD architecture! See the backend guides above for detailed step-by-step workflows:
- [Admin Backend Guide](./.claude/guides/backend/admin-backend-guide.md) for admin features
- [User Backend Guide](./.claude/guides/backend/user-backend-guide.md) for user features

**Quick workflow**:

1. **Domain Layer**: Create entity, value objects, domain events, exceptions
2. **Application Layer**: Create DTOs, add method to application service
3. **Infrastructure Layer**: Update Eloquent model, repository implementation
4. **Interface Layer**: Create thin controller (3-5 lines per method)
5. Add route in `routes/api.php` under `/api/admin` prefix
6. Protect with middleware: `['auth:admin', 'admin.authenticate']`
7. Add tests: Unit tests for entities, feature tests for endpoints

**Example controller pattern (thin)**:
```php
public function store(CreateUserData $data): JsonResponse
{
    try {
        $userData = $this->userService->createUser($data);
        return ApiResponse::created($userData->toArray());
    } catch (UserAlreadyExistsException $e) {
        return ApiResponse::error($e->getMessage(), null, 422);
    }
}
```

## Important Notes

- **Never commit `.env`** - It contains secrets
- **Run tests before committing** - `npm test && composer test`
- **Type check TypeScript** - `npm run type-check` before building
- **Use path aliases** - Import with `@user/` or `@admin/`, not relative paths
- **Separate concerns** - Keep user and admin code completely separate
- **HMR configuration** - Check `vite.config.ts` line 45 for the correct HMR host (should match your `.env` domain)

## Additional Documentation

### Backend Development
- **[.claude/guides/backend/ddd-overview.md](./.claude/guides/backend/ddd-overview.md)** - **START HERE**: DDD architecture overview
- **[.claude/guides/backend/admin-backend-guide.md](./.claude/guides/backend/admin-backend-guide.md)** - **ADMIN FEATURES**: Complete admin backend development guide
- **[.claude/guides/backend/user-backend-guide.md](./.claude/guides/backend/user-backend-guide.md)** - **USER FEATURES**: Complete user backend development guide (for future development)

### Frontend Development
- **[.claude/guides/frontend/admin-dashboard-development-guide.md](./.claude/guides/frontend/admin-dashboard-development-guide.md)** - **MUST READ**: Complete admin dashboard development guide (components, composables, services, testing)
- **[.claude/guides/frontend/admin-styling-guide.md](./.claude/guides/frontend/admin-styling-guide.md)** - **STYLING & DESIGN**: Complete styling and design system guide (typography, colors, spacing, layouts, PrimeVue, accessibility)

### Other Guides
- `.claude/guides/primevue-usage.md` - PrimeVue components and examples
- `.claude/guides/docker_reference_guide.md` - Docker setup details
- `.claude/guides/admin/admin-authentication.md` - Admin authentication implementation
- `README.md` - Comprehensive setup guide

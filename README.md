# Laravel + Vue 3 Multi-Application Template

A Laravel 12 application with **three separate Vue.js SPAs** across different subdomains:
- **Public Site** (`virtualracingleagues.localhost`) - Marketing, auth (login/register)
- **User Dashboard** (`app.virtualracingleagues.localhost`) - Authenticated user dashboard
- **Admin Dashboard** (`admin.virtualracingleagues.localhost`) - Admin management interface

Each application is completely independent with its own routing, state management, components, and tests.

## Architecture

**Multi-Subdomain Architecture:**
```
resources/
├── public/      # Public Site (virtualracingleagues.localhost)
│   ├── js/      # Auth flows, marketing
│   └── css/
├── user/        # User Dashboard (app.virtualracingleagues.localhost)
│   ├── js/      # User features (authenticated only)
│   └── css/
└── admin/       # Admin Dashboard (admin.virtualracingleagues.localhost)
    ├── js/      # Admin features
    └── css/
```

**Backend - Domain-Driven Design (DDD):**
```
app/
├── Domain/         # Business logic (entities, value objects, events)
├── Application/    # Use cases (services, DTOs)
├── Infrastructure/ # Persistence (Eloquent, repositories)
└── Http/           # Controllers (thin, 3-5 lines per method)
```

## Tech Stack

**Backend:** Laravel 12, MariaDB, Redis, Elasticsearch, Sanctum, Spatie packages
**Frontend:** Vue 3, TypeScript, Vite, Vue Router, Pinia, PrimeVue, Tailwind CSS
**Testing:** PHPUnit, Vitest, Playwright
**Infrastructure:** Docker (Nginx, PHP-FPM, MariaDB, Redis, Elasticsearch, Mailpit)

## Quick Setup

### 1. Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Update .env with your settings (or use defaults):
# - APP_NAME=VirtualRacingLeagues
# - APP_URL=http://virtualracingleagues.localhost
# - SESSION_DOMAIN=.virtualracingleagues.localhost
```

### 2. Hosts File

Add to `/etc/hosts`:
```
127.0.0.1 virtualracingleagues.localhost
127.0.0.1 app.virtualracingleagues.localhost
127.0.0.1 admin.virtualracingleagues.localhost
```

### 3. Docker Setup

```bash
# Start services
docker-compose up -d

# Enter container
docker-compose exec app bash

# Inside container:
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed    # Optional: creates default admin user
npm install
npm run build
exit
```

### 4. Access Applications

Start dev server:
```bash
# From host OR inside container
npm run dev
```

Then visit:
- **Public Site**: http://virtualracingleagues.localhost
- **User Dashboard**: http://app.virtualracingleagues.localhost
- **Admin Dashboard**: http://admin.virtualracingleagues.localhost/admin

**Default Admin Login** (if seeded):
- Email: `admin@example.com`
- Password: `password`

## Development

### Common Commands

```bash
# Frontend
npm run dev              # Vite dev server (all 3 apps)
npm run build            # Build for production
npm run type-check       # TypeScript checking
npm test                 # All tests
npm run test:user        # User dashboard tests only
npm run test:admin       # Admin dashboard tests only
npm run lint             # ESLint all
npm run format           # Prettier all

# Backend
composer test            # PHPUnit tests
composer phpstan         # Static analysis (level 8)
composer lint            # PHPStan + PHPCS
php artisan migrate      # Run migrations
php artisan db:seed      # Run seeders

# Docker
docker-compose exec app bash                              # Enter container
docker-compose exec mariadb mysql -u laravel -psecret laravel  # MariaDB
docker-compose exec redis redis-cli                       # Redis
docker-compose logs -f                                    # View logs
```

## Project Structure

```
resources/
├── public/js/          # Public Site
│   ├── app.ts          # Entry point
│   ├── router/         # Routes (/login, /register, etc.)
│   ├── views/          # Login, Register, ForgotPassword
│   ├── stores/         # Auth store
│   └── services/       # API services
├── user/js/            # User Dashboard (authenticated)
│   ├── app.ts
│   ├── router/         # Routes (/, /profile)
│   ├── views/          # HomeView, ProfileView
│   ├── stores/         # User store
│   └── __tests__/      # Tests
└── admin/js/           # Admin Dashboard
    ├── app.ts
    ├── router/         # Routes (/admin, /admin/users, etc.)
    ├── views/          # Dashboard, Users, Settings
    ├── components/     # Tables, modals, forms
    ├── stores/         # Admin, user, layout stores
    └── __tests__/      # Tests

app/
├── Domain/             # Business logic (pure PHP)
│   ├── User/           # User context
│   ├── Admin/          # Admin context
│   └── Shared/         # Shared value objects
├── Application/        # Use cases, DTOs
├── Infrastructure/     # Eloquent models, repositories
└── Http/
    └── Controllers/    # Thin controllers
```

## Key Features

**Authentication:**
- Public site handles login/register/password reset
- Session shared across subdomains via `SESSION_DOMAIN=.virtualracingleagues.localhost`
- Separate guards: `web` (users), `admin` (admins)
- User dashboard is authenticated-only

**Admin Features:**
- User management (CRUD, impersonation)
- Admin user management (CRUD, role management)
- Site configuration (identity, email, tracking)
- Activity logs with filtering and search
- Role-based permissions (super admin, admin)

**Activity Logging:**
- Tracks all admin and user actions
- Filterable by causer, subject, event, date range
- Detailed event properties and changes

## Adding Features

### Frontend Development

**Public Site:**
```bash
# Create view
touch resources/public/js/views/MyView.vue
# Add route in resources/public/js/router/index.ts
# Import with @public/views/MyView.vue
```

**User Dashboard:**
```bash
# Create view
touch resources/app/js/views/MyView.vue
# Add route with requiresAuth: true
# Import with @app/views/MyView.vue
```

**Admin Dashboard:**
See [Admin Dashboard Development Guide](./.claude/guides/frontend/admin-dashboard-development-guide.md)

### Backend Development

**Admin Features:**
See [Admin Backend Guide](./.claude/guides/backend/admin-backend-guide.md)

**User Features:**
See [User Backend Guide](./.claude/guides/backend/user-backend-guide.md)

**DDD Architecture:**
See [DDD Overview](./.claude/guides/backend/ddd-overview.md)

## Documentation

### Backend
- [DDD Architecture Overview](./.claude/guides/backend/ddd-overview.md) - Core architecture principles
- [Admin Backend Guide](./.claude/guides/backend/admin-backend-guide.md) - Admin feature development
- [User Backend Guide](./.claude/guides/backend/user-backend-guide.md) - User feature development

### Frontend
- [Admin Dashboard Development Guide](./.claude/guides/frontend/admin-dashboard-development-guide.md) - Components, composables, services, testing
- [Admin Styling Guide](./.claude/guides/frontend/admin-styling-guide.md) - Design system, typography, colors, PrimeVue
- [Admin Authentication Guide](./.claude/guides/frontend/admin-authentication-guide.md) - Auth implementation details

### Other
- [PrimeVue Usage Guide](./.claude/guides/primevue-usage.md) - PrimeVue components and patterns
- [Docker Reference](./.claude/guides/docker/docker_reference_guide.md) - Docker setup details
- [Activity Logs Documentation](./docs/activity-logs/ACTIVITY_LOG_DOCUMENTATION.md) - Activity logging system
- [CLAUDE.md](./CLAUDE.md) - Comprehensive development guide

## Code Quality

- **PHP:** PSR-12, PHPStan level 8
- **TypeScript:** Strict mode
- **Vue:** Composition API with `<script setup lang="ts">`
- **Testing:** Required for new features
- **Path aliases:** `@public`, `@user`, `@admin`

## Important Notes

- All routes defined in `routes/subdomain.php` (NOT `routes/web.php`)
- Session sharing requires `SESSION_DOMAIN=.virtualracingleagues.localhost` (leading dot)
- Each dashboard is independent - no shared components
- Controllers must be thin (3-5 lines) - logic goes in application services
- Domain layer is pure PHP (no Laravel dependencies)

## Services

- **Nginx:** http://localhost
- **MariaDB:** localhost:3307 (user: `laravel`, pass: `secret`, db: `laravel`)
- **Redis:** localhost:6379
- **Elasticsearch:** http://localhost:9200
- **Mailpit:** http://localhost:8025 (email testing UI)

## License

[Your License Here]

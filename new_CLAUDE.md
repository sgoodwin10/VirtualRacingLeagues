# CLAUDE.md

## Project Overview

**Virtual Racing Leagues** - A sim racing league management platform built with Laravel 12 + Vue 3. League organizers manage competitions, seasons, rounds, races, drivers, and teams with full championship standings and points calculations.

### Domain Model
```
League → Competition → Season → Round → Race → RaceResult
                         ↓
                    SeasonDriver ← LeagueDriver ← Driver
                         ↓
                       Team
```

### Multi-Application Architecture

Three separate Vue.js SPAs on different subdomains sharing Laravel backend and session:

| Subdomain | Purpose | Path Alias |
|-----------|---------|------------|
| `virtualracingleagues.localhost` | Public site (auth, marketing) | `@public` |
| `app.virtualracingleagues.localhost` | User dashboard (authenticated) | `@app` |
| `admin.virtualracingleagues.localhost` | Admin dashboard | `@admin` |

```
resources/
├── public/js/   # Public site
├── app/js/      # User dashboard
└── admin/js/    # Admin dashboard
```

## Development

```bash
docker-compose up -d    # Start services
npm run dev             # Vite dev server
composer dev            # All services (Laravel, queue, Vite)
```

## Commands

### Backend
```bash
composer test           # PHPUnit tests
composer phpstan        # Static analysis (level 8)
composer lint           # phpstan + phpcs
php artisan migrate
```

### Frontend
```bash
npm run build           # Production build
npm run type-check      # TypeScript check
npm test                # All Vitest tests
npm run test:app        # App dashboard tests
npm run test:admin      # Admin dashboard tests
npm run lint:fix        # Fix ESLint issues
```

## Architecture

### Backend (DDD)
```
app/
├── Domain/          # Entities, Value Objects, Events (pure PHP)
├── Application/     # DTOs, Application Services
├── Infrastructure/  # Eloquent models, Repositories
└── Http/            # Thin controllers (3-5 lines/method)
```

**Key rules:**
- Business logic in domain entities, not controllers
- Application services handle transactions and orchestration
- Return DTOs from services, not entities

### Frontend
- **Vue 3** Composition API with `<script setup lang="ts">`
- **PrimeVue 4** - UI components (use Context7 for docs)
- **Pinia** - State management
- **Tailwind CSS 4** - Styling

### Routing
All routes in `routes/subdomain.php`:
- Public API: No auth
- User API: `['auth:web', 'user.authenticate']`
- Admin API: `['auth:admin', 'admin.authenticate']`

## Tech Stack

**Backend:** Laravel 12, PHPStan (L8), PSR-12, spatie/laravel-data
**Frontend:** Vue 3, TypeScript, Vite 7, PrimeVue 4, Tailwind CSS 4
**Infrastructure:** Docker, Nginx, MariaDB, Redis, Elasticsearch

## Key Guidelines

- Use path aliases (`@app/`, `@admin/`, `@public/`) not relative imports
- Keep applications separate - no shared components between subdomains
- Run `npm test && composer test` before committing
- Use Context7 MCP for PrimeVue and library documentation
- Session sharing via `SESSION_DOMAIN=.virtualracingleagues.localhost`

## Guides

- `.claude/guides/backend/ddd-overview.md` - DDD architecture
- `.claude/guides/backend/admin-backend-guide.md` - Admin backend
- `.claude/guides/frontend/admin/admin-dashboard-development-guide.md` - Admin frontend

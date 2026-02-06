# Guide Overview

Quick reference for selecting the right guide based on development task.

---

## Guide Index

| Guide | Path | Use When |
|-------|------|----------|
| **DDD Overview** | `backend/ddd-overview.md` | Backend architecture, domain entities, value objects, application services, repositories |
| **Backend Testing** | `backend/testing-guide.md` | PHPUnit tests, test suites, factories, database testing |
| **Database Seeding** | `database/seeding-guide.md` | Migrations, seeders, database reset, backup data |
| **Docker Reference** | `docker/docker_reference_guide.md` | Container management, environment setup, Playwright E2E |
| **Frontend Testing** | `frontend/testing-guide.md` | Vitest, Vue component tests, MSW mocking, coverage |
| **Admin Directory** | `frontend/admin/admin-directory-guide.md` | Admin dashboard file structure, imports |
| **Admin Styling** | `frontend/admin/admin-style-guide.md` | Admin CSS variables, PrimeVue components, layouts |
| **App Directory** | `frontend/app/app-directory-guide.md` | User dashboard file structure, imports |
| **App Styling** | `frontend/app/app-style-guide.md` | Blueprint theme, dark mode, form patterns |
| **Public Directory** | `frontend/public/public-directory-guide.md` | Public site file structure, VRL components |
| **Public Styling** | `frontend/public/public-style-guide.md` | VRL Velocity design system, landing pages |

---

## Decision Tree

```
What are you building?

├── Backend (Laravel/PHP)
│   ├── New domain entity, value object, or business logic
│   │   └── READ: backend/ddd-overview.md
│   ├── API endpoint or controller
│   │   └── READ: backend/ddd-overview.md (thin controllers, DTOs)
│   ├── PHPUnit tests
│   │   └── READ: backend/testing-guide.md
│   └── Database migrations or seeders
│       └── READ: database/seeding-guide.md
│
├── Frontend (Vue/TypeScript)
│   ├── Admin Dashboard (admin.*.localhost)
│   │   ├── File locations, imports → frontend/admin/admin-directory-guide.md
│   │   └── Styling, components → frontend/admin/admin-style-guide.md
│   │
│   ├── User Dashboard (app.*.localhost)
│   │   ├── File locations, imports → frontend/app/app-directory-guide.md
│   │   └── Styling, components → frontend/app/app-style-guide.md
│   │
│   ├── Public Site (*.localhost)
│   │   ├── File locations, imports → frontend/public/public-directory-guide.md
│   │   └── Styling, components → frontend/public/public-style-guide.md
│   │
│   └── Vitest tests (any dashboard)
│       └── READ: frontend/testing-guide.md
│
├── Infrastructure
│   ├── Docker, containers, environment
│   │   └── READ: docker/docker_reference_guide.md
│   └── Playwright E2E tests
│       └── READ: docker/docker_reference_guide.md (Playwright section)
│
└── Database
    └── READ: database/seeding-guide.md
```

---

## Agent Reference

| Agent | Use For | Primary Guides |
|-------|---------|----------------|
| `dev-be` | Backend Laravel/PHP development | `backend/ddd-overview.md`, `backend/testing-guide.md` |
| `dev-fe-admin` | Admin dashboard Vue development | `frontend/admin/*.md`, `frontend/testing-guide.md` |
| `dev-fe-app` | User dashboard Vue development | `frontend/app/*.md`, `frontend/testing-guide.md` |
| `dev-fe-public` | Public site Vue development | `frontend/public/*.md`, `frontend/testing-guide.md` |
| `dev-pw` | Playwright E2E tests | `docker/docker_reference_guide.md` |
| `dev-plan` | Architecture planning | `backend/ddd-overview.md` |

---

## Quick Reference by Task

### Backend Tasks

| Task | Guide Section |
|------|---------------|
| Create domain entity | `ddd-overview.md` → Pattern 1: Rich Domain Entities |
| Create value object | `ddd-overview.md` → Pattern 2: Immutable Value Objects |
| Create enum | `ddd-overview.md` → Pattern 3: Enum-Based Value Objects |
| Create application service | `ddd-overview.md` → Pattern 4: Application Service Orchestration |
| Create repository | `ddd-overview.md` → Pattern 5: Repository with Entity Mapping |
| Create controller | `ddd-overview.md` → Pattern 6: Thin Controllers |
| Create DTO | `ddd-overview.md` → Pattern 7: DTOs with Spatie Laravel Data |
| Write PHPUnit test | `testing-guide.md` → Test Suites |
| Reset database | `seeding-guide.md` → Resetting the Database |

### Frontend Tasks

| Task | Guide Section |
|------|---------------|
| Create Vue component | `{dashboard}-directory-guide.md` → components/ |
| Create Pinia store | `{dashboard}-directory-guide.md` → stores/ |
| Create composable | `{dashboard}-directory-guide.md` → composables/ |
| Create API service | `{dashboard}-directory-guide.md` → services/ |
| Style component | `{dashboard}-style-guide.md` → Color Palette, Components |
| Write Vitest test | `testing-guide.md` → Testing Patterns |
| Mock API calls | `testing-guide.md` → API Mocking with MSW |

### Infrastructure Tasks

| Task | Guide Section |
|------|---------------|
| Start Docker | `docker_reference_guide.md` → Container Management |
| Access database | `docker_reference_guide.md` → Database Access |
| Run E2E tests | `docker_reference_guide.md` → Playwright E2E Testing |
| Debug containers | `docker_reference_guide.md` → Troubleshooting |

---

## Import Aliases

```typescript
@admin  → resources/admin/js/    // Admin dashboard
@app    → resources/app/js/      // User dashboard
@public → resources/public/js/   // Public site
```

---

## Key Architectural Concepts

1. **Three Separate Vue Apps**: Public, App, Admin - no shared code between them
2. **DDD Backend**: Domain → Application → Infrastructure → Interface layers
3. **Subdomain Routing**: All routes in `routes/subdomain.php`
4. **Session Sharing**: Cross-subdomain via `SESSION_DOMAIN=.virtualracingleagues.localhost`
5. **Thin Controllers**: 3-5 lines per method, delegate to application services
6. **DTOs Everywhere**: Input validation and output transformation via Spatie Data

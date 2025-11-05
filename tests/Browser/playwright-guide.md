# Playwright E2E Testing Guide

This guide covers end-to-end testing with Playwright in this Laravel + Vue 3 multi-application project running in Docker.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Running Tests](#running-tests)
- [Creating New Tests](#creating-new-tests)
- [Architecture Details](#architecture-details)
- [Troubleshooting](#troubleshooting)

## Overview

This project uses Playwright for E2E testing across three separate Single Page Applications (SPAs):

1. **Public Site** (`virtualracingleagues.localhost`) - Unauthenticated marketing and auth flows
2. **User Dashboard** (`app.virtualracingleagues.localhost`) - Authenticated user features
3. **Admin Dashboard** (`admin.virtualracingleagues.localhost`) - Admin-only features

All tests run inside the Docker container using **Chromium only** (Firefox and WebKit are not installed to reduce image size and complexity).

## Prerequisites

### Required Services

Before running tests, ensure these services are running:

```bash
# Start Docker services
docker-compose up -d

# Start Vite dev server (REQUIRED for assets)
npm run dev
```

**Important**: The Vite dev server must be running for tests to work properly, as it compiles frontend assets.

### Docker Environment

Tests run inside the Docker container where:
- Playwright Chromium is pre-installed
- `/etc/hosts` is automatically configured with subdomain mappings
- Port 80 is used for internal Docker network communication
- Session cookies are shared via `SESSION_DOMAIN=.virtualracingleagues.localhost`

### Automatic /etc/hosts Configuration

The Docker entrypoint script (`docker/app/docker-entrypoint.sh`) automatically configures `/etc/hosts` on container startup:

```bash
# Automatically added by docker-entrypoint.sh
172.19.0.7 virtualracingleagues.localhost
172.19.0.7 app.virtualracingleagues.localhost
172.19.0.7 admin.virtualracingleagues.localhost
```

This maps all subdomains to the nginx container IP, enabling Playwright to resolve subdomain URLs correctly.

**Why this is needed**: Docker containers have isolated networking. Without `/etc/hosts` entries, subdomain URLs would fail to resolve inside the container where Playwright runs.

### Chromium-Only Setup

This project is configured to use **Chromium only**:

- **Installed**: Chromium browser (`npx playwright install chromium`)
- **Not Installed**: Firefox, WebKit (removed to reduce Docker image size)
- **Benefit**: Faster builds, smaller images, simpler configuration

If you need cross-browser testing in the future, you can install additional browsers:

```bash
npx playwright install firefox webkit
```

## Environment Setup

### Environment Variables

Tests use these environment variables (configured in `playwright.config.ts`):

```bash
TEST_DOMAIN=virtualracingleagues.localhost  # Base domain
TEST_PORT=80                                 # Port 80 for Docker, 8000 for host
```

**Inside Docker** (default): Uses port `80` to communicate with nginx container
**From Host Machine**: Set `TEST_PORT=8000` if running tests outside Docker

### Verifying Setup

Check that your environment is configured correctly:

```bash
# 1. Verify /etc/hosts entries
cat /etc/hosts | grep virtualracingleagues

# Expected output:
# 172.19.0.X virtualracingleagues.localhost
# 172.19.0.X app.virtualracingleagues.localhost
# 172.19.0.X admin.virtualracingleagues.localhost

# 2. Test nginx connectivity
curl -I http://admin.virtualracingleagues.localhost/login

# Expected output:
# HTTP/1.1 200 OK

# 3. Verify Vite dev server is running
ps aux | grep vite

# Expected output:
# laravel ... node ... vite
```

## Running Tests

### Basic Commands

```bash
# Run all tests (headless Chromium)
npm run test:e2e

# Or directly with npx
npx playwright test

# Run specific test file
npx playwright test tests/Browser/admin/auth/admin-login-basic.spec.ts

# Run tests by application
npm run test:e2e:public      # Public site tests only
npm run test:e2e:admin       # Admin dashboard tests only
npm run test:e2e:app         # User dashboard tests only (when available)
```

### Interactive Modes

```bash
# Run with Playwright UI (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see browser window)
npm run test:e2e:headed

# Run with --debug flag (opens inspector)
npx playwright test --debug
```

### View Test Reports

```bash
# Open HTML test report
npm run test:e2e:report
```

### Test Structure

```
tests/Browser/
├── admin/                      # Admin dashboard tests
│   ├── auth/
│   │   ├── admin-login.spec.ts
│   │   └── admin-login-basic.spec.ts
│   └── helpers/
│       └── admin-auth.helper.ts
├── public/                     # Public site tests
│   ├── auth/
│   │   └── login.spec.ts
│   └── helpers/
│       └── public-auth.helper.ts
├── app/                        # User dashboard tests (future)
└── utils/                      # Shared utilities
    ├── test-config.ts          # URLs and credentials
    └── navigation.helper.ts    # Navigation helpers
```

## Creating New Tests

### File Naming Convention

- Use `*.spec.ts` extension for test files
- Use descriptive names: `feature-name.spec.ts`
- Place in appropriate directory: `admin/`, `public/`, or `app/`

Example:
```
tests/Browser/admin/users/user-management.spec.ts
tests/Browser/public/auth/password-reset.spec.ts
```

### Basic Test Template

```typescript
/**
 * Feature Description
 *
 * Brief description of what this test suite covers.
 */

import { test, expect } from '@playwright/test';
import { TEST_URLS } from '../../utils/test-config';

test.describe('Feature Name', () => {
  test('should perform expected behavior', async ({ page }) => {
    // Arrange: Navigate to page
    await page.goto(TEST_URLS.admin.users);

    // Act: Perform actions
    await page.click('button[data-testid="create-user"]');

    // Assert: Verify outcome
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });
});
```

### Using Test Configuration Helpers

Always use `TEST_URLS` and `TEST_CREDENTIALS` from `test-config.ts`:

```typescript
import { TEST_URLS, TEST_CREDENTIALS } from '../../utils/test-config';

// Navigate using predefined URLs
await page.goto(TEST_URLS.admin.login);
await page.goto(TEST_URLS.public.register);
await page.goto(TEST_URLS.user.profile);

// Use predefined credentials
await page.fill('input[type="email"]', TEST_CREDENTIALS.admin.email);
await page.fill('input[type="password"]', TEST_CREDENTIALS.admin.password);
```

**Available URLs**:
```typescript
TEST_URLS.public.home
TEST_URLS.public.login
TEST_URLS.public.register
TEST_URLS.public.forgotPassword

TEST_URLS.user.home
TEST_URLS.user.profile
TEST_URLS.user.dashboard

TEST_URLS.admin.home
TEST_URLS.admin.login
TEST_URLS.admin.dashboard
TEST_URLS.admin.users
TEST_URLS.admin.adminUsers
TEST_URLS.admin.settings
```

**Available Credentials**:
```typescript
TEST_CREDENTIALS.user          // Regular user
TEST_CREDENTIALS.admin         // Admin user
TEST_CREDENTIALS.superAdmin    // Super admin
TEST_CREDENTIALS.moderator     // Moderator
TEST_CREDENTIALS.invalidUser   // For negative tests
```

### Using Authentication Helpers

For tests requiring authentication, use the helper functions:

#### Admin Authentication

```typescript
import { loginAsAdmin, loginAsSuperAdmin } from '../helpers/admin-auth.helper';

test.describe('Admin Users', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsAdmin(page);
  });

  test('should access admin dashboard', async ({ page }) => {
    // Already logged in via beforeEach
    await expect(page).toHaveURL(TEST_URLS.admin.dashboard);
  });
});

// Or login as different roles
await loginAsSuperAdmin(page);
await loginAsModerator(page);

// Login with remember me
await loginAsAdminWithRememberMe(page);

// Logout
await logoutAdmin(page);

// Clear session
await clearAdminSession(page);
```

#### Public Site Authentication

```typescript
import { loginAsUser } from '../helpers/public-auth.helper';

test.beforeEach(async ({ page }) => {
  await loginAsUser(page);
});
```

### Using Navigation Helpers

```typescript
import { gotoAdmin, gotoPublic, gotoUser } from '../../utils/navigation.helper';

// Navigate with standard wait conditions
await gotoAdmin(page, TEST_URLS.admin.users);
await gotoPublic(page, TEST_URLS.public.login);
await gotoUser(page, TEST_URLS.user.profile);
```

### Best Practices

1. **Use data-testid attributes** for stable selectors:
   ```typescript
   await page.click('[data-testid="submit-button"]');
   ```

2. **Wait for explicit conditions**:
   ```typescript
   await page.waitForLoadState('networkidle');
   await page.waitForSelector('[data-loaded="true"]');
   await expect(page.locator('.toast')).toBeVisible();
   ```

3. **Test user workflows, not implementation**:
   ```typescript
   // Good: Test user behavior
   await page.click('text=Create User');
   await page.fill('input[name="email"]', 'test@example.com');
   await page.click('text=Save');
   await expect(page.locator('.success-message')).toBeVisible();

   // Bad: Test implementation details
   // Don't test Vue component internals, API payloads, etc.
   ```

4. **Keep tests independent**:
   ```typescript
   test.beforeEach(async ({ page }) => {
     // Set up fresh state for each test
     await clearAdminSession(page);
   });
   ```

5. **Use describe blocks** for grouping related tests:
   ```typescript
   test.describe('User Management', () => {
     test.describe('Create User', () => {
       test('should create user with valid data', async ({ page }) => {});
       test('should show validation errors', async ({ page }) => {});
     });
   });
   ```

6. **Handle asynchronous operations**:
   ```typescript
   // Wait for API response
   await page.waitForResponse(
     response => response.url().includes('/api/users') && response.status() === 200
   );

   // Wait for navigation
   await page.waitForURL(TEST_URLS.admin.users);
   ```

## Architecture Details

### Three Separate Applications

This project has three completely separate Vue.js applications:

- **Public Site**: `resources/public/js/` → `virtualracingleagues.localhost`
- **User Dashboard**: `resources/app/js/` → `app.virtualracingleagues.localhost`
- **Admin Dashboard**: `resources/admin/js/` → `admin.virtualracingleagues.localhost`

Each application has its own:
- Vue Router instance
- Pinia store
- Component library
- Test suite

### Subdomain Routing

**Backend (Laravel)**: All routes defined in `routes/subdomain.php`:

```php
// Public Site
Route::domain('virtualracingleagues.localhost')->group(function () {
    Route::get('/{any?}', fn() => view('public'));
});

// User Dashboard (authenticated)
Route::domain('app.virtualracingleagues.localhost')->group(function () {
    Route::middleware(['auth:web'])->group(function () {
        Route::get('/{any?}', fn() => view('app'));
    });
});

// Admin Dashboard
Route::domain('admin.virtualracingleagues.localhost')->group(function () {
    Route::middleware(['auth:admin'])->group(function () {
        Route::get('/{any?}', fn() => view('admin'));
    });
});
```

**Frontend (Vue Router)**: Each application has its own router:
- `resources/public/js/router/index.ts`
- `resources/app/js/router/index.ts`
- `resources/admin/js/router/index.ts`

### Session Sharing

Sessions are shared across subdomains via:

```env
SESSION_DOMAIN=.virtualracingleagues.localhost  # Leading dot enables sharing
SESSION_SAME_SITE=lax
```

This allows users to:
1. Login on public site
2. Automatically be authenticated on user dashboard
3. Admins login separately on admin subdomain

### Playwright Configuration

Key settings in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './tests/Browser',
  fullyParallel: true,
  use: {
    baseURL: 'http://virtualracingleagues.localhost:80',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            // Map subdomains to nginx container IP
            '--host-resolver-rules=MAP *.virtualracingleagues.localhost 172.19.0.7',
          ],
        },
      },
    },
  ],
});
```

**Important Configuration Details**:

- `--host-resolver-rules`: Bypasses Docker's internal DNS to resolve subdomains correctly
- `--no-sandbox`: Required for running Chromium in Docker
- `--disable-dev-shm-usage`: Overcomes limited shared memory in Docker
- Port `80`: Internal Docker network port (nginx listens on port 80 inside Docker)

### Helper Functions

**test-config.ts**: Centralized URLs and credentials

```typescript
// Build URLs dynamically based on environment
TEST_URLS.admin.login  // http://admin.virtualracingleagues.localhost:80/login
TEST_CREDENTIALS.admin // { email: 'admin@example.com', password: 'password' }
```

**navigation.helper.ts**: Navigation with standard wait conditions

```typescript
await gotoAdmin(page, url);  // Navigates and waits for 'load' event
```

**admin-auth.helper.ts**: Admin authentication flows

```typescript
await loginAsAdmin(page);              // Login as regular admin
await loginAsSuperAdmin(page);         // Login as super admin
await logoutAdmin(page);               // Logout
await verifyAdminSession(page);        // Check if authenticated
await clearAdminSession(page);         // Clear cookies/session
```

## Troubleshooting

### Tests Fail with "net::ERR_CONNECTION_REFUSED"

**Cause**: Vite dev server not running or nginx not accessible.

**Solution**:
```bash
# 1. Start Vite dev server
npm run dev

# 2. Verify nginx is running
docker-compose ps nginx

# 3. Test nginx connectivity
curl -I http://admin.virtualracingleagues.localhost/login
```

### Subdomain URLs Not Resolving

**Cause**: `/etc/hosts` not configured correctly.

**Solution**:
```bash
# 1. Check /etc/hosts entries
cat /etc/hosts | grep virtualracingleagues

# Expected: Lines like "172.19.0.X virtualracingleagues.localhost"

# 2. Restart container to re-run entrypoint script
docker-compose restart app

# 3. Verify nginx IP
docker-compose exec app getent hosts nginx
```

### Chromium Browser Not Found

**Cause**: Chromium not installed in Docker container.

**Solution**:
```bash
# Install Chromium (done automatically by docker-entrypoint.sh)
npx playwright install chromium --with-deps

# Or rebuild Docker image
docker-compose build app
```

### Tests Pass Locally But Fail in CI

**Cause**: Port or environment differences.

**Solution**:
```bash
# Set environment variables in CI
export TEST_PORT=80
export TEST_DOMAIN=virtualracingleagues.localhost

# Ensure Vite dev server is running in CI
npm run dev &
npx playwright test
```

### Vue App Not Loading / Page Blank

**Cause**: Assets not compiled or Vite not serving files.

**Solution**:
```bash
# 1. Verify Vite is running
ps aux | grep vite

# 2. Build assets if needed
npm run build

# 3. Check for JavaScript errors in test output
npx playwright test --headed  # Watch browser console
```

### Authentication Tests Failing

**Cause**: Session cookies not persisting or wrong credentials.

**Solution**:
```bash
# 1. Verify test credentials match database seeders
# Check: database/seeders/AdminSeeder.php

# 2. Verify SESSION_DOMAIN in .env
grep SESSION_DOMAIN .env
# Expected: SESSION_DOMAIN=.virtualracingleagues.localhost

# 3. Clear sessions
php artisan session:flush
```

### Port 80 vs Port 8000 Confusion

**Inside Docker Container**: Use port `80` (nginx listens on port 80 internally)
**From Host Machine**: Use port `8000` (mapped via docker-compose.yml)

```bash
# Inside Docker (tests run here by default)
curl http://admin.virtualracingleagues.localhost:80/login  # Works

# From Host Machine
curl http://admin.virtualracingleagues.localhost:8000/login  # Works
```

The `playwright.config.ts` is configured for Docker (port 80). If running tests from host, set:
```bash
export TEST_PORT=8000
```

### Checking Nginx IP Address

The nginx container IP may change when containers restart:

```bash
# Get current nginx IP
docker-compose exec app getent hosts nginx

# Expected output: 172.19.0.X nginx

# Update /etc/hosts if needed (automatically done by entrypoint)
docker-compose restart app
```

### Debugging Failed Tests

```bash
# 1. Run with debug mode (opens inspector)
npx playwright test --debug tests/Browser/admin/auth/admin-login-basic.spec.ts

# 2. Run in headed mode to watch browser
npm run test:e2e:headed

# 3. View screenshots of failures
# Located in: test-results/
ls -la test-results/

# 4. View HTML report with traces
npm run test:e2e:report
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `net::ERR_CONNECTION_REFUSED` | nginx not accessible | Check nginx container, verify /etc/hosts |
| `net::ERR_NAME_NOT_RESOLVED` | Subdomain not in /etc/hosts | Restart container, check entrypoint script |
| `TimeoutError: waiting for...` | Element not appearing | Check Vite dev server, increase timeout |
| `Executable doesn't exist` | Chromium not installed | Run `npx playwright install chromium` |
| `Session not found` | Cookies not persisting | Check SESSION_DOMAIN in .env |

---

## Additional Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Project Architecture Guide](/var/www/CLAUDE.md)
- [Admin Dashboard Development Guide](/var/www/.claude/guides/frontend/admin/admin-dashboard-development-guide.md)
- [Backend DDD Guide](/var/www/.claude/guides/backend/ddd-overview.md)

---

**Happy Testing!** If you encounter issues not covered here, check the Docker logs or consult the project documentation.

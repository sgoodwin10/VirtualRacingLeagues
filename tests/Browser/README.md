# Playwright E2E Tests

Comprehensive end-to-end testing for the Laravel + Vue multi-subdomain application.

## Running Tests

### From Host Machine (Recommended)

Playwright tests should be run **from your host machine** (not inside Docker) where subdomain URLs resolve properly:

```bash
# Make sure Docker services are running first
docker compose up -d

# Make sure /etc/hosts has subdomain entries (see Setup section below)

# Run all tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/Browser/admin/auth/admin-login.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

### Setup Requirements

1. **Docker services must be running:**
   ```bash
   docker compose up -d
   ```

2. **Add subdomain entries to `/etc/hosts`** (or `C:\Windows\System32\drivers\etc\hosts` on Windows):
   ```
   127.0.0.1 virtualracingleagues.localhost
   127.0.0.1 app.virtualracingleagues.localhost
   127.0.0.1 admin.virtualracingleagues.localhost
   ```

3. **Playwright browsers must be installed:**
   ```bash
   npx playwright install
   ```

> **Want to run tests inside Docker?** See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for multiple approaches to run Playwright tests inside containers, including CI/CD configurations.

## How It Works

### Subdomain Routing

Tests run from the host machine and use actual subdomain URLs:

1. Tests navigate to full subdomain URLs (e.g., `http://admin.virtualracingleagues.localhost/login`)
2. Your `/etc/hosts` resolves these to `127.0.0.1`
3. Docker forwards port 80 from host to nginx container
4. Nginx routes requests to Laravel based on subdomain (via `routes/subdomain.php`)
5. Laravel returns the appropriate Vue SPA based on the subdomain

### Navigation Helpers

Use the navigation helpers for consistent page navigation:

```typescript
import { gotoAdmin, gotoUser, gotoPublic } from '../utils/navigation.helper';

// Admin dashboard navigation
await gotoAdmin(page, TEST_URLS.admin.login);

// User dashboard navigation
await gotoUser(page, TEST_URLS.user.profile);

// Public site navigation
await gotoPublic(page, TEST_URLS.public.login);
```

These helpers provide consistent wait conditions and make tests more readable.

## Test Structure

```
tests/Browser/
├── admin/                    # Admin dashboard tests
│   ├── auth/                # Admin authentication tests
│   │   └── admin-login.spec.ts
│   └── helpers/             # Admin-specific test helpers
│       └── admin-auth.helper.ts
├── user/                     # User dashboard tests (future)
├── public/                   # Public site tests (future)
└── utils/                    # Shared utilities
    ├── test-config.ts       # Test configuration and URLs
    └── navigation.helper.ts # Navigation helpers
```

## Configuration Files

### `package.json`
- E2E test scripts run Playwright without special environment variables
- Example: `"test:e2e": "playwright test"`

### `playwright.config.ts`
- Sets base URL to `http://virtualracingleagues.localhost` (no port, uses 80)
- Configures test directory, timeouts, and browser projects
- No special Docker or subdomain logic needed

### `tests/Browser/utils/test-config.ts`
- Centralized URL configuration for all test scenarios
- Builds full subdomain URLs (e.g., `http://admin.virtualracingleagues.localhost/login`)
- Exports `TEST_URLS` object with predefined routes for all subdomains
- Exports `TEST_CREDENTIALS` for authentication
- Exports `TEST_TIMEOUTS` for common timeout values

### `tests/Browser/utils/navigation.helper.ts`
- Wrapper functions for `page.goto()` with consistent wait conditions
- Provides subdomain-specific helpers: `gotoAdmin()`, `gotoUser()`, `gotoPublic()`
- Uses standard Playwright navigation - no special header manipulation needed

## Troubleshooting

### Connection Refused Errors

If you see `ERR_CONNECTION_REFUSED`:

1. **Check Docker services are running:**
   ```bash
   docker compose ps
   ```

2. **Verify `/etc/hosts` has subdomain entries:**
   ```bash
   cat /etc/hosts | grep virtualracingleagues
   # Should show:
   # 127.0.0.1 virtualracingleagues.localhost
   # 127.0.0.1 app.virtualracingleagues.localhost
   # 127.0.0.1 admin.virtualracingleagues.localhost
   ```

3. **Ensure Playwright browsers are installed:**
   ```bash
   npx playwright install
   ```

4. **Test manually with curl from host:**
   ```bash
   curl -I http://admin.virtualracingleagues.localhost/login
   # Should return 200 OK
   ```

### "Route not found" or Wrong Subdomain

If you see an error like "Route not found. Please ensure you are accessing the correct subdomain":

1. **Check subdomain routing** - Verify Nginx config handles subdomains:
   ```bash
   cat docker/nginx/conf.d/default.conf
   # Should have: server_name *.virtualracingleagues.localhost virtualracingleagues.localhost;
   ```

2. **Check Laravel subdomain routes** - Verify `routes/subdomain.php` has correct domain definitions for all three subdomains

3. **Verify port mapping** - Ensure Docker is forwarding port 80:
   ```bash
   docker compose ps
   # nginx should show: 0.0.0.0:80->80/tcp
   ```

### Timeouts

If tests timeout waiting for page load:

1. Check if Vite dev server is running: `npm run dev`
2. Verify Laravel application is accessible from host:
   ```bash
   curl http://admin.virtualracingleagues.localhost/login
   # Should return HTML, not an error
   ```
3. Increase timeout if needed: `await page.waitForLoadState('networkidle', { timeout: 30000 });`

## Best Practices

1. **Always use navigation helpers** - Don't use `page.goto()` directly
2. **Clear session before tests** - Use `clearAdminSession()` in `beforeEach()`
3. **Wait for app mount** - Use `waitForAdminAppMount()` after navigation
4. **Use TEST_URLS constants** - Don't hardcode URLs
5. **Use TEST_CREDENTIALS constants** - Don't hardcode credentials
6. **Test in isolation** - Each test should be independent
7. **Clean up after tests** - Clear sessions, cookies, storage

## Examples

### Basic Admin Login Test

```typescript
import { test, expect } from '@playwright/test';
import { TEST_URLS, TEST_CREDENTIALS } from '../utils/test-config';
import { gotoAdmin } from '../utils/navigation.helper';
import { clearAdminSession } from '../admin/helpers/admin-auth.helper';

test.beforeEach(async ({ page }) => {
  await clearAdminSession(page);
});

test('should login successfully', async ({ page }) => {
  // Navigate to login page
  await gotoAdmin(page, TEST_URLS.admin.login);

  // Fill form
  await page.getByLabel('Email Address').fill(TEST_CREDENTIALS.admin.email);
  await page.getByLabel('Password').fill(TEST_CREDENTIALS.admin.password);

  // Submit
  await page.getByRole('button', { name: /sign in/i }).click();

  // Verify redirect
  await page.waitForURL(TEST_URLS.admin.dashboard, { timeout: 10000 });
  await expect(page).toHaveURL(TEST_URLS.admin.dashboard);
});
```

### Using Authentication Helper

```typescript
import { loginAsAdmin } from '../admin/helpers/admin-auth.helper';

test('should access protected page after login', async ({ page }) => {
  // Login using helper
  await loginAsAdmin(page);

  // Now navigate to protected page
  await gotoAdmin(page, TEST_URLS.admin.users);

  // Test protected page functionality
  await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
});
```

# Admin Dashboard E2E Tests

This directory contains all Playwright E2E tests for the **Admin Dashboard** (`admin.virtualracingleagues.localhost`).

## Directory Structure

```
tests/Browser/admin/
├── auth/                           # Authentication tests
│   └── admin-login.spec.ts        # Admin login flow tests
├── helpers/                        # Reusable test helpers
│   └── admin-auth.helper.ts       # Admin authentication utilities
└── README.md                       # This file
```

## Test Organization

Tests are organized by feature/domain:
- **`auth/`** - Authentication and authorization tests (login, logout, session management)
- **`helpers/`** - Reusable helper functions for admin tests

Future directories will include:
- **`users/`** - User management tests
- **`admin-users/`** - Admin user management tests
- **`site-config/`** - Site configuration tests
- **`activity-logs/`** - Activity log tests

## Running Admin Tests

### Run all admin tests
```bash
npm run test:e2e:admin
```

### Run specific test file
```bash
npx playwright test tests/Browser/admin/auth/admin-login.spec.ts
```

### Run tests with UI mode (recommended for development)
```bash
npx playwright test tests/Browser/admin/auth/admin-login.spec.ts --ui
```

### Run tests in headed mode (see browser)
```bash
npx playwright test tests/Browser/admin/auth/admin-login.spec.ts --headed
```

### Run tests in specific browser
```bash
npx playwright test tests/Browser/admin/auth/admin-login.spec.ts --project=chromium
npx playwright test tests/Browser/admin/auth/admin-login.spec.ts --project=firefox
npx playwright test tests/Browser/admin/auth/admin-login.spec.ts --project=webkit
```

### View test report
```bash
npm run test:e2e:report
```

## Test Credentials

Test credentials are defined in `tests/Browser/utils/test-config.ts`:

| Role         | Email                    | Password   |
|--------------|--------------------------|------------|
| Admin        | admin@example.com        | password   |
| Super Admin  | superadmin@example.com   | password   |
| Moderator    | moderator@example.com    | password   |

These accounts are seeded by `database/seeders/AdminSeeder.php` in local environments.

## Test URLs

Admin dashboard URLs are defined in `tests/Browser/utils/test-config.ts`:

```typescript
TEST_URLS.admin = {
  home: 'http://admin.virtualracingleagues.localhost:8000/admin/',
  login: 'http://admin.virtualracingleagues.localhost:8000/admin/login',
  dashboard: 'http://admin.virtualracingleagues.localhost:8000/admin/',
  users: 'http://admin.virtualracingleagues.localhost:8000/admin/users',
  adminUsers: 'http://admin.virtualracingleagues.localhost:8000/admin/admin-users',
  settings: 'http://admin.virtualracingleagues.localhost:8000/admin/settings',
  siteConfig: 'http://admin.virtualracingleagues.localhost:8000/admin/site-config',
  activityLogs: 'http://admin.virtualracingleagues.localhost:8000/admin/activity-logs',
}
```

## Using Auth Helpers

The `admin-auth.helper.ts` file provides reusable authentication functions:

### Login as different admin roles

```typescript
import { loginAsAdmin, loginAsSuperAdmin, loginAsModerator } from '../helpers/admin-auth.helper';

// Login as regular admin
await loginAsAdmin(page);

// Login as super admin
await loginAsSuperAdmin(page);

// Login as moderator
await loginAsModerator(page);

// Login with custom credentials
await loginAsAdmin(page, { email: 'custom@example.com', password: 'custompass' });
```

### Login with remember me

```typescript
import { loginAsAdminWithRememberMe } from '../helpers/admin-auth.helper';

await loginAsAdminWithRememberMe(page);
```

### Verify admin session

```typescript
import { verifyAdminSession } from '../helpers/admin-auth.helper';

const isAuthenticated = await verifyAdminSession(page);
expect(isAuthenticated).toBeTruthy();
```

### Clear admin session

```typescript
import { clearAdminSession } from '../helpers/admin-auth.helper';

// Clear session before or after tests
await clearAdminSession(page);
```

### Example test using helpers

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/admin-auth.helper';
import { TEST_URLS } from '../../utils/test-config';

test('admin can view users list', async ({ page }) => {
  // Login as admin
  await loginAsAdmin(page);

  // Navigate to users page
  await page.goto(TEST_URLS.admin.users);

  // Verify users list is visible
  await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
});
```

## Writing New Admin Tests

### 1. Create a new test file

Follow the naming convention: `feature-name.spec.ts`

```typescript
// tests/Browser/admin/users/user-management.spec.ts

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/admin-auth.helper';
import { TEST_URLS } from '../../utils/test-config';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display users list', async ({ page }) => {
    await page.goto(TEST_URLS.admin.users);
    // Your test assertions here
  });
});
```

### 2. Use descriptive test names

✅ Good:
```typescript
test('should display error message when creating user with duplicate email')
test('should successfully update user profile information')
test('should disable submit button while form is saving')
```

❌ Bad:
```typescript
test('test user creation')
test('update works')
test('error')
```

### 3. Follow the AAA pattern

```typescript
test('should create new admin user', async ({ page }) => {
  // Arrange: Setup test data and navigate
  await loginAsSuperAdmin(page);
  await page.goto(TEST_URLS.admin.adminUsers);

  // Act: Perform the action
  await page.getByRole('button', { name: /create admin/i }).click();
  await page.getByLabel('Email').fill('newadmin@example.com');
  await page.getByRole('button', { name: /save/i }).click();

  // Assert: Verify the outcome
  await expect(page.getByText(/admin created successfully/i)).toBeVisible();
});
```

### 4. Use Page Object Model (POM) for complex pages

For complex pages with many interactions, create page object models:

```typescript
// tests/Browser/admin/pages/UserListPage.ts
export class UserListPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(TEST_URLS.admin.users);
  }

  async searchUser(query: string) {
    await this.page.getByPlaceholder(/search/i).fill(query);
  }

  async clickCreateUser() {
    await this.page.getByRole('button', { name: /create user/i }).click();
  }
}
```

## Test Best Practices

### ✅ Do:
- Use `test.beforeEach()` for authentication setup
- Clear session before each test for isolation
- Use semantic locators (getByRole, getByLabel, getByText)
- Wait for navigation explicitly (`waitForURL`, `waitForSelector`)
- Test both happy paths and error cases
- Use descriptive test names
- Group related tests with `test.describe()`

### ❌ Don't:
- Hardcode URLs (use `TEST_URLS` from config)
- Hardcode credentials (use `TEST_CREDENTIALS` from config)
- Use fragile selectors (CSS classes, IDs that might change)
- Share state between tests
- Make tests depend on execution order
- Skip test cleanup (clear sessions, reset state)

## Debugging Tests

### Run with headed browser
```bash
npx playwright test tests/Browser/admin/auth/admin-login.spec.ts --headed
```

### Run with debug mode
```bash
npx playwright test tests/Browser/admin/auth/admin-login.spec.ts --debug
```

### Take screenshots on failure
Screenshots are automatically captured on failure. View them in the test report:
```bash
npm run test:e2e:report
```

### View trace files
Traces are captured on first retry. View them at:
```bash
npx playwright show-trace trace.zip
```

## CI/CD Integration

Tests run automatically in CI with:
- Retries: 2 attempts on failure
- Parallel execution: Disabled (to avoid race conditions)
- Screenshots: On failure
- Traces: On first retry

## Environment Variables

Configure test environment in `.env`:

```env
TEST_DOMAIN=virtualracingleagues.localhost
TEST_PORT=8000
```

## Database Seeding

Before running tests, ensure the database is seeded:

```bash
php artisan migrate:fresh --seed
```

This creates test admin accounts via `AdminSeeder`.

## Troubleshooting

### Test fails with "Page not found"
- Ensure dev server is running: `npm run dev`
- Check `TEST_DOMAIN` and `TEST_PORT` in config

### Admin not logged in
- Verify credentials match `AdminSeeder`
- Check session cookies are being set
- Clear browser context before test

### Timeout errors
- Increase timeout in `test-config.ts`
- Check network tab in headed mode
- Verify API endpoints are responding

## Contributing

When adding new admin tests:
1. Create tests in appropriate subdirectory (`auth/`, `users/`, etc.)
2. Use auth helpers from `helpers/admin-auth.helper.ts`
3. Follow naming conventions and best practices
4. Add documentation for new helpers/utilities
5. Update this README if adding new test categories

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)

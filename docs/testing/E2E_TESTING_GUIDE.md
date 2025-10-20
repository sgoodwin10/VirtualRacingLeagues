# Playwright E2E Testing Guide

This guide covers end-to-end (E2E) testing with Playwright for the three-subdomain Vue.js + Laravel application.

## What is E2E Testing?

End-to-end tests validate complete user workflows across the entire application stack:
- Real browser interactions
- Full frontend (Vue.js) + backend (Laravel) integration
- Actual HTTP requests (no mocking)
- Database persistence
- Cross-page navigation flows

**When to use E2E tests**:
- Critical user journeys (login → dashboard → action)
- Multi-step workflows (registration → email verification → profile setup)
- Cross-subdomain flows (login on public site → redirect to user dashboard)
- Payment processing, file uploads, complex forms

**When NOT to use E2E tests**:
- Unit-level component behavior (use Vitest instead)
- Business logic validation (use PHPUnit backend tests)
- Fast iteration during development (E2E tests are slower)

## Application Architecture

This project has **three separate subdomains**:

```
1. Public Site:        http://virtualracingleagues.localhost:8000
   - Login, Register, Home, Password Reset
   - Unauthenticated users

2. User Dashboard:     http://app.virtualracingleagues.localhost:8000
   - User profile, settings
   - Authenticated users only (redirects to public if not logged in)

3. Admin Dashboard:    http://admin.virtualracingleagues.localhost:8000/admin
   - Admin panel, user management
   - Admin users only
```

E2E tests should validate flows **across these subdomains** (e.g., login on public site → redirect to user dashboard).

## Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (visual test runner)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/Browser/login.spec.ts

# Run tests matching pattern
npx playwright test --grep "user login"

# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Debug mode (step through tests)
npx playwright test --debug

# View HTML report
npm run test:e2e:report
```

## Test Configuration

**File**: `playwright.config.ts`

Key settings:
- **Test directory**: `./tests/Browser/`
- **Base URL**: `http://virtualracingleagues.localhost:8000`
- **Parallel execution**: Enabled (faster)
- **Retries**: 0 locally, 2 on CI (for flaky test detection)
- **Workers**: Auto-detected locally, 1 on CI
- **Screenshots**: On failure only
- **Traces**: On first retry (for debugging)
- **Browsers**: Chromium, Firefox, WebKit

**Web Server**:
- Automatically starts Laravel server before tests
- Command: `php artisan serve --host=virtualracingleagues.localhost --port=8000`
- Reuses existing server locally (faster)
- 120-second startup timeout

## Basic Test Structure

### Example Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Login', () => {
  test('user can login with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill form
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password');

    // Submit
    await page.getByRole('button', { name: /login/i }).click();

    // Assert: Redirected to user dashboard
    await expect(page).toHaveURL('http://app.virtualracingleagues.localhost:8000/');

    // Assert: User is logged in
    await expect(page.getByText(/welcome back/i)).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /login/i }).click();

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);

    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });
});
```

## Locator Strategies

Playwright provides several ways to locate elements. Use them in this priority order:

### 1. Role-Based Locators (Preferred)

```typescript
// Buttons
await page.getByRole('button', { name: /submit/i }).click();

// Links
await page.getByRole('link', { name: /home/i }).click();

// Text inputs
await page.getByRole('textbox', { name: /email/i }).fill('user@example.com');

// Checkboxes
await page.getByRole('checkbox', { name: /remember me/i }).check();

// Radio buttons
await page.getByRole('radio', { name: /option 1/i }).click();

// Headings
await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
```

### 2. Label-Based Locators

```typescript
await page.getByLabel('Email Address').fill('user@example.com');
await page.getByLabel('Password').fill('password');
await page.getByLabel('Terms and Conditions').check();
```

### 3. Placeholder Locators

```typescript
await page.getByPlaceholder('Enter your email').fill('user@example.com');
```

### 4. Text Content Locators

```typescript
await page.getByText('Welcome back').click();
await page.getByText(/login successful/i).waitFor();
```

### 5. Test IDs (Last Resort)

```typescript
// In component:
// <button data-testid="submit-btn">Submit</button>

await page.getByTestId('submit-btn').click();
```

### 6. CSS/XPath Selectors (Avoid)

```typescript
// Only use when no better option exists
await page.locator('#login-form button[type="submit"]').click();
```

## Common Workflows

### User Registration Flow

```typescript
test('complete user registration', async ({ page }) => {
  // Navigate to registration page
  await page.goto('/register');

  // Fill registration form
  await page.getByLabel('Name').fill('John Doe');
  await page.getByLabel('Email').fill('john@example.com');
  await page.getByLabel('Password', { exact: true }).fill('SecurePass123!');
  await page.getByLabel('Confirm Password').fill('SecurePass123!');
  await page.getByLabel('I accept the terms').check();

  // Submit form
  await page.getByRole('button', { name: /register/i }).click();

  // Wait for redirect to user dashboard
  await page.waitForURL('http://app.virtualracingleagues.localhost:8000/');

  // Verify user is logged in
  await expect(page.getByText(/welcome, john doe/i)).toBeVisible();
});
```

### Login and Navigation Flow

```typescript
test('user can login and navigate to profile', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: /login/i }).click();

  // Wait for dashboard to load
  await page.waitForURL('http://app.virtualracingleagues.localhost:8000/');

  // Navigate to profile
  await page.getByRole('link', { name: /profile/i }).click();

  // Verify profile page
  await expect(page).toHaveURL(/\/profile/);
  await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible();
});
```

### Form Validation Flow

```typescript
test('validates form before submission', async ({ page }) => {
  await page.goto('/leagues/create');

  // Try to submit empty form
  await page.getByRole('button', { name: /create league/i }).click();

  // Should show validation errors
  await expect(page.getByText(/league name is required/i)).toBeVisible();
  await expect(page.getByText(/game is required/i)).toBeVisible();

  // Fill valid data
  await page.getByLabel('League Name').fill('My Racing League');
  await page.getByLabel('Game').selectOption('ACC');
  await page.getByLabel('Platform').selectOption('PC');

  // Submit
  await page.getByRole('button', { name: /create league/i }).click();

  // Should redirect to league page
  await expect(page).toHaveURL(/\/leagues\/my-racing-league/);
  await expect(page.getByText('My Racing League')).toBeVisible();
});
```

### File Upload Flow

```typescript
import path from 'path';

test('uploads league logo', async ({ page }) => {
  await page.goto('/leagues/create');

  // Fill required fields
  await page.getByLabel('League Name').fill('Test League');
  await page.getByLabel('Game').selectOption('ACC');

  // Upload file
  const filePath = path.join(__dirname, '../fixtures/logo.jpg');
  await page.getByLabel('Logo').setInputFiles(filePath);

  // Verify preview (if component shows preview)
  await expect(page.locator('img[alt="Logo preview"]')).toBeVisible();

  // Submit
  await page.getByRole('button', { name: /create/i }).click();

  // Verify league was created
  await expect(page.getByText('Test League')).toBeVisible();
});
```

### Multi-Step Wizard Flow

```typescript
test('completes multi-step league setup', async ({ page }) => {
  await page.goto('/leagues/create');

  // Step 1: Basic Info
  await page.getByLabel('League Name').fill('Championship League');
  await page.getByRole('button', { name: /next/i }).click();

  // Step 2: Settings
  await page.getByLabel('Max Participants').fill('20');
  await page.getByLabel('Visibility').selectOption('public');
  await page.getByRole('button', { name: /next/i }).click();

  // Step 3: Review & Confirm
  await expect(page.getByText('Championship League')).toBeVisible();
  await expect(page.getByText('Max Participants: 20')).toBeVisible();
  await page.getByRole('button', { name: /create league/i }).click();

  // Success
  await expect(page.getByText(/league created successfully/i)).toBeVisible();
});
```

## Assertions

### Page Assertions

```typescript
// URL assertions
await expect(page).toHaveURL('http://app.virtualracingleagues.localhost:8000/');
await expect(page).toHaveURL(/\/leagues\/\d+/);

// Title assertions
await expect(page).toHaveTitle(/dashboard/i);

// Screenshot comparison (visual regression)
await expect(page).toHaveScreenshot('homepage.png');
```

### Element Assertions

```typescript
// Visibility
await expect(page.getByText('Welcome')).toBeVisible();
await expect(page.getByText('Hidden text')).toBeHidden();

// Text content
await expect(page.getByRole('heading')).toHaveText('Dashboard');
await expect(page.getByRole('heading')).toContainText('Dash');

// Attributes
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('button')).toBeDisabled();
await expect(page.getByRole('checkbox')).toBeChecked();
await expect(page.locator('input')).toHaveValue('john@example.com');
await expect(page.locator('a')).toHaveAttribute('href', '/profile');

// Count
await expect(page.getByRole('listitem')).toHaveCount(5);
```

### Soft Assertions (Continue on Failure)

```typescript
test('multiple soft assertions', async ({ page }) => {
  await page.goto('/dashboard');

  // These will all run even if one fails
  await expect.soft(page.getByText('Welcome')).toBeVisible();
  await expect.soft(page.getByRole('button', { name: /logout/i })).toBeVisible();
  await expect.soft(page.getByText('Profile')).toBeVisible();

  // Test continues even if soft assertions fail
});
```

## Waiting and Timeouts

### Auto-Waiting

Playwright automatically waits for elements to be actionable:

```typescript
// Automatically waits for button to be:
// - Attached to DOM
// - Visible
// - Enabled
// - Stable (not animating)
await page.getByRole('button').click();
```

### Explicit Waits

```typescript
// Wait for element to appear
await page.getByText('Loading complete').waitFor();

// Wait for element to disappear
await page.getByText('Loading...').waitFor({ state: 'hidden' });

// Wait for URL change
await page.waitForURL('http://app.virtualracingleagues.localhost:8000/');

// Wait for response
await page.waitForResponse((response) =>
  response.url().includes('/api/users') && response.status() === 200
);

// Wait for request
await page.waitForRequest((request) =>
  request.url().includes('/api/login') && request.method() === 'POST'
);

// Wait for network to be idle
await page.waitForLoadState('networkidle');

// Wait for specific time (avoid unless necessary)
await page.waitForTimeout(1000);
```

### Custom Timeout

```typescript
// Override default timeout for specific action
await page.getByText('Slow element').click({ timeout: 30000 });

// Set timeout for specific test
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds

  // ... test code
});
```

## Authentication Setup

### Using Test Fixtures (Recommended)

Create reusable authenticated context:

```typescript
// tests/Browser/fixtures/auth.ts
import { test as base } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: /login/i }).click();

    // Wait for redirect
    await page.waitForURL('http://app.virtualracingleagues.localhost:8000/');

    // Provide authenticated page to test
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

**Usage**:

```typescript
import { test, expect } from './fixtures/auth';

test('authenticated user can view profile', async ({ authenticatedPage }) => {
  // Already logged in!
  await authenticatedPage.goto('/profile');

  await expect(authenticatedPage.getByText('My Profile')).toBeVisible();
});
```

### Using Storage State (Faster)

Save authentication state once, reuse across tests:

```typescript
// tests/Browser/setup/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: /login/i }).click();

  await page.waitForURL('http://app.virtualracingleagues.localhost:8000/');

  // Save authentication state
  await page.context().storageState({ path: 'tests/Browser/.auth/user.json' });
});
```

**Configure in `playwright.config.ts`**:

```typescript
export default defineConfig({
  projects: [
    // Setup project
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // Test project using setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/Browser/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

## Testing Across Subdomains

### Cross-Subdomain Authentication Flow

```typescript
test('login on public site redirects to user dashboard', async ({ page }) => {
  // Start on public site
  await page.goto('http://virtualracingleagues.localhost:8000/login');

  // Login
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: /login/i }).click();

  // Should redirect to user dashboard subdomain
  await expect(page).toHaveURL('http://app.virtualracingleagues.localhost:8000/');

  // Session should persist across subdomains
  await expect(page.getByText(/welcome back/i)).toBeVisible();
});
```

### Admin vs User Access

```typescript
test('regular user cannot access admin dashboard', async ({ page }) => {
  // Login as regular user
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: /login/i }).click();

  // Try to access admin dashboard
  await page.goto('http://admin.virtualracingleagues.localhost:8000/admin');

  // Should be redirected or see access denied
  await expect(page.getByText(/access denied/i)).toBeVisible();
});

test('admin user can access admin dashboard', async ({ page }) => {
  // Login as admin
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('adminpassword');
  await page.getByRole('button', { name: /login/i }).click();

  // Navigate to admin dashboard
  await page.goto('http://admin.virtualracingleagues.localhost:8000/admin');

  // Should see admin interface
  await expect(page.getByRole('heading', { name: /admin dashboard/i })).toBeVisible();
});
```

## PrimeVue Component Testing

### Testing Dialogs

```typescript
test('opens confirmation dialog', async ({ page }) => {
  await page.goto('/leagues');

  // Click delete button
  await page.getByRole('button', { name: /delete/i }).click();

  // Dialog should appear (PrimeVue renders dialogs in body)
  await expect(page.getByText(/are you sure/i)).toBeVisible();

  // Confirm deletion
  await page.getByRole('button', { name: /confirm/i }).click();

  // Success message
  await expect(page.getByText(/league deleted/i)).toBeVisible();
});
```

### Testing Dropdowns

```typescript
test('selects value from dropdown', async ({ page }) => {
  await page.goto('/leagues/create');

  // Click dropdown to open
  await page.getByLabel('Game').click();

  // Select option from PrimeVue dropdown
  await page.getByRole('option', { name: /assetto corsa competizione/i }).click();

  // Verify selection
  await expect(page.getByLabel('Game')).toHaveText(/assetto corsa competizione/i);
});
```

### Testing DataTable

```typescript
test('filters and sorts data table', async ({ page }) => {
  await page.goto('/admin/users');

  // Should show users
  await expect(page.getByRole('row')).toHaveCount(11); // Header + 10 users

  // Filter by name
  await page.getByPlaceholder('Search by name').fill('John');

  // Filtered results
  await expect(page.getByRole('row')).toHaveCount(4); // Header + 3 Johns

  // Sort by email
  await page.getByRole('columnheader', { name: /email/i }).click();

  // Verify sort order (first data row should have sorted email)
  await expect(page.getByRole('row').nth(1)).toContainText('a@example.com');
});
```

## Test Isolation and Cleanup

### Database Cleanup

**Option 1**: Use Laravel's RefreshDatabase in tests

```typescript
test.beforeEach(async ({ page }) => {
  // Reset database via API endpoint
  await page.request.post('/api/test/reset-database');
});
```

**Option 2**: Manual cleanup

```typescript
test.afterEach(async ({ page }) => {
  // Delete created data
  await page.request.delete('/api/leagues/test-league');
});
```

### Browser State Cleanup

```typescript
test.beforeEach(async ({ page }) => {
  // Clear cookies and localStorage
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
});
```

## Debugging Tests

### Visual Debugging

```bash
# Step through test with UI
npx playwright test --debug

# Step through specific test
npx playwright test login.spec.ts --debug
```

### Playwright Inspector

Opens when using `--debug` flag:
- Step through test line-by-line
- Inspect locators
- View console logs
- Edit and replay steps

### Screenshots and Videos

```typescript
// Take screenshot
await page.screenshot({ path: 'screenshot.png' });

// Screenshot specific element
await page.getByRole('button').screenshot({ path: 'button.png' });

// Enable video recording in playwright.config.ts
use: {
  video: 'retain-on-failure',
}
```

### Traces

```typescript
// Enable in playwright.config.ts
use: {
  trace: 'on-first-retry',
}

// View trace
npx playwright show-trace trace.zip
```

### Console Logs

```typescript
page.on('console', (msg) => console.log('Browser log:', msg.text()));
```

## Best Practices

### 1. Test Critical User Journeys

Focus on high-value workflows:
- User registration → login → first action
- Create league → add participants → start event
- Admin login → manage users → update settings

### 2. Keep Tests Independent

Each test should:
- Set up its own data
- Clean up after itself
- Not depend on other tests

### 3. Use Page Object Model (Optional)

For complex pages, create page objects:

```typescript
// tests/Browser/pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: /login/i }).click();
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL(/app\.virtualracingleagues/);
  }
}

// Usage
test('user login', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  await loginPage.expectLoginSuccess();
});
```

### 4. Avoid Flaky Tests

```typescript
// Bad: Fixed timeout
await page.waitForTimeout(3000);

// Good: Wait for specific condition
await page.getByText('Data loaded').waitFor();

// Bad: Assume immediate update
await page.click('button');
expect(page.getByText('Updated')).toBeVisible(); // Flaky!

// Good: Wait for update
await page.click('button');
await expect(page.getByText('Updated')).toBeVisible(); // Reliable
```

### 5. Use Meaningful Test Data

```typescript
// Bad: Unclear data
await page.getByLabel('Name').fill('Test');

// Good: Realistic data
await page.getByLabel('Name').fill('John Doe Racing League');
```

### 6. Test Error Scenarios

```typescript
test('handles network errors gracefully', async ({ page }) => {
  // Simulate offline
  await page.context().setOffline(true);

  await page.goto('/leagues');

  // Should show error message
  await expect(page.getByText(/network error/i)).toBeVisible();
});
```

### 7. Run Tests in CI/CD

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Common Patterns

### Testing Search Functionality

```typescript
test('searches leagues by name', async ({ page }) => {
  await page.goto('/leagues');

  await page.getByPlaceholder('Search leagues').fill('championship');

  // Wait for results to update
  await expect(page.getByText('Championship League')).toBeVisible();
  await expect(page.getByText('Unrelated League')).toBeHidden();
});
```

### Testing Pagination

```typescript
test('navigates through paginated results', async ({ page }) => {
  await page.goto('/leagues');

  // First page
  await expect(page.getByText('League 1')).toBeVisible();

  // Go to page 2
  await page.getByRole('button', { name: /next/i }).click();

  // Second page
  await expect(page.getByText('League 11')).toBeVisible();
  await expect(page.getByText('League 1')).toBeHidden();
});
```

### Testing Infinite Scroll

```typescript
test('loads more items on scroll', async ({ page }) => {
  await page.goto('/feed');

  // Initial items
  await expect(page.getByRole('article')).toHaveCount(10);

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  // More items loaded
  await expect(page.getByRole('article')).toHaveCount(20);
});
```

---

**Key Takeaways**:
- E2E tests validate **complete user workflows** across the full stack
- Test **critical journeys** (login, registration, core features)
- Use **role-based locators** (accessible, maintainable)
- Test **cross-subdomain flows** (public → user dashboard)
- Keep tests **independent** and **isolated**
- Avoid **flaky tests** with proper waiting strategies
- Use **authentication fixtures** for authenticated tests
- Test **error scenarios** and **edge cases**
- Run tests in **CI/CD** for continuous validation

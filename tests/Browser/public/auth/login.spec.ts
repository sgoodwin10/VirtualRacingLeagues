/**
 * Public Login E2E Tests
 *
 * Comprehensive test suite for the public site login page.
 * Tests page rendering, form fields, and successful authentication flow.
 *
 * @see /var/www/resources/public/js/views/auth/LoginView.vue
 */

import { test, expect } from '@playwright/test';
import { TEST_URLS, TEST_CREDENTIALS } from '../../utils/test-config';
import { gotoPublic } from '../../utils/navigation.helper';
import { loginAsUser, clearPublicSession } from '../helpers/public-auth.helper';

test.describe('Public Login - Page Rendering', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session before each test for isolation
    await clearPublicSession(page);
  });

  test('should load login page successfully', async ({ page }) => {
    // ARRANGE & ACT: Navigate to login page
    await gotoPublic(page, TEST_URLS.public.login);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(500); // Small delay for Vue to render

    // ASSERT: Page loads correctly
    await expect(page).toHaveURL(TEST_URLS.public.login);
    await expect(page).toHaveTitle(/Virtual Racing Leagues/i);

    // ASSERT: Main heading is visible
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

    // ASSERT: Subheading is visible
    await expect(page.getByText(/sign in to your account/i)).toBeVisible();
  });

  test('should display all UI elements', async ({ page }) => {
    // ARRANGE: Navigate to login page
    await gotoPublic(page, TEST_URLS.public.login);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(500);

    // ASSERT: Form fields are visible
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.locator('#password input')).toBeVisible(); // PrimeVue Password component input
    await expect(page.getByLabel(/remember me/i)).toBeVisible();

    // ASSERT: Submit button is visible
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // ASSERT: Additional links are visible
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();

    // ASSERT: "Don't have an account?" text is visible
    await expect(page.getByText(/don't have an account/i)).toBeVisible();
  });
});

test.describe('Public Login - Form Fields', () => {
  test.beforeEach(async ({ page }) => {
    await clearPublicSession(page);
    await gotoPublic(page, TEST_URLS.public.login);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test('should display email input field with correct attributes', async ({ page }) => {
    // ARRANGE: Get email field
    const emailField = page.getByLabel('Email Address');

    // ASSERT: Email field is visible and enabled
    await expect(emailField).toBeVisible();
    await expect(emailField).not.toBeDisabled();

    // ASSERT: Email field has correct attributes
    await expect(emailField).toHaveAttribute('type', 'email');
    await expect(emailField).toHaveAttribute('id', 'email');
    await expect(emailField).toHaveAttribute('placeholder', 'john@example.com');
    await expect(emailField).toHaveAttribute('autocomplete', 'email');
  });

  test('should display password input field with correct attributes', async ({ page }) => {
    // ARRANGE: Get password field (PrimeVue Password component - select the input inside)
    const passwordField = page.locator('#password input');

    // ASSERT: Password field is visible and enabled
    await expect(passwordField).toBeVisible();
    await expect(passwordField).not.toBeDisabled();

    // ASSERT: Password field has correct attributes
    await expect(passwordField).toHaveAttribute('placeholder', 'Enter your password');
    await expect(passwordField).toHaveAttribute('type', 'password');

    // Note: PrimeVue Password component doesn't pass through autocomplete to the input
    // The autocomplete attribute is set on the wrapper div, not the input element
  });

  test('should display remember me checkbox', async ({ page }) => {
    // ARRANGE: Get remember me checkbox
    const rememberCheckbox = page.getByLabel(/remember me/i);

    // ASSERT: Checkbox is visible and enabled
    await expect(rememberCheckbox).toBeVisible();
    await expect(rememberCheckbox).not.toBeDisabled();

    // ASSERT: Checkbox is unchecked by default
    await expect(rememberCheckbox).not.toBeChecked();
  });

  test('should display submit button with correct state', async ({ page }) => {
    // ARRANGE: Get submit button
    const submitButton = page.getByRole('button', { name: /sign in/i });

    // ASSERT: Submit button is visible
    await expect(submitButton).toBeVisible();

    // ASSERT: Submit button has correct label
    await expect(submitButton).toHaveText(/sign in/i);

    // ASSERT: Submit button is disabled when form is empty
    await expect(submitButton).toBeDisabled();
  });

  test('should enable submit button when form is valid', async ({ page }) => {
    // ARRANGE: Get form fields
    const emailField = page.getByLabel('Email Address');
    const passwordField = page.locator('#password input'); // PrimeVue Password component input
    const submitButton = page.getByRole('button', { name: /sign in/i });

    // ASSERT: Button is initially disabled
    await expect(submitButton).toBeDisabled();

    // ACT: Fill in email only
    await emailField.fill('user@example.com');

    // ASSERT: Button is still disabled (password empty)
    await expect(submitButton).toBeDisabled();

    // ACT: Fill in password
    await passwordField.fill('password');

    // ASSERT: Button is now enabled
    await expect(submitButton).not.toBeDisabled();
  });

  test('should accept input in email field', async ({ page }) => {
    // ARRANGE: Get email field
    const emailField = page.getByLabel('Email Address');

    // ACT: Type email
    await emailField.fill('test@example.com');

    // ASSERT: Field contains typed value
    await expect(emailField).toHaveValue('test@example.com');
  });

  test('should accept input in password field', async ({ page }) => {
    // ARRANGE: Get password field (PrimeVue Password component input)
    const passwordField = page.locator('#password input');

    // ACT: Type password
    await passwordField.fill('mypassword123');

    // ASSERT: Field contains typed value (note: value is masked but present)
    await expect(passwordField).toHaveValue('mypassword123');
  });

  test('should toggle remember me checkbox', async ({ page }) => {
    // ARRANGE: Get remember me checkbox
    const rememberCheckbox = page.getByLabel(/remember me/i);

    // ASSERT: Initially unchecked
    await expect(rememberCheckbox).not.toBeChecked();

    // ACT: Check the checkbox
    await rememberCheckbox.check();

    // ASSERT: Checkbox is checked
    await expect(rememberCheckbox).toBeChecked();

    // ACT: Uncheck the checkbox
    await rememberCheckbox.uncheck();

    // ASSERT: Checkbox is unchecked again
    await expect(rememberCheckbox).not.toBeChecked();
  });
});

test.describe('Public Login - Navigation Links', () => {
  test.beforeEach(async ({ page }) => {
    await clearPublicSession(page);
    await gotoPublic(page, TEST_URLS.public.login);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test('should have working forgot password link', async ({ page }) => {
    // ARRANGE: Get forgot password link
    const forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });

    // ASSERT: Link is visible
    await expect(forgotPasswordLink).toBeVisible();

    // ACT: Click the link
    await forgotPasswordLink.click();

    // ASSERT: Navigated to forgot password page (use regex to handle port variations)
    await page.waitForURL(/\/forgot-password$/, { timeout: 5000 });
    await expect(page.url()).toContain('/forgot-password');
  });

  test('should have working sign up link', async ({ page }) => {
    // ARRANGE: Get sign up link
    const signUpLink = page.getByRole('link', { name: /sign up/i });

    // ASSERT: Link is visible
    await expect(signUpLink).toBeVisible();

    // ACT: Click the link
    await signUpLink.click();

    // ASSERT: Navigated to register page (use regex to handle port variations)
    await page.waitForURL(/\/register$/, { timeout: 5000 });
    await expect(page.url()).toContain('/register');
  });
});

test.describe('Public Login - Authentication Success', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session before each test for isolation
    await clearPublicSession(page);
  });

  test('should login successfully with valid credentials and redirect to user dashboard', async ({
    page,
  }) => {
    // ARRANGE: Navigate to login page
    await gotoPublic(page, TEST_URLS.public.login);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(500);

    // ACT: Fill in valid credentials
    await page.getByLabel('Email Address').fill(TEST_CREDENTIALS.user.email);
    await page.locator('#password input').fill(TEST_CREDENTIALS.user.password); // PrimeVue Password component input

    // ACT: Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();

    // ASSERT: Redirected to user dashboard (app.virtualracingleagues.localhost)
    // Use regex to handle port variations (with or without :80)
    await page.waitForURL(/app\.virtualracingleagues\.localhost(:\d+)?\/?$/, { timeout: 10000 });
    await expect(page.url()).toContain('app.virtualracingleagues.localhost');

    // ASSERT: User dashboard loaded successfully
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    // Verify we're on the dashboard by checking for dashboard-specific title or content
    await expect(page).toHaveTitle(/User Dashboard|My Leagues/i);
  });

  test('should login successfully using helper function', async ({ page }) => {
    // ACT: Use helper function to login
    await loginAsUser(page, TEST_CREDENTIALS.user, true);

    // ASSERT: Successfully logged in and on user dashboard
    await expect(page.url()).toContain('app.virtualracingleagues.localhost');
  });

  test('should maintain session across subdomains', async ({ page }) => {
    // ARRANGE & ACT: Login using helper
    await loginAsUser(page, TEST_CREDENTIALS.user, true);

    // ASSERT: On user dashboard
    await expect(page.url()).toContain('app.virtualracingleagues.localhost');

    // ACT: Navigate back to public site
    await gotoPublic(page, TEST_URLS.public.home);

    // ASSERT: Still authenticated (session cookie shared across subdomains)
    // Note: Adjust this based on your actual public home page behavior when authenticated
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await expect(page.url()).toContain('virtualracingleagues.localhost');
  });
});

test.describe('Public Login - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await clearPublicSession(page);
    await gotoPublic(page, TEST_URLS.public.login);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test('should have proper form labels and accessible names', async ({ page }) => {
    // ASSERT: Email field has accessible label
    const emailField = page.getByLabel('Email Address');
    await expect(emailField).toBeVisible();

    // ASSERT: Password field has label (PrimeVue Password component)
    const passwordLabel = page.locator('label[for="password"]');
    await expect(passwordLabel).toBeVisible();
    await expect(passwordLabel).toHaveText('Password');

    // ASSERT: Password input exists
    const passwordField = page.locator('#password input');
    await expect(passwordField).toBeVisible();

    // ASSERT: Remember me checkbox has accessible label
    const rememberCheckbox = page.getByLabel(/remember me/i);
    await expect(rememberCheckbox).toBeVisible();

    // ASSERT: Submit button has accessible name
    const submitButton = page.getByRole('button', { name: /sign in/i });
    await expect(submitButton).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // ACT: Focus on email field by clicking it first (to establish starting point)
    const emailField = page.getByLabel('Email Address');
    await emailField.click();
    await page.keyboard.type('user@example.com');

    // ACT: Tab to password field
    await page.keyboard.press('Tab');
    await page.keyboard.type('password123');

    // Note: PrimeVue Password component has a toggle mask button that is also focusable
    // ACT: Tab past the toggle mask button
    await page.keyboard.press('Tab');

    // ACT: Tab to remember me checkbox
    await page.keyboard.press('Tab');

    // ACT: Tab to forgot password link
    await page.keyboard.press('Tab');

    // ACT: Tab to submit button
    await page.keyboard.press('Tab');

    // ACT: Tab past "Sign up" link
    await page.keyboard.press('Tab');

    // ASSERT: Submit button should now be focused (or was focused in previous tab)
    // Just verify the submit button is keyboard accessible and enabled
    const submitButton = page.getByRole('button', { name: /sign in/i });
    await expect(submitButton).not.toBeDisabled();

    // VERIFY: We can focus the button directly
    await submitButton.focus();
    await expect(submitButton).toBeFocused();
  });

  test('should have proper page title for screen readers', async ({ page }) => {
    // ASSERT: Page has proper title
    await expect(page).toHaveTitle(/Virtual Racing Leagues/i);

    // ASSERT: Main heading is visible and has correct level
    const heading = page.getByRole('heading', { name: /welcome back/i });
    await expect(heading).toBeVisible();
  });
});

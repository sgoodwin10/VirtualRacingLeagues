/**
 * Admin Authentication Helper
 *
 * Provides reusable authentication functions for admin E2E tests.
 * This helper can be used across all admin test files to login as different admin roles.
 */

import { Page, expect } from '@playwright/test';
import { TEST_URLS, TEST_CREDENTIALS } from '../../utils/test-config';
import { gotoAdmin } from '../../utils/navigation.helper';

/**
 * Admin credentials type
 */
export type AdminCredentials = {
  email: string;
  password: string;
};

/**
 * Login as admin user and verify successful authentication
 *
 * @param page - Playwright page object
 * @param credentials - Admin credentials (defaults to regular admin)
 * @param verifyRedirect - Whether to verify redirect to dashboard (default: true)
 */
export async function loginAsAdmin(
  page: Page,
  credentials: AdminCredentials = TEST_CREDENTIALS.admin,
  verifyRedirect = true
): Promise<void> {
  // Navigate to admin login page
  await gotoAdmin(page, TEST_URLS.admin.login);

  // Wait for Vue app to mount and network to be idle
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(500); // Small delay for Vue to render

  // Fill in credentials
  await page.getByLabel('Email Address').fill(credentials.email);
  await page.locator('#password input').fill(credentials.password); // PrimeVue Password component input

  // Submit form
  await page.getByRole('button', { name: /sign in/i }).click();

  if (verifyRedirect) {
    // Wait a bit for navigation or error
    await page.waitForTimeout(1500);

    // Check if we got rate limited (429 error)
    const errorMessage = page.locator('.p-message-error, .p-message');
    const hasRateLimitError =
      (await errorMessage.locator(':has-text("429"), :has-text("too many"), :has-text("Request failed")').count()) > 0;

    if (hasRateLimitError) {
      // Throw error so test can handle it
      throw new Error('Rate limit exceeded (429)');
    }

    // Wait for redirect to dashboard
    await page.waitForURL(TEST_URLS.admin.dashboard, { timeout: 8000 });

    // Verify we're on the dashboard
    await expect(page).toHaveURL(TEST_URLS.admin.dashboard);
  }
}

/**
 * Login as super admin
 *
 * @param page - Playwright page object
 */
export async function loginAsSuperAdmin(page: Page): Promise<void> {
  await loginAsAdmin(page, TEST_CREDENTIALS.superAdmin);
}

/**
 * Login as moderator
 *
 * @param page - Playwright page object
 */
export async function loginAsModerator(page: Page): Promise<void> {
  await loginAsAdmin(page, TEST_CREDENTIALS.moderator);
}

/**
 * Login with remember me checkbox enabled
 *
 * @param page - Playwright page object
 * @param credentials - Admin credentials (defaults to regular admin)
 */
export async function loginAsAdminWithRememberMe(
  page: Page,
  credentials: AdminCredentials = TEST_CREDENTIALS.admin
): Promise<void> {
  // Navigate to admin login page
  await gotoAdmin(page, TEST_URLS.admin.login);

  // Wait for Vue app to mount and network to be idle
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(500); // Small delay for Vue to render

  // Fill in credentials
  await page.getByLabel('Email Address').fill(credentials.email);
  await page.locator('#password input').fill(credentials.password); // PrimeVue Password component input

  // Enable remember me
  await page.getByLabel(/remember me/i).check();

  // Submit form
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(TEST_URLS.admin.dashboard, { timeout: 10000 });
}

/**
 * Verify admin is authenticated by checking the session
 *
 * @param page - Playwright page object
 * @returns true if authenticated, false otherwise
 */
export async function verifyAdminSession(page: Page): Promise<boolean> {
  try {
    // Navigate to dashboard
    await gotoAdmin(page, TEST_URLS.admin.dashboard);

    // If we're redirected to login, not authenticated
    await page.waitForTimeout(2000);
    const currentUrl = page.url();

    return !currentUrl.includes('/login');
  } catch {
    return false;
  }
}

/**
 * Logout admin user
 *
 * @param page - Playwright page object
 */
export async function logoutAdmin(page: Page): Promise<void> {
  // Navigate to dashboard if not already there
  if (!page.url().includes('/admin')) {
    await gotoAdmin(page, TEST_URLS.admin.dashboard);
  }

  // Click logout button (adjust selector based on your UI)
  // This assumes there's a logout button or menu item
  try {
    await page.getByRole('button', { name: /logout/i }).click();
    await page.waitForURL(TEST_URLS.admin.login, { timeout: 5000 });
  } catch {
    // If logout button not found, clear context (which clears cookies/session)
    await page.context().clearCookies();
  }
}

/**
 * Clear admin session (useful for test cleanup)
 *
 * @param page - Playwright page object
 */
export async function clearAdminSession(page: Page): Promise<void> {
  await page.context().clearCookies();

  // Small delay to ensure cookies are fully cleared
  await page.waitForTimeout(500);
}

/**
 * Wait for admin app to fully load
 * Waits for Vue to mount and render content
 *
 * @param page - Playwright page object
 */
export async function waitForAdminAppMount(page: Page): Promise<void> {
  // Wait for Vue app to mount by checking for any visible heading or form element
  // This is more reliable than waiting for #admin-app which exists but may be empty
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(500); // Small delay for Vue to render
}

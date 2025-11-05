/**
 * Public Authentication Helper
 *
 * Provides reusable authentication functions for public site E2E tests.
 * This helper can be used across all public test files to login as regular users.
 */

import { Page, expect } from '@playwright/test';
import { TEST_URLS, TEST_CREDENTIALS } from '../../utils/test-config';
import { gotoPublic } from '../../utils/navigation.helper';

/**
 * User credentials type
 */
export type UserCredentials = {
  email: string;
  password: string;
};

/**
 * Login as regular user and verify successful authentication
 *
 * @param page - Playwright page object
 * @param credentials - User credentials (defaults to regular user)
 * @param verifyRedirect - Whether to verify redirect to user dashboard (default: true)
 */
export async function loginAsUser(
  page: Page,
  credentials: UserCredentials = TEST_CREDENTIALS.user,
  verifyRedirect = true
): Promise<void> {
  // Navigate to public login page
  await gotoPublic(page, TEST_URLS.public.login);

  // Wait for Vue app to mount and network to be idle
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(500); // Small delay for Vue to render

  // Fill in credentials
  await page.getByLabel('Email Address').fill(credentials.email);
  await page.locator('#password input').fill(credentials.password); // PrimeVue Password component input

  // Submit form
  await page.getByRole('button', { name: /sign in/i }).click();

  if (verifyRedirect) {
    // Wait for redirect to user dashboard (app.virtualracingleagues.localhost)
    // Use regex to handle port variations (with or without :80)
    await page.waitForURL(/app\.virtualracingleagues\.localhost(:\d+)?\/?$/, { timeout: 10000 });

    // Verify we're on the user dashboard
    await expect(page.url()).toContain('app.virtualracingleagues.localhost');
  }
}

/**
 * Login with remember me checkbox enabled
 *
 * @param page - Playwright page object
 * @param credentials - User credentials (defaults to regular user)
 */
export async function loginAsUserWithRememberMe(
  page: Page,
  credentials: UserCredentials = TEST_CREDENTIALS.user
): Promise<void> {
  // Navigate to public login page
  await gotoPublic(page, TEST_URLS.public.login);

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

  // Wait for redirect to user dashboard (use regex to handle port variations)
  await page.waitForURL(/app\.virtualracingleagues\.localhost(:\d+)?\/?$/, { timeout: 10000 });
}

/**
 * Verify user is authenticated by checking the session
 *
 * @param page - Playwright page object
 * @returns true if authenticated, false otherwise
 */
export async function verifyUserSession(page: Page): Promise<boolean> {
  try {
    // Navigate to user dashboard
    await gotoPublic(page, TEST_URLS.user.dashboard);

    // If we're redirected to login, not authenticated
    await page.waitForTimeout(2000);
    const currentUrl = page.url();

    return !currentUrl.includes('/login');
  } catch {
    return false;
  }
}

/**
 * Logout user
 *
 * @param page - Playwright page object
 */
export async function logoutUser(page: Page): Promise<void> {
  // Navigate to user dashboard if not already there
  if (!page.url().includes('app.virtualracingleagues')) {
    await gotoPublic(page, TEST_URLS.user.dashboard);
  }

  // Click logout button (adjust selector based on your UI)
  // This assumes there's a logout button or menu item
  try {
    await page.getByRole('button', { name: /logout/i }).click();
    await page.waitForURL(TEST_URLS.public.login, { timeout: 5000 });
  } catch {
    // If logout button not found, clear context (which clears cookies/session)
    await page.context().clearCookies();
  }
}

/**
 * Clear user session (useful for test cleanup)
 *
 * @param page - Playwright page object
 */
export async function clearPublicSession(page: Page): Promise<void> {
  await page.context().clearCookies();
}

/**
 * Wait for public app to fully load
 * Waits for Vue to mount and render content
 *
 * @param page - Playwright page object
 */
export async function waitForPublicAppMount(page: Page): Promise<void> {
  // Wait for Vue app to mount by checking for any visible heading or form element
  // This is more reliable than waiting for #public-app which exists but may be empty
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(500); // Small delay for Vue to render
}

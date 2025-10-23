/**
 * Navigation Helper for Playwright Tests
 *
 * Provides navigation utilities for consistent page navigation across tests.
 * These helpers add default wait conditions for better test reliability.
 *
 * When running inside Docker, the Playwright proxy configuration automatically
 * routes requests to the nginx service.
 */

import { Page } from '@playwright/test';

/**
 * Navigate to a URL with standard wait conditions
 *
 * @param page - Playwright page object
 * @param url - URL to navigate to
 */
export async function goto(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'load' });
}

/**
 * Navigate to a public site URL
 */
export async function gotoPublic(page: Page, url: string): Promise<void> {
  await goto(page, url);
}

/**
 * Navigate to a user dashboard URL
 */
export async function gotoUser(page: Page, url: string): Promise<void> {
  await goto(page, url);
}

/**
 * Navigate to an admin dashboard URL
 */
export async function gotoAdmin(page: Page, url: string): Promise<void> {
  await goto(page, url);
}

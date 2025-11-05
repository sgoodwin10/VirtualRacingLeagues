/**
 * Basic Admin Login Page Load Test
 *
 * Simple test to verify the admin login page loads successfully.
 */

import { test, expect } from '@playwright/test';
import { TEST_URLS } from '../../utils/test-config';

test.describe('Admin Login - Basic Page Load', () => {
  test('should load admin login page successfully', async ({ page }) => {
    // Navigate to admin login page
    await page.goto(TEST_URLS.admin.login);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify the page loaded successfully (status 200)
    expect(page.url()).toContain('/login');

    // Verify the page heading is visible
    await expect(page.getByRole('heading', { name: /admin login/i })).toBeVisible();
  });
});

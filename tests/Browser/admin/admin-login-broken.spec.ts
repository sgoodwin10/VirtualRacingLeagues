import { test, expect } from '@playwright/test';

test.describe('Admin Login - Broken Test', () => {
  test('should fail looking for non-existent class', async ({ page }) => {
    // Navigate to the admin login page
    await page.goto('http://admin.virtualracingleagues.localhost/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Try to find an element with a class that does not exist
    // This will cause the test to fail
    const nonExistentElement = page.locator('.this-class-does-not-exist-at-all');

    // This assertion will fail because the element doesn't exist
    await expect(nonExistentElement).toBeVisible({ timeout: 5000 });
  });
});

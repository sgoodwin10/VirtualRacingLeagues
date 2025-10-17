import { test, expect } from '@playwright/test';

test.describe('User Dashboard', () => {
    test('should load the user dashboard', async ({ page }) => {
        await page.goto('/');

        // Wait for Vue app to mount
        await page.waitForSelector('#user-app', { timeout: 10000 });

        // Add your assertions here
        await expect(page).toHaveTitle(/SimRacingLeagues/);
    });
});

test.describe('Admin Dashboard', () => {
    test('should load the admin dashboard', async ({ page }) => {
        await page.goto('/admin');

        // Wait for Vue app to mount
        await page.waitForSelector('#admin-app', { timeout: 10000 });

        // Add your assertions here
        await expect(page).toHaveTitle(/SimRacingLeagues/);
    });
});

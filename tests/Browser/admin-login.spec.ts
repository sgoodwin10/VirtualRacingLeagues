import { test, expect } from '@playwright/test';
import { TEST_URLS, TEST_CREDENTIALS, TEST_TIMEOUTS } from './utils/test-config';

test.describe('Admin Login', () => {
    test('should login successfully with valid credentials and redirect to dashboard', async ({ page }) => {
        // Navigate to admin login page
        await page.goto(TEST_URLS.admin.login);

        // Wait for the admin app to mount
        await page.waitForSelector('#admin-app', { timeout: TEST_TIMEOUTS.vueAppMount });

        // Verify we're on the login page
        await expect(page.getByRole('heading', { name: /admin login/i })).toBeVisible();

        // Fill in login form with valid credentials
        await page.getByLabel('Email Address').fill(TEST_CREDENTIALS.admin.email);
        await page.getByLabel('Password').fill(TEST_CREDENTIALS.admin.password);

        // Submit the form
        await page.getByRole('button', { name: /sign in/i }).click();

        // Wait for redirect to dashboard
        await page.waitForURL(TEST_URLS.admin.dashboard, { timeout: TEST_TIMEOUTS.navigation });

        // Verify we're on the dashboard
        await expect(page).toHaveURL(TEST_URLS.admin.dashboard);

        // Verify dashboard content is visible
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    });

    test('should show error message with invalid credentials', async ({ page }) => {
        // Navigate to admin login page
        await page.goto(TEST_URLS.admin.login);

        // Wait for the admin app to mount
        await page.waitForSelector('#admin-app', { timeout: TEST_TIMEOUTS.vueAppMount });

        // Fill in login form with invalid credentials
        await page.getByLabel('Email Address').fill(TEST_CREDENTIALS.invalidUser.email);
        await page.getByLabel('Password').fill(TEST_CREDENTIALS.invalidUser.password);

        // Submit the form
        await page.getByRole('button', { name: /sign in/i }).click();

        // Should stay on login page
        await expect(page).toHaveURL(TEST_URLS.admin.login);

        // Should show error message
        await expect(page.getByText(/login unsuccessful/i)).toBeVisible();
        await expect(page.getByText(/please check your credentials/i)).toBeVisible();
    });

    test('should show error message with incorrect password', async ({ page }) => {
        // Navigate to admin login page
        await page.goto(TEST_URLS.admin.login);

        // Wait for the admin app to mount
        await page.waitForSelector('#admin-app', { timeout: TEST_TIMEOUTS.vueAppMount });

        // Fill in login form with valid email but wrong password
        await page.getByLabel('Email Address').fill(TEST_CREDENTIALS.admin.email);
        await page.getByLabel('Password').fill('wrongpassword');

        // Submit the form
        await page.getByRole('button', { name: /sign in/i }).click();

        // Should stay on login page
        await expect(page).toHaveURL(TEST_URLS.admin.login);

        // Should show error message
        await expect(page.getByText(/login unsuccessful/i)).toBeVisible();
    });
});

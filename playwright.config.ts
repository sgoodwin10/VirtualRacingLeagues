import { defineConfig, devices } from '@playwright/test';

/**
 * Read configuration from environment variables
 *
 * Tests can be run either from:
 * 1. Host machine: Subdomain URLs resolve via /etc/hosts (use port 8000)
 * 2. Docker container: Subdomain URLs resolve via /etc/hosts (use port 80)
 */
const TEST_DOMAIN = process.env.TEST_DOMAIN || 'localhost';
const TEST_PORT = process.env.TEST_PORT || '80';
const NGINX_IP = process.env.NGINX_CONTAINER_IP || '172.19.0.7';
const BASE_URL = `http://${TEST_DOMAIN}:${TEST_PORT}`;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/Browser',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: BASE_URL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          headless: true,
          args: [
            '--disable-dev-shm-usage',  // Overcome limited shared memory in Docker
            '--disable-blink-features=AutomationControlled',  // Avoid automation detection
            '--no-sandbox',  // Required in Docker
            '--disable-setuid-sandbox',
            // Fix DNS resolution in Docker - map subdomains to nginx container IP
            `--host-resolver-rules=MAP *.${TEST_DOMAIN} ${NGINX_IP},MAP ${TEST_DOMAIN} ${NGINX_IP}`,
          ],
        },
      },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Playwright runs inside Docker container where npm run dev is already running */
  // webServer configuration not needed - using existing Docker environment
});

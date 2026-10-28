import { defineConfig, devices } from '@playwright/test';

// Runs against a deployed storefront (staging) or a local `npm run dev` with the API running.
//   E2E_BASE_URL=https://staging.example npm run test:e2e
// PLAYWRIGHT_CHROMIUM_EXECUTABLE lets the suite use an existing Chromium binary.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  fullyParallel: false, // flows share real stock; run them one at a time
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'], launchOptions: { executablePath } },
      testMatch: /catalog\.spec\.js/,
    },
  ],
});

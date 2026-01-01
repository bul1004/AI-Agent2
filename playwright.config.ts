import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

// Load Next.js environment variables (.env, .env.local, etc.)
loadEnvConfig(process.cwd());

/**
 * Playwright E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "list" : "html",
  globalSetup: "./tests/e2e/global.setup.ts",

  use: {
    baseURL: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Microsoft Edge",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
    },
    {
      name: "Safari (WebKit)",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  /* Run local dev server before starting the tests */
  webServer: {
    command: `PORT=${process.env.PORT || 3000} npm run dev`,
    url: `http://localhost:${process.env.PORT || 3000}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

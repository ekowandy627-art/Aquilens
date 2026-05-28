import { defineConfig, devices } from "@playwright/test";

const webPort = 3000;

/**
 * E2E expects the API on :3001 with demo mode, and starts web on :3000 unless already running:
 *
 *   ALLOW_DEMO_BEARER=true npm run dev:api
 *   npm run test:e2e
 *
 * See docs/E2E_COVERAGE_MATRIX.md for flow coverage.
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // GIS demo reset is global; serial specs must not run reset in parallel.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: `http://127.0.0.1:${webPort}`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NODE_ENV: "development",
      ALLOW_DEMO_SESSION: "true",
      NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:3001/api/v1",
    },
  },
});

import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
config();
if (!process.env.APP_URL) {
  throw new Error("The APP_URL environment variable is not set");
}
if (!process.env.TEST_USERNAME) {
  throw new Error("The TEST_USERNAME environment variable is not set");
}
if (!process.env.TEST_PASSWORD) {
  throw new Error("The TEST_PASSWORD environment variable is not set");
}

export const APP_URL: string =
  process.env.APP_URL ?? "http://localhost:11065/plan-generation/";
export const AUTH_URL: string =
  process.env.AUTH_URL ?? "http://keycloak:8081/realms/landonline/";
export const TEST_USERNAME: string = process.env.TEST_USERNAME ?? "extsurv1";
export const TEST_PASSWORD: string = process.env.TEST_PASSWORD;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  expect: {
    timeout: 15000, // Maximum time expect() should wait for the condition to be met.
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  globalSetup: "./global-setup.ts",
  reporter: [
    [process.env.CI ? "dot" : "list"],
    ["html", { open: "never", outputFolder: "output" }],
    ["junit", { open: "never", outputFile: "output/test-results.xml" }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: APP_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: "Mobile Chrome",
    //   use: { ...devices["Pixel 5"] },
    // },
    // {
    //   name: "Mobile Safari",
    //   use: { ...devices["iPhone 12"] },
    // },

    /* Test against branded browsers. */
    //   {
    //     name: "Microsoft Edge",
    //     use: { ...devices["Desktop Edge"], channel: "msedge" },
    //   },
    //   {
    //     name: "Google Chrome",
    //     use: { ...devices["Desktop Chrome"], channel: "chrome" },
    //   },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: "npm run start",
  //   url: "http://127.0.0.1:3000",
  //   reuseExistingServer: !process.env.CI,
  // },
});

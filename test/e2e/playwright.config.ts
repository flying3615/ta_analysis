import { defineConfig, devices, PlaywrightTestConfig } from "@playwright/test";
import { config } from "dotenv";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
config();
if (!process.env.TEST_USERNAME) {
  throw new Error("The TEST_USERNAME environment variable is not set");
}
if (!process.env.TEST_PASSWORD) {
  throw new Error("The TEST_PASSWORD environment variable is not set");
}

export const TEST_USERNAME: string = process.env.TEST_USERNAME;
export const TEST_PASSWORD: string = process.env.TEST_PASSWORD;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const pwConfig: PlaywrightTestConfig = defineConfig({
  testDir: "./tests",
  expect: {
    timeout: process.env.CI ? 20_000 : 60_000, // 20 second timeout in CI, 60 seconds locally
  },
  timeout: process.env.CI ? 60_000 : 180_000, // 1 minute timeout in CI, 3 minutes locally
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    [process.env.CI ? "dot" : "list"],
    ["html", { open: "never", outputFolder: "output" }],
    ["junit", { open: "never", outputFile: "output/test-results.xml" }],
    ["allure-playwright"],
    ["./plan-image-output-reporter.ts"],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:11065",

    trace: "retain-on-failure",
    video: "retain-on-failure",

    /* Put playwright var in local storage */
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://localhost:11065",
          localStorage: [
            {
              name: "isPlaywrightTest",
              value: "1",
            },
          ],
        },
      ],
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "authSetup",
      testMatch: "**/*.setup.ts",
    },
    {
      name: "chromium",
      dependencies: ["authSetup"],
      use: { ...devices["Desktop Chrome"], storageState: "auth/user.json" },
    },

    /* Disabling test run for firefox and webkit. */
    // {
    //   name: "firefox",
    //   dependencies: ["authSetup"],
    //   use: { ...devices["Desktop Firefox"], storageState: "auth/user.json" },
    // },
    // {
    //   name: "webkit",
    //   dependencies: ["authSetup"],
    //   use: { ...devices["Desktop Safari"], storageState: "auth/user.json" },
    // },

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
});

export default pwConfig;

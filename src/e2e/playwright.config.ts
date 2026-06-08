import { defineConfig, devices } from "@playwright/test"
import { config } from "dotenv"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env from this directory with override: true so file values always win
// over any empty shell variables that may shadow them.
config({ path: resolve(__dirname, ".env"), override: true })

export default defineConfig({
  testDir: "./specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "list" : "html",

  use: {
    baseURL: process.env.DEV_BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    // Runs once per session — submits the dev/staging password gate and saves the cookie
    {
      name: "setup",
      testDir: "./setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/gate.json",
      },
      dependencies: ["setup"],
    },
  ],

  outputDir: "../../playwright-results",
})

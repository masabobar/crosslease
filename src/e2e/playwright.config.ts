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
    // Step 1: submit the HTTP password gate, save cookie to .auth/gate.json
    {
      name: "gate-setup",
      testDir: "./setup",
      testMatch: /gate\.setup\.ts/,
    },
    // Step 2: create app session via POST /internal/test/session, save to .auth/user.json
    {
      name: "auth-setup",
      testDir: "./setup",
      testMatch: /auth\.setup\.ts/,
      use: {
        storageState: ".auth/gate.json",
      },
      dependencies: ["gate-setup"],
    },
    // Unauthenticated tests (login flow, validation, etc.)
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/gate.json",
      },
      dependencies: ["gate-setup"],
    },
    // Pre-authenticated tests (user management, dashboard, etc.)
    {
      name: "chromium-authenticated",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/user.json",
      },
      dependencies: ["auth-setup"],
    },
  ],

  outputDir: "../../playwright-results",
})

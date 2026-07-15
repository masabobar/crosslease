import { defineConfig, devices } from "@playwright/test"
import { config } from "dotenv"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env from this directory with override: true so file values always win
// over any empty shell variables that may shadow them.
config({ path: resolve(__dirname, ".env"), override: true })

// Resolve environment-specific vars into normalized E2E_* names used throughout
// the test suite. Target env is decided by GitLab's auto-exposed
// CI_ENVIRONMENT_NAME ("Develop" | "Staging"); locally the variable is unset
// and the DEV_* credentials from src/e2e/.env are used.
// Role-specific staging credentials fall back to DEV values if unset in CI.
const targetEnv = process.env.CI_ENVIRONMENT_NAME ?? ""
const isStaging = targetEnv === "Staging"
const pick = (stg: string | undefined, dev: string | undefined) =>
  isStaging ? stg || dev || "" : dev || ""

process.env.E2E_BASE_URL =
  process.env.BASE_URL ?? process.env.DEV_BASE_URL ?? "http://localhost:5173"
process.env.E2E_API_BASE_URL = pick(
  process.env.E2E_STG_API_BASE_URL,
  process.env.E2E_DEV_API_BASE_URL
)
process.env.E2E_BACK_OFFICE_USER_EMAIL = pick(
  process.env.STG_BACK_OFFICE_USER_EMAIL,
  process.env.DEV_BACK_OFFICE_USER_EMAIL
)
process.env.E2E_BACK_OFFICE_USER_PASSWORD = pick(
  process.env.STG_BACK_OFFICE_USER_PASSWORD,
  process.env.DEV_BACK_OFFICE_USER_PASSWORD
)
process.env.E2E_FRONT_OFFICE_USER_EMAIL = pick(
  process.env.STG_FRONT_OFFICE_USER_EMAIL,
  process.env.DEV_FRONT_OFFICE_USER_EMAIL
)
process.env.E2E_FRONT_OFFICE_USER_PASSWORD = pick(
  process.env.STG_FRONT_OFFICE_USER_PASSWORD,
  process.env.DEV_FRONT_OFFICE_USER_PASSWORD
)
process.env.E2E_SUPPORT_USER_EMAIL = pick(
  process.env.STG_SUPPORT_USER_EMAIL,
  process.env.DEV_SUPPORT_USER_EMAIL
)
process.env.E2E_SUPPORT_USER_PASSWORD = pick(
  process.env.STG_SUPPORT_USER_PASSWORD,
  process.env.DEV_SUPPORT_USER_PASSWORD
)
process.env.E2E_AUDIT_USER_EMAIL = pick(
  process.env.STG_AUDIT_USER_EMAIL,
  process.env.DEV_AUDIT_USER_EMAIL
)
process.env.E2E_AUDIT_USER_PASSWORD = pick(
  process.env.STG_AUDIT_USER_PASSWORD,
  process.env.DEV_AUDIT_USER_PASSWORD
)
process.env.E2E_LCO_USER_EMAIL = pick(
  process.env.STG_LCO_USER_EMAIL,
  process.env.DEV_LCO_USER_EMAIL
)
process.env.E2E_LCO_USER_PASSWORD = pick(
  process.env.STG_LCO_USER_PASSWORD,
  process.env.DEV_LCO_USER_PASSWORD
)
process.env.E2E_SYSTEM_ADMIN_EMAIL = pick(
  process.env.STG_SYSTEM_ADMIN_EMAIL,
  process.env.DEV_SYSTEM_ADMIN_EMAIL
)
process.env.E2E_SYSTEM_ADMIN_PASSWORD = pick(
  process.env.STG_SYSTEM_ADMIN_PASSWORD,
  process.env.DEV_SYSTEM_ADMIN_PASSWORD
)

export default defineConfig({
  testDir: "./specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? "list"
    : [
        [
          "html",
          { outputFolder: resolve(__dirname, "./reports/html"), open: "never" },
        ],
      ],

  use: {
    baseURL: process.env.E2E_BASE_URL,
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
    // Excludes login/auth specs that require an unauthenticated page.
    {
      name: "chromium-authenticated",
      testIgnore: /prd1042-43-user-login\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/user.json",
      },
      dependencies: ["auth-setup"],
    },
  ],

  outputDir: resolve(__dirname, "./reports/results"),
})

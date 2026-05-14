
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  

  use: {
    baseURL: process.env.STAGING_BASE_URL,
    headless: !!process.env.CI,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  reporter: [
    ['html',  { outputFolder: '../playwright-report' }],
    ['junit', { outputFile: '../test-results/junit.xml' }],
    ...(process.env.CI ? [] : [['list'] as [string]]),
  ],

  projects: [
    // ── Auth setup projects (run once, save session state) ────────────────────
    {
      name: 'bank-admin-setup',
      testMatch: /helpers\/auth\.ts/,
      use: { storageState: '.auth/bank-admin.json' },
    },
    {
      name: 'bank-fo-setup',
      testMatch: /helpers\/auth\.ts/,
      use: { storageState: '.auth/bank-fo.json' },
    },
    {
      name: 'bank-bo-setup',
      testMatch: /helpers\/auth\.ts/,
      use: { storageState: '.auth/bank-bo.json' },
    },
    {
      name: 'lc-user-setup',
      testMatch: /helpers\/auth\.ts/,
      use: { storageState: '.auth/lc-user.json' },
    },
    {
      name: 'auditor-setup',
      testMatch: /helpers\/auth\.ts/,
      use: { storageState: '.auth/auditor.json' },
    },

    // ── Unauthenticated — auth flows, onboarding ──────────────────────────────
    {
      name: 'unauthenticated',
      testMatch: /specs\/(auth|onboarding)\//,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Admin-gated flows ─────────────────────────────────────────────────────
    {
      name: 'admin-flows',
      dependencies: ['bank-admin-setup'],
      testMatch: /specs\/(user-lifecycle|audit)\//,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/bank-admin.json',
      },
    },

    // ── Access control — tests load persona storageState per test ─────────────
    {
      name: 'access-control',
      dependencies: ['bank-fo-setup', 'bank-bo-setup', 'lc-user-setup', 'auditor-setup'],
      testMatch: /specs\/access-control\//,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
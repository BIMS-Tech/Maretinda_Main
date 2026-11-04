import { defineConfig, devices } from '@playwright/test'

/**
 * Targets the test environment by default (Vercel frontends on
 * test-api.maretinda.com). Point STORE_URL / SELLER_URL / ADMIN_URL at local
 * dev servers to run against your machine instead.
 *
 * Never aim this at production with E2E_ALLOW_WRITES=1: the write specs
 * register accounts and place orders.
 */
export const urls = {
  store: process.env.STORE_URL || 'https://teststore.maretinda.com',
  seller: process.env.SELLER_URL || 'https://testseller.maretinda.com',
  admin: process.env.ADMIN_URL || 'https://testadmin.maretinda.com',
}

export default defineConfig({
  testDir: './tests',
  // The Vercel test frontends cold-start in 20–90s.
  timeout: 180_000,
  expect: { timeout: 30_000 },
  retries: process.env.CI ? 2 : 1,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './global-setup.ts',
  use: {
    navigationTimeout: 120_000,
    actionTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'store', testDir: './tests/store', use: { ...devices['Desktop Chrome'], baseURL: urls.store } },
    {
      name: 'store-mobile',
      testDir: './tests/store',
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices['Pixel 7'], baseURL: urls.store },
    },
    { name: 'seller', testDir: './tests/seller', use: { ...devices['Desktop Chrome'], baseURL: urls.seller } },
    { name: 'admin', testDir: './tests/admin', use: { ...devices['Desktop Chrome'], baseURL: urls.admin } },
  ],
})

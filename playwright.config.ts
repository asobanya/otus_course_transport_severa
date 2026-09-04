import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,

  use: {
    baseURL: 'https://xn--80aaflb9bhhgedfdgh.xn--p1ai/#/',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  reporter: [['list'], ['html', { open: 'never' }]],
});
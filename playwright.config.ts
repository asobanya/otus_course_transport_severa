import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
import 'dotenv/config';

const reporters: ReporterDescription[] = [['list'], ['html', { open: 'never' }]];

if (process.env.TMS_SYNC === 'true') {
  reporters.push(['./scripts/tms-reporter.ts']);
}

const BASE_URL = process.env.BASE_URL ?? 'https://xn--80aaflb9bhhgedfdgh.xn--p1ai';

export default defineConfig({
  testDir: './tests',
  timeout: 10000,
  retries: 1,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'retain-on-failure',
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

  reporter: reporters,
});

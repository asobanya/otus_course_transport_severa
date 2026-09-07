import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
import 'dotenv/config';

const reporters: ReporterDescription[] = [['list'], ['html', { open: 'never' }]];

if (process.env.TMS_SYNC === 'true') {
  reporters.push(['./scripts/tms-reporter.ts']);
}

const BASE_URL = process.env.BASE_URL ?? 'https://dev-pub.altech.local/#/';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
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

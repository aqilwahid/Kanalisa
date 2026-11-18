import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.js',
  workers: 1,
  timeout: 45_000,
});

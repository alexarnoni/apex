import { defineConfig } from '@playwright/test';

const port = Number(process.env.BANDEIRADA_TEST_PORT ?? 5057);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Porta de teste inválida.');
const baseURL = `http://127.0.0.1:${port}`;
const serve = `node tools/serve.mjs dist ${port}`;

export default defineConfig({
  testDir: './tests/ui',
  outputDir: './test-results/playwright',
  timeout: 45_000,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    browserName: 'chromium',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: process.env.BANDEIRADA_TEST_PREBUILT === '1'
      ? serve
      : `node tools/build-ui.js && ${serve}`,
    url: baseURL,
    reuseExistingServer: false,
  },
});

// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:5555', // Ensure this matches your dev server's URL
    headless: true, // Run tests in headless mode
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'Chromium', use: { browserName: 'chromium' } },
    //{ name: 'Firefox', use: { browserName: 'firefox' } },
    //{ name: 'WebKit', use: { browserName: 'webkit' } },
  ],
  testIgnore: [
    'tests/unit/**/*',  // Ignore all files within the tests/unit/ directory
  ],
});

// tests/e2e/example.spec.js
const { test, expect } = require('@playwright/test');

test('should display the correct title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle("Example HTML pages");
});

test('should display "Hello, World!" text', async ({ page }) => {
  await page.goto('/');
  const content = await page.textContent('#app');
  expect(content).toBe('Hello, World!');
});

test('should have the right window.main.name', async ({ page }) => {
    // Navigate to your web app
    await page.goto('/');

    // Call the window.sum function with arguments and get the result
    const result = await page.evaluate(() => {
        return window.main.name;  // Call the global sum function
    });

    // Verify that the result is as expected
    expect(result).toBe("webgpu_volume");
});

/*
test('should correctly sum two numbers using window.main.async_sum', async ({ page }) => {
    // Navigate to your web app
    await page.goto('/');

    // Call the window.sum function with arguments and get the result
    const result = await page.evaluate(async () => {
        return await window.main.async_sum(3, 4);  // Call the global sum function
    });

    // Verify that the result is as expected
    expect(result).toBe(7);
});
*/

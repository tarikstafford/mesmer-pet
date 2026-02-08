import { test, expect } from '@playwright/test';

/**
 * Example E2E test to verify Playwright setup
 */
test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Verify page loads
    await expect(page).toHaveTitle(/Mesmer/);
  });

  test('should display main content', async ({ page }) => {
    await page.goto('/');

    // Verify page is visible and interactive
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Marketplace Transaction Flow
 * US-TEST-031: List and purchase pets on the marketplace
 */

test.describe('Marketplace Transaction Flow', () => {
  let sellerEmail: string;
  let buyerEmail: string;
  let sellerToken: string;
  let buyerToken: string;

  test.beforeAll(async ({ browser }) => {
    // Create two users: one seller and one buyer
    const context = await browser.newContext();
    const page = await context.newPage();

    // Register seller
    sellerEmail = `seller-${Date.now()}@example.com`;
    await page.goto('/auth/register');
    await page.fill('#name', 'Seller User');
    await page.fill('#email', sellerEmail);
    await page.fill('#password', 'SellerPass123!');
    await page.fill('#dateOfBirth', '1990-01-01');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/auth\/login/);

    // Login as seller
    await page.fill('#email', sellerEmail);
    await page.fill('#password', 'SellerPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    // Get seller token
    sellerToken = await page.evaluate(() => localStorage.getItem('authToken') || '');

    // Clear context
    await context.close();

    // Register buyer
    const buyerContext = await browser.newContext();
    const buyerPage = await buyerContext.newPage();

    buyerEmail = `buyer-${Date.now()}@example.com`;
    await buyerPage.goto('/auth/register');
    await buyerPage.fill('#name', 'Buyer User');
    await buyerPage.fill('#email', buyerEmail);
    await buyerPage.fill('#password', 'BuyerPass123!');
    await buyerPage.fill('#dateOfBirth', '1990-01-01');
    await buyerPage.click('button[type="submit"]');
    await buyerPage.waitForURL(/\/auth\/login/);

    // Login as buyer
    await buyerPage.fill('#email', buyerEmail);
    await buyerPage.fill('#password', 'BuyerPass123!');
    await buyerPage.click('button[type="submit"]');
    await buyerPage.waitForURL(/\/dashboard/);

    // Get buyer token
    buyerToken = await buyerPage.evaluate(() => localStorage.getItem('authToken') || '');

    await buyerContext.close();
  });

  test('should navigate to pet marketplace page', async ({ page }) => {
    // Set seller auth
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, sellerToken);

    await page.goto('/pets/marketplace');
    await expect(page).toHaveURL(/\/pets\/marketplace/);
    await expect(page.locator('text=/Pet Marketplace/i')).toBeVisible();
  });

  test('should show empty marketplace initially', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, sellerToken);

    await page.goto('/pets/marketplace');

    // Wait for loading to finish
    await page.waitForSelector('text=/No pets available/i', { timeout: 10000 });
    await expect(page.locator('text=/No pets available/i')).toBeVisible();
  });

  test('should create a pet for listing', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, sellerToken);

    // Navigate to pet creation
    await page.goto('/pets/create');
    await expect(page).toHaveURL(/\/pets\/create/);

    // Fill in pet name
    await page.fill('input[name="name"]', 'Marketplace Test Pet');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard or success
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Verify pet was created
    await expect(page.locator('text=/Marketplace Test Pet/i')).toBeVisible();
  });

  test('should navigate to my listings page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, sellerToken);

    await page.goto('/pets/marketplace/my-listings');
    await expect(page).toHaveURL(/\/pets\/marketplace\/my-listings/);
    await expect(page.locator('text=/My Listings/i')).toBeVisible();
  });

  test('should show create listing form', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, sellerToken);

    await page.goto('/pets/marketplace/my-listings');

    // Check for form elements
    await expect(page.locator('text=/Create New Listing/i')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
    await expect(page.locator('input[type="number"]')).toBeVisible();
  });

  test('should list a pet on the marketplace', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, sellerToken);

    await page.goto('/pets/marketplace/my-listings');

    // Select the pet
    const petSelect = page.locator('select').first();
    await petSelect.waitFor({ state: 'visible' });

    // Get the first available pet option (not the placeholder)
    const options = await petSelect.locator('option').all();
    if (options.length > 1) {
      const firstPetValue = await options[1].getAttribute('value');
      if (firstPetValue) {
        await petSelect.selectOption(firstPetValue);
      }
    }

    // Enter price
    await page.fill('input[type="number"]', '100');

    // Submit listing
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('text=/listed successfully/i')).toBeVisible({ timeout: 10000 });
  });

  test('should see listing in my listings section', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, sellerToken);

    await page.goto('/pets/marketplace/my-listings');

    // Wait for listings to load
    await page.waitForSelector('text=/Your Active Listings/i');

    // Should see the listing
    await expect(page.locator('text=/Active/i')).toBeVisible();
    await expect(page.locator('text=/100 coins/i')).toBeVisible();
  });

  test('buyer should see listing on marketplace', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, buyerToken);

    await page.goto('/pets/marketplace');

    // Wait for listings to load
    await page.waitForTimeout(2000);

    // Should see at least one listing
    const listingCards = page.locator('[data-testid="marketplace-card"]');
    await expect(listingCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('buyer should see purchase button', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, buyerToken);

    await page.goto('/pets/marketplace');

    // Wait for listings to load
    await page.waitForTimeout(2000);

    // Should see Buy Now button (buyer has 0 coins initially, so it might be disabled)
    const purchaseButton = page.locator('[data-testid="purchase-button"]').first();
    await expect(purchaseButton).toBeVisible({ timeout: 10000 });
  });

  test('buyer with insufficient funds should see disabled button', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, buyerToken);

    await page.goto('/pets/marketplace');

    // Wait for listings to load
    await page.waitForTimeout(2000);

    // Button should show "Insufficient Funds" since buyer has 0 coins
    await expect(page.locator('text=/Insufficient Funds/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('seller cannot purchase their own listing', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, sellerToken);

    await page.goto('/pets/marketplace');

    // Wait for listings to load
    await page.waitForTimeout(2000);

    // Should see "Your Listing" button
    await expect(page.locator('text=/Your Listing/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should cancel a listing', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, sellerToken);

    await page.goto('/pets/marketplace/my-listings');

    // Wait for listings to load
    await page.waitForSelector('text=/Your Active Listings/i');

    // Find and click cancel button
    const cancelButton = page.locator('button', { hasText: /Cancel Listing/i }).first();
    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Wait for success message
      await expect(page.locator('text=/cancelled successfully/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('cancelled listing should not appear on marketplace', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, buyerToken);

    await page.goto('/pets/marketplace');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Should show no listings available
    await expect(page.locator('text=/No pets available/i')).toBeVisible({ timeout: 10000 });
  });

  test('should show back to dashboard button', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, sellerToken);

    await page.goto('/pets/marketplace');

    const backButton = page.locator('button', { hasText: /Back to Dashboard/i });
    await expect(backButton).toBeVisible();
  });

  test('should show user balance on marketplace page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
    }, buyerToken);

    await page.goto('/pets/marketplace');

    // Should show user balance
    await expect(page.locator('text=/Your Balance/i')).toBeVisible();
    await expect(page.locator('text=/coins/i')).toBeVisible();
  });
});

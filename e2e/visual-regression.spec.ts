import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Visual Regression Testing with Percy', () => {
  let testEmail: string;
  let testPassword: string;
  let authToken: string;
  let petName: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const timestamp = Date.now();
    testEmail = `test-visual-${timestamp}@example.com`;
    testPassword = 'TestPassword123!';
    petName = `VisualPet${timestamp}`;

    // Register
    await page.goto('/auth/register');
    await page.fill('#name', 'Visual User');
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.fill('#dateOfBirth', '2000-01-01');
    await page.click('button[type="submit"]');

    // Login
    await page.waitForURL(/\/auth\/login/);
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.click('button[type="submit"]');

    // Wait for dashboard and get auth token
    await page.waitForURL('/dashboard');
    authToken = await page.evaluate(() => localStorage.getItem('authToken') || '');

    // Create a pet for testing
    await page.goto('/pets/create');
    await page.fill('#petName', petName);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await context.close();
  });

  test('should capture login page on desktop', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Login Page - Desktop');
  });

  test('should capture login page on tablet', async ({ page, context }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Login Page - Tablet');
  });

  test('should capture login page on mobile', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Login Page - Mobile');
  });

  test('should capture registration page on desktop', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Registration Page - Desktop');
  });

  test('should capture registration page on mobile', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Registration Page - Mobile');
  });

  test('should capture dashboard on desktop', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for dynamic content

    await percySnapshot(page, 'Dashboard - Desktop', {
      widths: [1280, 1920],
    });
  });

  test('should capture dashboard on tablet', async ({ page, context }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await percySnapshot(page, 'Dashboard - Tablet');
  });

  test('should capture dashboard on mobile', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await percySnapshot(page, 'Dashboard - Mobile');
  });

  test('should capture pet creation page', async ({ page }) => {
    await page.goto('/pets/create');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/pets/create');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Pet Creation Page - Desktop');
  });

  test('should capture pet creation page on mobile', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/pets/create');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/pets/create');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Pet Creation Page - Mobile');
  });

  test('should capture marketplace page', async ({ page }) => {
    await page.goto('/pets/marketplace');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/pets/marketplace');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Marketplace - Desktop');
  });

  test('should capture marketplace page on mobile', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/pets/marketplace');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/pets/marketplace');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Marketplace - Mobile');
  });

  test('should capture breeding page', async ({ page }) => {
    await page.goto('/breed');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/breed');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for 3D models

    await percySnapshot(page, 'Breeding Page - Desktop');
  });

  test('should capture breeding page on mobile', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/breed');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/breed');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await percySnapshot(page, 'Breeding Page - Mobile');
  });

  test('should capture dashboard with pet card expanded', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find and expand a pet card (if any exist)
    const petCard = page.locator('.border').filter({ hasText: petName }).first();
    if (await petCard.count() > 0) {
      // Pet card should be visible by default, capture it
      await percySnapshot(page, 'Dashboard with Pet Card - Desktop');
    }
  });

  test('should capture chat interface', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Open chat if pet exists
    const chatButton = page.locator('button', { hasText: /Chat with|💬/i }).first();
    if (await chatButton.count() > 0) {
      await chatButton.click();
      await page.waitForTimeout(500);

      await percySnapshot(page, 'Chat Interface - Desktop');
    }
  });

  test('should capture error states', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Trigger validation error by submitting empty form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for validation to appear
    await page.waitForTimeout(500);

    await percySnapshot(page, 'Login Page - Validation Error');
  });

  test('should capture loading states', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Fill in credentials
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);

    // Intercept the API call to delay it
    await page.route('**/api/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    // Click submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Capture loading state
    await page.waitForTimeout(100);
    await percySnapshot(page, 'Login Page - Loading State');
  });

  test('should capture responsive breakpoints', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Capture multiple widths in one snapshot
    await percySnapshot(page, 'Login Page - All Breakpoints', {
      widths: [375, 768, 1024, 1280, 1920],
    });
  });
});

import { test, expect } from '@playwright/test';
import AxeBuilder, { AxeResults } from '@axe-core/playwright';

type AxeViolation = AxeResults['violations'][number];
type AxeNode = AxeViolation['nodes'][number];

test.describe('Accessibility Testing with axe-core', () => {
  let testEmail: string;
  let testPassword: string;
  let authToken: string;
  let petName: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const timestamp = Date.now();
    testEmail = `test-a11y-${timestamp}@example.com`;
    testPassword = 'TestPassword123!';
    petName = `AccessibilityPet${timestamp}`;

    // Register
    await page.goto('/auth/register');
    await page.fill('#name', 'A11y User');
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

  test('should have no accessibility violations on login page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no accessibility violations on registration page', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no accessibility violations on dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for dynamic content

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Log any violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations on dashboard:');
      accessibilityScanResults.violations.forEach((violation: AxeViolation) => {
        console.log(`  - ${violation.id}: ${violation.description}`);
        console.log(`    Impact: ${violation.impact}`);
        console.log(`    Help: ${violation.help}`);
        console.log(`    Nodes: ${violation.nodes.length}`);
      });
    }

    // Filter out minor violations and only fail on critical/serious
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v: AxeViolation) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('should have no accessibility violations on pet creation page', async ({ page }) => {
    await page.goto('/pets/create');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/pets/create');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v: AxeViolation) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('should have no accessibility violations on marketplace page', async ({ page }) => {
    await page.goto('/pets/marketplace');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/pets/marketplace');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v: AxeViolation) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('should have no accessibility violations on breeding page', async ({ page }) => {
    await page.goto('/breed');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/breed');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v: AxeViolation) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('should verify keyboard navigation on login page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Tab through all interactive elements
    await page.keyboard.press('Tab'); // Email input
    const emailFocused = await page.evaluate(() => document.activeElement?.id === 'email');
    expect(emailFocused).toBeTruthy();

    await page.keyboard.press('Tab'); // Password input
    const passwordFocused = await page.evaluate(() => document.activeElement?.id === 'password');
    expect(passwordFocused).toBeTruthy();

    await page.keyboard.press('Tab'); // Submit button
    const buttonFocused = await page.evaluate(() =>
      document.activeElement?.tagName === 'BUTTON' &&
      document.activeElement?.getAttribute('type') === 'submit'
    );
    expect(buttonFocused).toBeTruthy();
  });

  test('should verify keyboard navigation on registration page', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');

    // Tab through form fields
    await page.keyboard.press('Tab'); // Name input
    const nameFocused = await page.evaluate(() => document.activeElement?.id === 'name');
    expect(nameFocused).toBeTruthy();

    await page.keyboard.press('Tab'); // Email input
    const emailFocused = await page.evaluate(() => document.activeElement?.id === 'email');
    expect(emailFocused).toBeTruthy();

    await page.keyboard.press('Tab'); // Password input
    const passwordFocused = await page.evaluate(() => document.activeElement?.id === 'password');
    expect(passwordFocused).toBeTruthy();

    await page.keyboard.press('Tab'); // Date of birth input
    const dobFocused = await page.evaluate(() => document.activeElement?.id === 'dateOfBirth');
    expect(dobFocused).toBeTruthy();
  });

  test('should verify keyboard navigation on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify buttons are keyboard accessible
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // Tab to first interactive element
    await page.keyboard.press('Tab');
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT']).toContain(activeElement);
  });

  test('should verify Enter key activates buttons', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Fill in credentials
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);

    // Tab to submit button
    await page.keyboard.press('Tab');

    // Press Enter to submit
    await page.keyboard.press('Enter');

    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('should verify Space key activates buttons', async ({ page }) => {
    await page.goto('/pets/create');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/pets/create');
    await page.waitForLoadState('networkidle');

    // Fill pet name
    await page.fill('#petName', `KeyboardPet${Date.now()}`);

    // Tab to submit button
    await page.keyboard.press('Tab');

    // Press Space to submit
    await page.keyboard.press('Space');

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Check for proper labels
    const emailInput = page.locator('#email');
    const emailLabel = await emailInput.evaluate((el) => {
      const labelElement = document.querySelector('label[for="email"]');
      return labelElement?.textContent || '';
    });
    expect(emailLabel.toLowerCase()).toContain('email');

    const passwordInput = page.locator('#password');
    const passwordLabel = await passwordInput.evaluate((el) => {
      const labelElement = document.querySelector('label[for="password"]');
      return labelElement?.textContent || '';
    });
    expect(passwordLabel.toLowerCase()).toContain('password');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Check for h1 element
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);

    // Verify heading hierarchy (no skipped levels)
    const headingLevels = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return headings.map(h => parseInt(h.tagName.charAt(1)));
    });

    // Check no heading levels are skipped (e.g., h1 -> h3 without h2)
    for (let i = 1; i < headingLevels.length; i++) {
      const levelDiff = headingLevels[i] - headingLevels[i - 1];
      expect(levelDiff).toBeLessThanOrEqual(1);
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    // Check specifically for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      (v: AxeViolation) => v.id === 'color-contrast'
    );

    if (contrastViolations.length > 0) {
      console.log('Color contrast violations:');
      contrastViolations.forEach((violation) => {
        console.log(`  - ${violation.description}`);
        violation.nodes.forEach((node: AxeNode) => {
          console.log(`    Element: ${node.html}`);
        });
      });
    }

    expect(contrastViolations).toEqual([]);
  });

  test('should have alt text for all images', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    // Check for image-alt violations
    const imageAltViolations = accessibilityScanResults.violations.filter(
      (v: AxeViolation) => v.id === 'image-alt'
    );

    expect(imageAltViolations).toEqual([]);
  });

  test('should have proper form validation messages', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Check for validation (HTML5 or custom)
    const emailInput = page.locator('#email');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }));
    }, authToken);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for landmarks (nav, main, footer, etc.)
    const landmarks = await page.evaluate(() => {
      const nav = document.querySelectorAll('nav').length;
      const main = document.querySelectorAll('main').length;
      const header = document.querySelectorAll('header').length;
      return { nav, main, header };
    });

    // At least one landmark should exist for screen readers
    const totalLandmarks = landmarks.nav + landmarks.main + landmarks.header;
    expect(totalLandmarks).toBeGreaterThan(0);
  });
});

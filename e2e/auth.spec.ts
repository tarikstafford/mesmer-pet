import { test, expect } from '@playwright/test';

test.describe('User Registration and Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test('should show validation errors for invalid registration input', async ({ page }) => {
    await page.goto('/auth/register');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Form validation should prevent submission (HTML5 validation)
    // The button should still be visible and page should not navigate
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('#name', 'Test User');
    await page.fill('#email', 'invalid-email');
    await page.fill('#password', 'TestPassword123!');
    await page.fill('#dateOfBirth', '1990-01-01');
    await page.click('button[type="submit"]');

    // HTML5 validation should prevent form submission
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('should show error for weak password', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('#name', 'Test User');
    await page.fill('#email', `test-${Date.now()}@example.com`);
    await page.fill('#password', '123'); // Too weak
    await page.fill('#dateOfBirth', '1990-01-01');
    await page.click('button[type="submit"]');

    // Should show password validation error from API
    await expect(page.locator('text=/password/i')).toBeVisible();
  });

  test('should show age warning for users under 13', async ({ page }) => {
    await page.goto('/auth/register');

    // Calculate a date that makes the user 10 years old
    const today = new Date();
    const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    const dateOfBirth = tenYearsAgo.toISOString().split('T')[0];

    await page.fill('#name', 'Young User');
    await page.fill('#email', `young-${Date.now()}@example.com`);
    await page.fill('#password', 'TestPassword123!');
    await page.fill('#dateOfBirth', dateOfBirth);
    await page.click('button[type="submit"]');

    // Should show age warning for COPPA compliance
    await expect(page.locator('text=/Users under 13 require parental consent/i')).toBeVisible();
  });

  test('should successfully register a new user', async ({ page }) => {
    await page.goto('/auth/register');

    const testUser = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      dateOfBirth: '1990-01-01',
    };

    // Fill in registration form
    await page.fill('#name', testUser.name);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#dateOfBirth', testUser.dateOfBirth);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to login page after successful registration
    await expect(page).toHaveURL(/\/auth\/login/);

    // Should show registered message
    await expect(page).toHaveURL(/registered=true/);
  });

  test('should show error when registering with duplicate email', async ({ page }) => {
    const testUser = {
      name: 'Test User',
      email: `test-duplicate-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      dateOfBirth: '1990-01-01',
    };

    // First registration
    await page.goto('/auth/register');
    await page.fill('#name', testUser.name);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#dateOfBirth', testUser.dateOfBirth);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/auth\/login/);

    // Log out by clearing cookies
    await page.context().clearCookies();

    // Try to register again with same email
    await page.goto('/auth/register');
    await page.fill('#name', 'Another User');
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#dateOfBirth', testUser.dateOfBirth);
    await page.click('button[type="submit"]');

    // Should show duplicate email error
    await expect(page.locator('text=/already.*exist/i')).toBeVisible();
  });

  test('should successfully log in with valid credentials', async ({ page }) => {
    const testUser = {
      name: 'Test User',
      email: `test-login-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      dateOfBirth: '1990-01-01',
    };

    // First register the user
    await page.goto('/auth/register');
    await page.fill('#name', testUser.name);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#dateOfBirth', testUser.dateOfBirth);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/auth\/login/);

    // Now log in
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('#email', 'nonexistent@example.com');
    await page.fill('#password', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should show invalid credentials error
    await expect(page.locator('text=/Invalid email or password/i')).toBeVisible();
  });

  test('should show error for wrong password', async ({ page }) => {
    const testUser = {
      name: 'Test User',
      email: `test-wrong-pw-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      dateOfBirth: '1990-01-01',
    };

    // First register the user
    await page.goto('/auth/register');
    await page.fill('#name', testUser.name);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#dateOfBirth', testUser.dateOfBirth);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/auth\/login/);

    // Log out by clearing cookies
    await page.context().clearCookies();

    // Try to log in with wrong password
    await page.goto('/auth/login');
    await page.fill('#email', testUser.email);
    await page.fill('#password', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should show invalid credentials error
    await expect(page.locator('text=/Invalid email or password/i')).toBeVisible();
  });

  test('should persist session across page refresh', async ({ page }) => {
    const testUser = {
      name: 'Test User',
      email: `test-session-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      dateOfBirth: '1990-01-01',
    };

    // Register and log in
    await page.goto('/auth/register');
    await page.fill('#name', testUser.name);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#dateOfBirth', testUser.dateOfBirth);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/auth\/login/);

    // Log in
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Refresh the page
    await page.reload();

    // Should still be on dashboard and logged in
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should be able to log out', async ({ page }) => {
    const testUser = {
      name: 'Test User',
      email: `test-logout-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      dateOfBirth: '1990-01-01',
    };

    // Register and log in
    await page.goto('/auth/register');
    await page.fill('#name', testUser.name);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#dateOfBirth', testUser.dateOfBirth);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/auth\/login/);

    // Log in
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Logout"), a:has-text("Log out"), a:has-text("Logout")').first();
    await logoutButton.click();

    // Should redirect to home/login page
    await expect(page).toHaveURL(/\/(auth\/login|login|$)/);

    // Try to access dashboard - should redirect to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login|\/login/);
  });

  test('should redirect to login when accessing protected routes without auth', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();

    // Try to access dashboard
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login|\/login/);
  });

  test('should navigate between register and login pages', async ({ page }) => {
    await page.goto('/auth/login');

    // Find link to register page
    const registerLink = page.locator('a:has-text("Register"), a:has-text("Sign up"), a:has-text("Create account")').first();
    await registerLink.click();

    // Should be on register page
    await expect(page).toHaveURL(/\/auth\/register|\/register/);

    // Find link back to login page
    const loginLink = page.locator('a:has-text("Login"), a:has-text("Sign in"), a:has-text("Already have")').first();
    await loginLink.click();

    // Should be back on login page
    await expect(page).toHaveURL(/\/auth\/login|\/login/);
  });

  test('should show loading state during registration', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('#name', 'Test User');
    await page.fill('#email', `test-loading-reg-${Date.now()}@example.com`);
    await page.fill('#password', 'TestPassword123!');
    await page.fill('#dateOfBirth', '1990-01-01');

    // Click submit and immediately check for loading state
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Button should be disabled during submission
    await expect(submitButton).toBeDisabled();
  });

  test('should show loading state during login', async ({ page }) => {
    const testUser = {
      name: 'Test User',
      email: `test-loading-login-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      dateOfBirth: '1990-01-01',
    };

    // First register the user
    await page.goto('/auth/register');
    await page.fill('#name', testUser.name);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#dateOfBirth', testUser.dateOfBirth);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/auth\/login/);

    // Now log in
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);

    // Click submit and immediately check for loading state
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Button should be disabled during submission
    await expect(submitButton).toBeDisabled();
  });
});

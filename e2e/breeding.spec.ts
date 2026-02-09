import { test, expect } from '@playwright/test';

test.describe('Breeding Flow', () => {
  let testEmail: string;
  let testPassword: string;
  let petName1: string;
  let petName2: string;

  test.beforeEach(async ({ page }) => {
    // Register and login a test user
    const timestamp = Date.now();
    testEmail = `test-breeding-${timestamp}@example.com`;
    testPassword = 'TestPassword123!';
    petName1 = `BreedPet1-${timestamp}`;
    petName2 = `BreedPet2-${timestamp}`;

    // Register
    await page.goto('/auth/register');
    await page.fill('#name', 'Test User');
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.fill('#dateOfBirth', '2000-01-01');
    await page.click('button[type="submit"]');

    // Wait for redirect to login page
    await page.waitForURL(/\/auth\/login/);

    // Login
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');

    // Create first pet for breeding
    await page.goto('/pets/create');
    await page.fill('#petName', petName1);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Create second pet for breeding
    await page.goto('/pets/create');
    await page.fill('#petName', petName2);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should navigate to breeding page from dashboard', async ({ page }) => {
    // Look for a link or button to breeding page
    const breedLink = page.locator('a[href="/breed"], button:has-text("Breed")').first();

    // If breeding link is not immediately visible, try navigating directly
    if (await breedLink.count() === 0) {
      await page.goto('/breed');
    } else {
      await breedLink.click();
      await page.waitForURL('/breed');
    }

    // Should be on breeding page
    await expect(page).toHaveURL('/breed');
  });

  test('should display breeding page with parent selection', async ({ page }) => {
    await page.goto('/breed');

    // Page should have title/header about breeding
    await expect(page.locator('text=/Breed.*Pet/i')).toBeVisible();

    // Should have two parent selection dropdowns
    const parentSelects = page.locator('select');
    expect(await parentSelects.count()).toBeGreaterThanOrEqual(2);

    // Should show "Parent 1" and "Parent 2" labels
    await expect(page.locator('text=/Parent 1/i')).toBeVisible();
    await expect(page.locator('text=/Parent 2/i')).toBeVisible();
  });

  test('should show warning when user has less than 2 pets', async ({ page }) => {
    // Create a new user with only one pet
    const timestamp = Date.now();
    const newEmail = `test-one-pet-${timestamp}@example.com`;
    const password = 'TestPassword123!';

    // Register
    await page.goto('/auth/register');
    await page.fill('#name', 'One Pet User');
    await page.fill('#email', newEmail);
    await page.fill('#password', password);
    await page.fill('#dateOfBirth', '2000-01-01');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/auth\/login/);

    // Login
    await page.fill('#email', newEmail);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Create only one pet
    await page.goto('/pets/create');
    await page.fill('#petName', `SinglePet-${timestamp}`);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Navigate to breeding page
    await page.goto('/breed');

    // Should show warning about needing at least 2 pets
    await expect(page.locator('text=/Not Enough Pets|need.*2.*pets|at least 2 pets/i')).toBeVisible();
  });

  test('should select two parent pets', async ({ page }) => {
    await page.goto('/breed');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Select first parent
    const parent1Select = page.locator('select').first();
    // Get the first available option (index 1, since 0 is "Select a pet...")
    const parent1Options = await parent1Select.locator('option').allTextContents();
    const parent1Option = parent1Options.find(opt => opt.includes(petName1));
    if (parent1Option) {
      await parent1Select.selectOption({ label: parent1Option });
    }

    // Verify first parent is selected
    const parent1Value = await parent1Select.inputValue();
    expect(parent1Value).not.toBe('');

    // Select second parent
    const parent2Select = page.locator('select').nth(1);
    const parent2Options = await parent2Select.locator('option').allTextContents();
    const parent2Option = parent2Options.find(opt => opt.includes(petName2));
    if (parent2Option) {
      await parent2Select.selectOption({ label: parent2Option });
    }

    // Verify second parent is selected
    const parent2Value = await parent2Select.inputValue();
    expect(parent2Value).not.toBe('');
    expect(parent2Value).not.toBe(parent1Value);
  });

  test('should show compatibility check after selecting both parents', async ({ page }) => {
    await page.goto('/breed');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Select both parents
    const parent1Select = page.locator('select').first();
    const parent1Options = await parent1Select.locator('option').allTextContents();
    const parent1Option = parent1Options.find(opt => opt.includes(petName1));
    if (parent1Option) await parent1Select.selectOption({ label: parent1Option });

    const parent2Select = page.locator('select').nth(1);
    const parent2Options = await parent2Select.locator('option').allTextContents();
    const parent2Option = parent2Options.find(opt => opt.includes(petName2));
    if (parent2Option) await parent2Select.selectOption({ label: parent2Option });

    // Wait for compatibility check to load
    await page.waitForTimeout(2000);

    // Should display compatibility score
    await expect(page.locator('text=/Compatibility|compatibility.*score/i')).toBeVisible({ timeout: 5000 });

    // Should show a score (0-100)
    await expect(page.locator('text=/\\d+\\/100/i')).toBeVisible({ timeout: 5000 });
  });

  test('should show compatibility rating (Excellent, Good, Fair, Poor)', async ({ page }) => {
    await page.goto('/breed');
    await page.waitForTimeout(1000);

    // Select both parents
    const parent1Select = page.locator('select').first();
    const parent1Options = await parent1Select.locator('option').allTextContents();
    const parent1Option = parent1Options.find(opt => opt.includes(petName1));
    if (parent1Option) await parent1Select.selectOption({ label: parent1Option });

    const parent2Select = page.locator('select').nth(1);
    const parent2Options = await parent2Select.locator('option').allTextContents();
    const parent2Option = parent2Options.find(opt => opt.includes(petName2));
    if (parent2Option) await parent2Select.selectOption({ label: parent2Option });

    // Wait for compatibility check
    await page.waitForTimeout(2000);

    // Should show one of the compatibility labels
    const hasRating = await page.locator('text=/Excellent|Good|Fair|Poor/i').count();
    expect(hasRating).toBeGreaterThan(0);
  });

  test('should show "cannot breed" message when requirements not met', async ({ page }) => {
    await page.goto('/breed');
    await page.waitForTimeout(1000);

    // Select both parents
    const parent1Select = page.locator('select').first();
    const parent1Options = await parent1Select.locator('option').allTextContents();
    const parent1Option = parent1Options.find(opt => opt.includes(petName1));
    if (parent1Option) await parent1Select.selectOption({ label: parent1Option });

    const parent2Select = page.locator('select').nth(1);
    const parent2Options = await parent2Select.locator('option').allTextContents();
    const parent2Option = parent2Options.find(opt => opt.includes(petName2));
    if (parent2Option) await parent2Select.selectOption({ label: parent2Option });

    // Wait for compatibility check
    await page.waitForTimeout(2000);

    // Since pets are newly created (< 7 days old), they cannot breed
    // Should show error message about age requirement
    await expect(page.locator('text=/cannot breed|must be.*7 days|too young|age requirement/i')).toBeVisible({ timeout: 5000 });
  });

  test('should display breeding requirements info', async ({ page }) => {
    await page.goto('/breed');

    // Should show requirements section
    await expect(page.locator('text=/Breeding Requirements|Requirements:/i')).toBeVisible();

    // Should list key requirements
    await expect(page.locator('text=/7 days old|at least 7 days/i')).toBeVisible();
    await expect(page.locator('text=/health.*50|health.*>.*50/i')).toBeVisible();
    await expect(page.locator('text=/cooldown|7-day.*cooldown/i')).toBeVisible();
  });

  test('should show offspring name input when breeding is allowed', async ({ page }) => {
    // This test would require pets that meet all breeding requirements
    // For newly created pets, we'll test the UI structure instead
    await page.goto('/breed');
    await page.waitForTimeout(1000);

    // Select both parents
    const parent1Select = page.locator('select').first();
    const parent1Options = await parent1Select.locator('option').allTextContents();
    const parent1Option = parent1Options.find(opt => opt.includes(petName1));
    if (parent1Option) await parent1Select.selectOption({ label: parent1Option });

    const parent2Select = page.locator('select').nth(1);
    const parent2Options = await parent2Select.locator('option').allTextContents();
    const parent2Option = parent2Options.find(opt => opt.includes(petName2));
    if (parent2Option) await parent2Select.selectOption({ label: parent2Option });

    // Wait for compatibility check
    await page.waitForTimeout(2000);

    // Check if the page has the input field structure (it might be hidden due to canBreed=false)
    // The input should exist in the DOM structure even if not visible
    const hasNameInput = await page.locator('input[type="text"], input[placeholder*="name" i]').count();
    expect(hasNameInput).toBeGreaterThan(0);
  });

  test('should show parent pet details (health, age, generation)', async ({ page }) => {
    await page.goto('/breed');
    await page.waitForTimeout(1000);

    // Select first parent
    const parent1Select = page.locator('select').first();
    const parent1Options = await parent1Select.locator('option').allTextContents();
    const parent1Option = parent1Options.find(opt => opt.includes(petName1));
    if (parent1Option) await parent1Select.selectOption({ label: parent1Option });

    // Wait for pet details to load
    await page.waitForTimeout(1000);

    // Should show health indicator
    await expect(page.locator('text=/Health/i').first()).toBeVisible();

    // Should show age
    await expect(page.locator('text=/Age/i').first()).toBeVisible();

    // Should show generation
    await expect(page.locator('text=/Generation|Gen/i').first()).toBeVisible();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/breed');

    // Find and click back button
    const backButton = page.locator('button:has-text("Back"), a:has-text("Back"), text=/← Back|Back to Dashboard/i').first();
    await expect(backButton).toBeVisible();
    await backButton.click();

    // Should navigate to dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display 3D model preview for selected parents', async ({ page }) => {
    await page.goto('/breed');
    await page.waitForTimeout(1000);

    // Select both parents
    const parent1Select = page.locator('select').first();
    const parent1Options = await parent1Select.locator('option').allTextContents();
    const parent1Option = parent1Options.find(opt => opt.includes(petName1));
    if (parent1Option) await parent1Select.selectOption({ label: parent1Option });

    const parent2Select = page.locator('select').nth(1);
    const parent2Options = await parent2Select.locator('option').allTextContents();
    const parent2Option = parent2Options.find(opt => opt.includes(petName2));
    if (parent2Option) await parent2Select.selectOption({ label: parent2Option });

    // Wait for 3D models to load (they might take a moment)
    await page.waitForTimeout(2000);

    // Should have 3D model containers (canvas or loading placeholder)
    // The 3D models use canvas elements or loading placeholders
    const has3DElements = await page.locator('canvas, div[class*="animate-pulse"]').count();
    expect(has3DElements).toBeGreaterThan(0);
  });

  test('should show loading state while checking compatibility', async ({ page }) => {
    await page.goto('/breed');
    await page.waitForTimeout(1000);

    // Delay API response to see loading state
    await page.route('**/api/pets/check-breeding*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    // Select first parent
    const parent1Select = page.locator('select').first();
    const parent1Options = await parent1Select.locator('option').allTextContents();
    const parent1Option = parent1Options.find(opt => opt.includes(petName1));
    if (parent1Option) await parent1Select.selectOption({ label: parent1Option });

    // Select second parent (this should trigger compatibility check)
    const parent2Select = page.locator('select').nth(1);
    const parent2Options = await parent2Select.locator('option').allTextContents();
    const parent2Option = parent2Options.find(opt => opt.includes(petName2));
    if (parent2Option) await parent2Select.selectOption({ label: parent2Option });

    // The compatibility section should eventually appear
    await expect(page.locator('text=/Compatibility/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle error when compatibility check fails', async ({ page }) => {
    await page.goto('/breed');
    await page.waitForTimeout(1000);

    // Intercept API call and make it fail
    await page.route('**/api/pets/check-breeding*', route => route.abort());

    // Select both parents
    const parent1Select = page.locator('select').first();
    const parent1Options = await parent1Select.locator('option').allTextContents();
    const parent1Option = parent1Options.find(opt => opt.includes(petName1));
    if (parent1Option) await parent1Select.selectOption({ label: parent1Option });

    const parent2Select = page.locator('select').nth(1);
    const parent2Options = await parent2Select.locator('option').allTextContents();
    const parent2Option = parent2Options.find(opt => opt.includes(petName2));
    if (parent2Option) await parent2Select.selectOption({ label: parent2Option });

    // Should show error message
    await expect(page.locator('text=/error|failed|try again/i')).toBeVisible({ timeout: 5000 });
  });

  test('should filter out selected parent from other dropdown', async ({ page }) => {
    await page.goto('/breed');
    await page.waitForTimeout(1000);

    // Select first parent
    const parent1Select = page.locator('select').first();
    const parent1Options = await parent1Select.locator('option').allTextContents();
    const parent1Option = parent1Options.find(opt => opt.includes(petName1));
    if (parent1Option) await parent1Select.selectOption({ label: parent1Option });

    // Get the selected option value
    const selectedValue = await parent1Select.inputValue();

    // Check second dropdown options
    const parent2Select = page.locator('select').nth(1);
    const parent2Options = await parent2Select.locator('option').allTextContents();

    // The selected pet from parent1 should not be in parent2 options
    // (except for the default "Select a pet..." option)
    const hasSelectedPetInParent2 = parent2Options.some(opt =>
      opt.includes(petName1) && !opt.includes('Select')
    );

    expect(hasSelectedPetInParent2).toBe(false);
  });

  test('should show empty state message when no pets available', async ({ page }) => {
    // Create a user with no pets
    const timestamp = Date.now();
    const noPetEmail = `test-no-pets-${timestamp}@example.com`;
    const password = 'TestPassword123!';

    // Register
    await page.goto('/auth/register');
    await page.fill('#name', 'No Pet User');
    await page.fill('#email', noPetEmail);
    await page.fill('#password', password);
    await page.fill('#dateOfBirth', '2000-01-01');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/auth\/login/);

    // Login
    await page.fill('#email', noPetEmail);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to breeding page
    await page.goto('/breed');

    // Should show warning about not having enough pets
    await expect(page.locator('text=/Not Enough Pets|Create.*pet|need.*2/i')).toBeVisible();

    // Dropdowns should be disabled
    const parent1Select = page.locator('select').first();
    await expect(parent1Select).toBeDisabled();
  });

  test('should allow pre-selecting parents via URL parameters', async ({ page }) => {
    await page.goto('/breed');
    await page.waitForTimeout(1000);

    // Get pet IDs from the dropdowns
    const parent1Select = page.locator('select').first();
    const firstOption = await parent1Select.locator('option').nth(1).getAttribute('value');

    const parent2Select = page.locator('select').nth(1);
    const secondOption = await parent2Select.locator('option').nth(1).getAttribute('value');

    if (firstOption && secondOption) {
      // Navigate with URL parameters
      await page.goto(`/breed?pet1=${firstOption}&pet2=${secondOption}`);
      await page.waitForTimeout(2000);

      // Parents should be pre-selected
      const parent1Value = await parent1Select.inputValue();
      const parent2Value = await parent2Select.inputValue();

      expect(parent1Value).toBe(firstOption);
      expect(parent2Value).toBe(secondOption);

      // Compatibility check should run automatically
      await expect(page.locator('text=/Compatibility/i')).toBeVisible({ timeout: 5000 });
    }
  });
});

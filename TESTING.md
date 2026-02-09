# Testing Documentation

This document provides comprehensive testing documentation for the Mesmer Pet App project.

## Table of Contents
- [Testing Strategy](#testing-strategy)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)

## Testing Strategy

Our testing strategy follows the Testing Pyramid approach:

```
        /\
       /  \      E2E Tests (Few)
      /----\     - Visual Regression
     /      \    - Accessibility
    /--------\   - User Flows
   /          \
  /------------\ Integration Tests (Some)
 /              \ - API Routes
/________________\ Unit Tests (Many)
                   - Components
                   - Utilities
                   - Business Logic
```

### Goals
1. **100% Code Coverage**: All code paths tested
2. **Fast Feedback**: Unit tests run in < 5 seconds
3. **Confidence**: E2E tests validate critical user flows
4. **Maintainability**: Tests are readable and easy to update

## Test Types

### 1. Unit Tests (Vitest)
Test individual functions, components, and modules in isolation.

**Location**: `src/__tests__/**/*.test.ts(x)`

**Coverage**:
- Components: PetCard, StatBar, TraitBadge, ChatInterface, etc.
- Utilities: Auth helpers, genetics, stat degradation
- Business Logic: Marketplace transactions, breeding mechanics

### 2. Integration Tests (Vitest)
Test API routes and database interactions.

**Location**: `src/__tests__/api/**/*.test.ts`

**Coverage**:
- Auth API: Register, login, profile
- Pets API: CRUD operations, feeding
- Breeding API: Compatibility checks, offspring generation
- Marketplace API: Listings, purchases, cancellations
- Chat API: AI responses, memory persistence

### 3. End-to-End Tests (Playwright)
Test complete user flows in a real browser.

**Location**: `e2e/**/*.spec.ts`

**Coverage**:
- User registration and login
- Pet creation and management
- Breeding flow
- Marketplace transactions
- Chat with AI pets

### 4. Visual Regression Tests (Percy)
Capture and compare screenshots to detect UI changes.

**Location**: `e2e/visual-regression.spec.ts`

**Coverage**: All major pages across responsive breakpoints

See [VISUAL_REGRESSION.md](./VISUAL_REGRESSION.md) for details.

### 5. Accessibility Tests (axe-core)
Ensure WCAG 2.0/2.1 AA compliance.

**Location**: `e2e/accessibility.spec.ts`

**Coverage**: Automated scans + keyboard navigation + screen reader compatibility

### 6. Performance Tests (Lighthouse)
Measure performance, accessibility, and best practices scores.

**Location**: `e2e/lighthouse.spec.ts`

**Coverage**: Key pages with performance thresholds

### 7. Load Tests (k6)
Simulate concurrent users to test scalability.

**Location**: `load-tests/**/*.js`

**Coverage**: Auth, pet, chat, and marketplace endpoints

See [LOAD_TESTING.md](./LOAD_TESTING.md) for details.

## Running Tests

### Unit & Integration Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/__tests__/api/auth.test.ts

# Run tests matching pattern
npm test -- --grep "auth"
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run specific test file
npm run test:e2e -- e2e/auth.spec.ts

# Run tests on specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit

# Run tests in headed mode (see browser)
npm run test:e2e -- --headed
```

### Visual Regression Tests

```bash
# Run with Percy integration
npx percy exec -- npm run test:e2e -- e2e/visual-regression.spec.ts

# Run without Percy (functional tests only)
npm run test:e2e -- e2e/visual-regression.spec.ts
```

### Accessibility Tests

```bash
npm run test:e2e -- e2e/accessibility.spec.ts
```

### Performance Tests

```bash
npm run test:e2e -- e2e/lighthouse.spec.ts
```

### Load Tests

```bash
# Run individual load test
k6 run load-tests/auth-endpoints.js

# Run with custom base URL
k6 run --env BASE_URL=https://staging.example.com load-tests/auth-endpoints.js

# Run all load tests
k6 run load-tests/auth-endpoints.js
k6 run load-tests/pet-endpoints.js
k6 run load-tests/chat-endpoints.js
k6 run load-tests/marketplace-endpoints.js
```

### Type Checking

```bash
npm run typecheck
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth';

describe('Auth Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Salt makes them unique
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });
});
```

### Component Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatBar from '@/components/StatBar';

describe('StatBar', () => {
  it('should render stat label and value', () => {
    render(<StatBar label="Health" value={75} max={100} />);

    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('75/100')).toBeInTheDocument();
  });

  it('should display correct width percentage', () => {
    render(<StatBar label="Health" value={75} max={100} />);

    const bar = screen.getByTestId('stat-bar-fill');
    expect(bar).toHaveStyle({ width: '75%' });
  });

  it('should show green color when value > 60%', () => {
    render(<StatBar label="Health" value={75} max={100} />);

    const bar = screen.getByTestId('stat-bar-fill');
    expect(bar).toHaveClass('bg-green-500');
  });

  it('should show critical indicator when value < 20%', () => {
    render(<StatBar label="Health" value={15} max={100} />);

    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
  });
});
```

### API Test Example

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/prisma';

describe('POST /api/auth/register', () => {
  afterEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-register' } },
    });
  });

  it('should register a new user', async () => {
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: `test-register-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        dateOfBirth: '2000-01-01',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user).toBeDefined();
    expect(data.token).toBeDefined();
    expect(data.user.email).toContain('test-register');
  });

  it('should reject duplicate email', async () => {
    const email = `test-register-dup-${Date.now()}@example.com`;

    // Register first user
    await POST(
      new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email,
          password: 'TestPassword123!',
          dateOfBirth: '2000-01-01',
        }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    // Try to register again with same email
    const response = await POST(
      new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User 2',
          email,
          password: 'TestPassword123!',
          dateOfBirth: '2000-01-01',
        }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(400);
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test('should register a new user successfully', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-e2e-${timestamp}@example.com`;

    await page.goto('/auth/register');

    await page.fill('#name', 'E2E Test User');
    await page.fill('#email', email);
    await page.fill('#password', 'TestPassword123!');
    await page.fill('#dateOfBirth', '2000-01-01');

    await page.click('button[type="submit"]');

    await page.waitForURL(/\/auth\/login/);
    expect(page.url()).toContain('/auth/login');
  });

  test('should show validation error for empty email', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('#name', 'E2E Test User');
    await page.fill('#password', 'TestPassword123!');
    await page.fill('#dateOfBirth', '2000-01-01');

    await page.click('button[type="submit"]');

    // HTML5 validation should prevent submission
    const emailInput = page.locator('#email');
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBeTruthy();
  });
});
```

### Best Practices

✅ **Do:**
- Use descriptive test names (should/when/given)
- Test one thing per test
- Use setup/teardown (beforeEach, afterEach)
- Clean up test data
- Mock external dependencies (APIs, databases)
- Use test IDs for stable selectors
- Test edge cases and error states

❌ **Don't:**
- Test implementation details
- Share state between tests
- Use hard-coded waits (use waitFor instead)
- Test third-party libraries
- Commit test data to database
- Use production API keys in tests

## Coverage Requirements

### Thresholds
All code must meet these coverage thresholds:

```javascript
coverage: {
  branches: 100,
  functions: 100,
  lines: 100,
  statements: 100,
}
```

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html
```

### Coverage Reports
- **HTML**: `coverage/index.html` - Interactive browsable report
- **JSON**: `coverage/coverage-final.json` - Machine-readable
- **Text**: Console output - Quick summary

### Enforcement
- CI pipeline fails if coverage < 100%
- Pre-commit hooks can check coverage locally
- Coverage reports uploaded to CI artifacts

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload E2E artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

      - name: Run visual regression tests
        if: github.event_name == 'pull_request'
        run: npx percy exec -- npm run test:e2e -- e2e/visual-regression.spec.ts
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
```

### Required Secrets
- `PERCY_TOKEN`: Percy visual regression testing
- `OPENAI_API_KEY`: AI chat functionality (use test key)
- `DATABASE_URL`: Test database connection

### Pipeline Stages
1. **Type Check**: Verify TypeScript types
2. **Unit Tests**: Run with coverage enforcement
3. **E2E Tests**: Validate user flows
4. **Visual Tests**: Check for UI regressions (PRs only)
5. **Performance Tests**: Run Lighthouse audits (optional)

### Artifacts
- Coverage reports
- Playwright test results
- Lighthouse reports
- Percy snapshots

## Troubleshooting

### Common Issues

#### 1. Tests Timeout

**Symptom**: Tests fail with timeout errors

**Solutions**:
- Increase timeout: `test('name', async () => {}, { timeout: 10000 })`
- Use `waitForLoadState('networkidle')` in E2E tests
- Check for infinite loops or missing awaits
- Verify server is running for E2E tests

#### 2. Flaky Tests

**Symptom**: Tests pass sometimes, fail randomly

**Solutions**:
- Remove hard-coded waits, use `waitFor` instead
- Clean up test data between runs
- Use unique identifiers (timestamps) for test data
- Avoid testing animations mid-frame
- Mock time-dependent functionality

#### 3. Coverage Not 100%

**Symptom**: Coverage report shows missing lines

**Solutions**:
- Check uncovered lines in HTML report
- Add tests for edge cases
- Test error handlers
- Test all conditional branches
- Mock external dependencies

#### 4. Database Conflicts

**Symptom**: Tests fail with unique constraint errors

**Solutions**:
- Use unique test data (timestamps + random)
- Clean up in afterEach hooks
- Use test database (not production!)
- Isolate tests with transactions

#### 5. Playwright Browser Not Found

**Symptom**: Error: browserType.launch: Executable doesn't exist

**Solutions**:
```bash
npx playwright install
npx playwright install-deps
```

#### 6. Percy Snapshots Not Uploading

**Symptom**: No builds appearing in Percy dashboard

**Solutions**:
- Verify PERCY_TOKEN is set
- Wrap command: `npx percy exec -- playwright test`
- Check network connectivity
- Review Percy CLI logs

#### 7. k6 Not Installed

**Symptom**: Command not found: k6

**Solutions**:
```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6

# Windows
choco install k6
```

#### 8. OpenAI API Errors in Tests

**Symptom**: Chat tests fail with API errors

**Solutions**:
- Set OPENAI_API_KEY environment variable
- Use test API key (not production)
- Mock OpenAI in unit tests
- Allow higher error rate in load tests (10%)

### Getting Help

If you're stuck:
1. Check this documentation
2. Review existing tests for examples
3. Check CI logs for detailed errors
4. Ask the team in Slack
5. Open an issue with reproduction steps

## Resources

### Documentation
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Percy](https://docs.percy.io/)
- [axe-core](https://www.deque.com/axe/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [k6](https://k6.io/docs/)

### Related Files
- [VISUAL_REGRESSION.md](./VISUAL_REGRESSION.md) - Percy visual testing
- [LOAD_TESTING.md](./LOAD_TESTING.md) - k6 load testing
- [vitest.config.ts](./vitest.config.ts) - Unit test configuration
- [playwright.config.ts](./playwright.config.ts) - E2E test configuration
- [.percy.yml](./.percy.yml) - Percy configuration

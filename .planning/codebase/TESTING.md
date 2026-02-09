# Testing Patterns

**Analysis Date:** 2026-02-09

## Test Framework

**Runners:**
- Vitest v4.0.18 - Unit and component testing
  - Config: `vitest.config.ts`
  - Setup file: `vitest.setup.ts`
  - Environment: jsdom
- Playwright v1.58.2 - End-to-end testing
  - Config: `playwright.config.ts`
  - Test directory: `./e2e/`

**Assertion Library:**
- Vitest built-in assertions
- @testing-library/jest-dom matchers (for DOM assertions in Vitest)
- Playwright assertions (`expect()`)

**Run Commands:**
```bash
npm run test                    # Run all unit tests with Vitest
npm run test:ui                # Start Vitest UI dashboard
npm run test:coverage          # Run tests with coverage report
npm run test:e2e               # Run Playwright E2E tests
npm run test:e2e:ui            # Run E2E tests in interactive mode
npm run test:e2e:debug         # Debug E2E tests
```

## Test File Organization

**Location:**
- Unit/component tests: Co-located in `src/__tests__/` directory
- Subdirectories mirror source structure: `src/__tests__/api/`, `src/__tests__/components/`, `src/__tests__/lib/`
- E2E tests: Centralized in `./e2e/` directory

**Naming:**
- Test files: `.spec.ts` extension (e.g., `auth.spec.ts`, `pet-creation.spec.ts`)
- Not `*.test.ts` format - codebase standardized on `.spec.ts`

**Structure:**
```
src/
├── __tests__/
│   ├── api/
│   ├── components/
│   └── lib/
├── app/
├── components/
└── lib/
e2e/
├── auth.spec.ts
├── pet-creation.spec.ts
├── breeding.spec.ts
├── accessibility.spec.ts
└── lighthouse.spec.ts
```

## Test Structure

**Suite Organization:**

E2E Playwright pattern:
```typescript
import { test, expect } from '@playwright/test'

test.describe('User Registration and Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.context().clearCookies()
  })

  test('should show validation errors for invalid registration input', async ({ page }) => {
    await page.goto('/auth/register')

    // Test assertions
    await expect(page).toHaveURL(/\/auth\/register/)
  })
})
```

**Common Patterns:**
- `test.describe()` for test suites (describe blocks)
- `test.beforeEach()` for per-test setup
- `test.beforeAll()` for suite-level setup (user creation, auth)
- `test()` for individual test cases
- Async/await for all test code
- No test.afterEach or cleanup unless needed (Playwright handles context cleanup)

## Mocking

**Framework:** Playwright built-in capabilities (no external mocking library detected)

**Patterns:**

Playwright E2E mocking approach:
- No unit test mocks detected in committed code
- E2E tests use real application with live database (test.db)
- API testing through actual HTTP calls to running server

**Test Data Setup:**
```typescript
// Setup in beforeAll/beforeEach
const timestamp = Date.now()
const testEmail = `test-auth-${timestamp}@example.com`
const testPassword = 'TestPassword123!'

// Create test user via registration endpoint
await page.goto('/auth/register')
await page.fill('#email', testEmail)
await page.fill('#password', testPassword)
await page.click('button[type="submit"]')
```

**What to Mock:**
- Nothing detected - tests use real database and API calls
- External services (OpenAI, Stripe) called via actual endpoints in integration tests

**What NOT to Mock:**
- Database operations - tests use real test.db
- API endpoints - tests hit real routes
- Authentication - tests perform real login/registration

## Fixtures and Factories

**Test Data:**

Timestamp-based unique data:
```typescript
const timestamp = Date.now()
const testUser = {
  name: 'Test User',
  email: `test-${timestamp}@example.com`,
  password: 'TestPassword123!',
  dateOfBirth: '1990-01-01',
}

const petName = `TestPet${timestamp}`
```

Authentication token setup:
```typescript
// Get token from localStorage after login
const authToken = await page.evaluate(() => localStorage.getItem('authToken') || '')

// Use in subsequent API calls
await page.evaluate((token) => {
  localStorage.setItem('authToken', token)
  localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@example.com' }))
}, authToken)
```

**Location:**
- Test data: Inline within test files, no separate fixtures directory
- Generated on-the-fly using `Date.now()` for uniqueness
- Reused within test suite via variables in `beforeAll` hook

## Coverage

**Requirements:**
- Thresholds configured in `vitest.config.ts`:
  - Branches: 100%
  - Functions: 100%
  - Lines: 100%
  - Statements: 100%

**View Coverage:**
```bash
npm run test:coverage          # Generate coverage report
# Reports available in coverage/ directory as HTML
```

**Coverage Configuration:**
- Provider: v8
- Reporters: text, json, html
- Excludes: node_modules, .next, config files, type definitions, prisma, scripts

## Test Types

**Unit Tests:**
- Located in: `src/__tests__/lib/`, `src/__tests__/api/`, `src/__tests__/components/`
- Scope: Individual functions and utility logic
- Approach: Test exported functions directly with assertions
- Environment: jsdom for DOM-based tests
- No detected unit test examples in committed code (thresholds suggest they exist)

**Integration Tests:**
- Primarily E2E tests in `./e2e/` directory
- Tests API endpoints with real database
- Tests full user flows (registration → login → pet creation)
- Test database: `test.db` (SQLite)

**E2E Tests (Playwright):**
- Framework: Playwright v1.58.2
- Browser coverage: Chromium, Firefox, WebKit
- Mobile testing: Pixel 5 (Android), iPhone 12 (iOS)
- Special E2E test types:
  - **Accessibility**: `e2e/accessibility.spec.ts` using axe-core
  - **Visual regression**: `e2e/visual-regression.spec.ts` using Percy
  - **Performance**: `e2e/lighthouse.spec.ts` using Lighthouse
  - **Load testing**: `load-tests/` directory with k6 scripts

**E2E Configuration Details:**
- Base URL: `http://localhost:3000` (or `PLAYWRIGHT_BASE_URL` env var)
- Parallel execution: Enabled on CI (1 worker), disabled locally
- Retries: 2 on CI, 0 locally
- Screenshots: Only on failure
- Video: Retained on failure
- Traces: On first retry

## Common Patterns

**Async Testing:**

Playwright async pattern (all tests are async):
```typescript
test('should successfully register a new user', async ({ page }) => {
  await page.goto('/auth/register')

  const testUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    dateOfBirth: '1990-01-01',
  }

  // Fill in registration form
  await page.fill('#name', testUser.name)
  await page.fill('#email', testUser.email)
  await page.fill('#password', testUser.password)
  await page.fill('#dateOfBirth', testUser.dateOfBirth)

  // Submit form
  await page.click('button[type="submit"]')

  // Wait for navigation
  await expect(page).toHaveURL(/\/auth\/login/)
  await expect(page).toHaveURL(/registered=true/)
})
```

**Error Testing:**

Validation error testing:
```typescript
test('should show error when registering with duplicate email', async ({ page }) => {
  const testUser = {
    name: 'Test User',
    email: `test-duplicate-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    dateOfBirth: '1990-01-01',
  }

  // First registration - success
  await page.goto('/auth/register')
  await page.fill('#name', testUser.name)
  await page.fill('#email', testUser.email)
  await page.fill('#password', testUser.password)
  await page.fill('#dateOfBirth', testUser.dateOfBirth)
  await page.click('button[type="submit"]')

  // Second registration with same email should fail
  // Expected: Error message displayed
})
```

**Page Navigation Testing:**

Wait for navigation patterns:
```typescript
// Wait for specific URL pattern
await page.waitForURL(/\/auth\/login/)

// Wait for query parameter
await page.waitForURL(/registered=true/)

// Simple assertion
await expect(page).toHaveURL(/\/auth\/register/)

// With timeout
await page.waitForURL(/\/dashboard\?petCreated=true/, { timeout: 10000 })
```

**Accessibility Testing:**

Axe-core integration:
```typescript
import AxeBuilder, { AxeResults } from '@axe-core/playwright'

test('should have no accessibility violations on login page', async ({ page }) => {
  await page.goto('/auth/login')
  await page.waitForLoadState('networkidle')

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(accessibilityScanResults.violations).toEqual([])
})
```

**Visual Regression Testing:**

Percy integration (configured in `.percy.yml`):
```typescript
// Percy snapshots are taken via page.goto() calls
// Configure thresholds and pixel matching in Percy dashboard
// Visual tests in: e2e/visual-regression.spec.ts
```

**Performance Testing:**

Lighthouse integration:
```typescript
// Lighthouse metrics tested in: e2e/lighthouse.spec.ts
// Measures: FCP, LCP, CLS, performance score
```

## Test Data and Setup

**Environment Variables for Testing:**

From `vitest.setup.ts`:
```typescript
process.env.NEXTAUTH_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.DATABASE_URL = 'file:./test.db'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-x'
```

**Database for Testing:**
- File-based SQLite: `test.db`
- Same schema as production (Prisma migrations applied)
- Persists data across test runs (must be reset manually or use cleanup)
- Generated automatically by test runs

## Test Execution

**CI/CD Configuration:**
- Playwright configuration detects CI via `process.env.CI`
- On CI: 1 worker, 2 retries, forbidOnly enabled
- Locally: parallel workers, 0 retries, forbidOnly disabled

**Webserver Startup:**
- Playwright starts Next.js dev server automatically before tests
- Reuses existing server if available (locally)
- 120 second timeout for server startup

## Special Test Features

**Accessibility Testing Setup:**
- axe-core library: `@axe-core/playwright@4.10.2`
- Tests WCAG 2.A/AA and WCAG 2.1 standards
- Can be extended with custom rules

**Visual Regression Testing Setup:**
- Percy library: `@percy/cli@1.30.1`, `@percy/playwright@1.0.7`
- Configuration: `.percy.yml`
- Detects visual changes across browser/device combinations

**Performance Testing Setup:**
- Lighthouse library: `playwright-lighthouse@4.0.0`
- Measures Core Web Vitals
- Integration with Playwright browser automation

**Load Testing Setup:**
- k6 framework (detected in `load-tests/` directory)
- Performance testing scripts committed but not run in standard test suite
- May require separate k6 environment to execute

---

*Testing analysis: 2026-02-09*

# PRD: Comprehensive Testing Strategy for Mesmer Pet App

## Introduction

Implement a complete testing infrastructure and achieve 100% test coverage across the Mesmer pet application. This includes unit tests, integration tests, E2E tests, visual regression tests for 3D/AR features, and automated CI/CD pipelines to ensure code quality, catch bugs before production, enable confident refactoring, and serve as living documentation for developers.

## Goals

- Achieve 100% test coverage across all application layers (API, business logic, components, E2E flows)
- Prevent regressions when adding new features or refactoring
- Document expected behavior through comprehensive test suites
- Enable confident deployments with automated testing in CI/CD
- Test critical AR/WebXR and Three.js 3D rendering features
- Establish testing best practices and patterns for the team
- Identify and fix bugs in partially-working features

## User Stories

### Infrastructure & Setup

#### US-TEST-001: Configure testing framework and tooling
**Description:** As a developer, I need a complete testing environment set up so I can write and run tests efficiently.

**Acceptance Criteria:**
- [ ] Install and configure Vitest for unit/integration tests
- [ ] Install and configure Playwright for E2E tests
- [ ] Install and configure React Testing Library for component tests
- [ ] Install and configure @testing-library/jest-dom for assertions
- [ ] Create test configuration files (vitest.config.ts, playwright.config.ts)
- [ ] Set up test database configuration (SQLite in-memory for unit tests)
- [ ] Create test utilities directory with common helpers
- [ ] Add npm scripts: `test`, `test:unit`, `test:integration`, `test:e2e`, `test:coverage`
- [ ] Typecheck passes
- [ ] All test commands run successfully

#### US-TEST-002: Set up test database seeding and cleanup
**Description:** As a developer, I need reliable test data setup and teardown so tests are isolated and repeatable.

**Acceptance Criteria:**
- [ ] Create test seed data factory functions for all models (User, Pet, Trait, Skill, etc.)
- [ ] Implement database reset utility for test isolation
- [ ] Create beforeEach/afterEach helpers for database cleanup
- [ ] Add fixture data for common test scenarios
- [ ] Document test data creation patterns in testing guide
- [ ] Typecheck passes
- [ ] Test utilities work correctly in sample test

#### US-TEST-003: Configure CI/CD testing pipeline
**Description:** As a team, we need automated tests running on every PR so we catch issues before merge.

**Acceptance Criteria:**
- [ ] Create GitHub Actions workflow for tests
- [ ] Run unit tests on every push/PR
- [ ] Run integration tests on every push/PR
- [ ] Run E2E tests on every PR to main
- [ ] Generate and upload coverage reports
- [ ] Block merges if tests fail or coverage drops below 100%
- [ ] Add status badge to README showing test status
- [ ] Workflow completes successfully on test PR

### API & Backend Testing

#### US-TEST-004: Test authentication API endpoints
**Description:** As a developer, I need comprehensive tests for auth endpoints to ensure security and correctness.

**Acceptance Criteria:**
- [ ] Test POST /api/auth/register: successful registration
- [ ] Test POST /api/auth/register: duplicate email rejection
- [ ] Test POST /api/auth/register: password validation
- [ ] Test POST /api/auth/register: COPPA age verification
- [ ] Test POST /api/auth/login: successful login with valid credentials
- [ ] Test POST /api/auth/login: invalid credentials rejection
- [ ] Test POST /api/auth/login: email not verified handling
- [ ] Test POST /api/auth/verify-email: successful email verification
- [ ] Test POST /api/auth/verify-email: invalid token handling
- [ ] Test JWT token generation and validation
- [ ] Coverage: 100% of auth route handlers
- [ ] Typecheck passes

#### US-TEST-005: Test pet management API endpoints
**Description:** As a developer, I need tests for all pet CRUD operations and stat management.

**Acceptance Criteria:**
- [ ] Test POST /api/pets: create pet with random genetics
- [ ] Test POST /api/pets: enforce 10 pet limit
- [ ] Test POST /api/pets: require authentication
- [ ] Test POST /api/pets: assign correct trait rarities (60% common, 25% uncommon, 10% rare, 5% legendary)
- [ ] Test GET /api/pets: fetch user's pets with traits and skills
- [ ] Test GET /api/pets: return empty array for new user
- [ ] Test POST /api/pets/feed: successful feeding updates hunger/happiness
- [ ] Test POST /api/pets/feed: enforce cooldown period
- [ ] Test POST /api/pets/feed: reject feeding critical pets
- [ ] Test POST /api/pets/feed-all: bulk feed multiple pets
- [ ] Test POST /api/pets/recover: recover critical pet with health potion
- [ ] Test POST /api/pets/recover: apply max health penalty after recovery
- [ ] Test GET /api/pets/health-check-all: return health summary
- [ ] Coverage: 100% of pet route handlers
- [ ] Typecheck passes

#### US-TEST-006: Test breeding system API
**Description:** As a developer, I need tests for the breeding mechanics including genetics and cooldowns.

**Acceptance Criteria:**
- [ ] Test POST /api/pets/breed: successful breeding creates offspring
- [ ] Test POST /api/pets/breed: 50/50 trait inheritance from parents
- [ ] Test POST /api/pets/breed: 15% mutation chance applies correctly
- [ ] Test POST /api/pets/breed: generation increments (max(parent1.gen, parent2.gen) + 1)
- [ ] Test POST /api/pets/breed: enforce 7-day age requirement
- [ ] Test POST /api/pets/breed: enforce health > 50 requirement
- [ ] Test POST /api/pets/breed: enforce 7-day cooldown between breedings
- [ ] Test POST /api/pets/breed: reject breeding same pet twice
- [ ] Test POST /api/pets/breed: enforce 10 pet limit
- [ ] Test GET /api/pets/check-breeding: validate breeding eligibility
- [ ] Test POST /api/breeding-requests/send: create breeding request
- [ ] Test POST /api/breeding-requests/accept: successful cross-user breeding
- [ ] Test POST /api/breeding-requests/decline: reject breeding request
- [ ] Test GET /api/breeding-requests/list: fetch pending requests
- [ ] Coverage: 100% of breeding route handlers
- [ ] Typecheck passes

#### US-TEST-007: Test marketplace and monetization APIs
**Description:** As a developer, I need tests for skill purchases, item purchases, and Stripe integration.

**Acceptance Criteria:**
- [ ] Test GET /api/marketplace/skills: fetch available skills with filtering
- [ ] Test POST /api/skills/assign: purchase and assign skill to pet
- [ ] Test POST /api/skills/assign: deduct virtual currency correctly
- [ ] Test POST /api/skills/assign: prevent duplicate skill assignment
- [ ] Test POST /api/skills/remove: unassign skill from pet
- [ ] Test POST /api/checkout: create Stripe checkout session
- [ ] Test POST /api/checkout: validate price and items
- [ ] Test POST /api/webhooks/stripe: handle successful payment
- [ ] Test POST /api/webhooks/stripe: grant recovery items on purchase
- [ ] Test POST /api/webhooks/stripe: verify webhook signature
- [ ] Test GET /api/recovery-items/user/[userId]: fetch user's items
- [ ] Test POST /api/recovery-items/grant: grant items to user
- [ ] Coverage: 100% of marketplace route handlers
- [ ] Typecheck passes

#### US-TEST-008: Test chat and AI interaction API
**Description:** As a developer, I need tests for chat functionality and AI response handling.

**Acceptance Criteria:**
- [ ] Test POST /api/chat: generate AI response with pet personality
- [ ] Test POST /api/chat: store interaction in memory
- [ ] Test POST /api/chat: handle OpenAI API errors gracefully
- [ ] Test POST /api/chat: reject chat with critical pets
- [ ] Test GET /api/memory/[petId]: fetch pet memory summaries
- [ ] Test POST /api/memory/store: save interaction memory
- [ ] Test POST /api/memory/summarize: trigger memory summarization
- [ ] Test GET /api/personality/[petId]: generate personality summary
- [ ] Mock OpenAI API calls to avoid external dependencies
- [ ] Coverage: 100% of chat/AI route handlers
- [ ] Typecheck passes

#### US-TEST-009: Test friends and social features API
**Description:** As a developer, I need tests for friend requests, friend lists, and social interactions.

**Acceptance Criteria:**
- [ ] Test POST /api/friends/send: send friend request
- [ ] Test POST /api/friends/send: prevent duplicate requests
- [ ] Test POST /api/friends/accept: accept friend request
- [ ] Test POST /api/friends/decline: decline friend request
- [ ] Test POST /api/friends/remove: unfriend user
- [ ] Test GET /api/friends/list: fetch friends list
- [ ] Test GET /api/friends/requests: fetch pending requests
- [ ] Test GET /api/friends/search: search users by email/name
- [ ] Test GET /api/friends/pets/[friendId]: view friend's pets
- [ ] Test privacy controls for viewing friend's pets
- [ ] Coverage: 100% of friends route handlers
- [ ] Typecheck passes

#### US-TEST-010: Test tutorial and onboarding API
**Description:** As a developer, I need tests for tutorial progression and reward granting.

**Acceptance Criteria:**
- [ ] Test GET /api/tutorial/progress: fetch user tutorial state
- [ ] Test POST /api/tutorial/update: update tutorial step
- [ ] Test POST /api/tutorial/update: grant 50 coin reward on completion
- [ ] Test POST /api/tutorial/skip: mark tutorial as skipped
- [ ] Test POST /api/tutorial/resume: resume skipped tutorial
- [ ] Test tutorial step validation (create_pet, feed, chat, view_stats, learn_breeding)
- [ ] Coverage: 100% of tutorial route handlers
- [ ] Typecheck passes

#### US-TEST-011: Test admin panel API endpoints
**Description:** As a developer, I need tests for admin-only features with proper authorization.

**Acceptance Criteria:**
- [ ] Test GET /api/admin/skills/list: fetch all skills (admin only)
- [ ] Test GET /api/admin/skills/list: return 403 for non-admin users
- [ ] Test POST /api/admin/skills/create: create new skill
- [ ] Test POST /api/admin/skills/update: update skill properties
- [ ] Test POST /api/admin/skills/toggle: enable/disable skill
- [ ] Test GET /api/admin/analytics/skills: fetch skill purchase analytics
- [ ] Test admin authorization middleware
- [ ] Coverage: 100% of admin route handlers
- [ ] Typecheck passes

#### US-TEST-012: Test sync and offline features API
**Description:** As a developer, I need tests for cross-platform sync and offline action replay.

**Acceptance Criteria:**
- [ ] Test GET /api/sync/status: fetch sync status
- [ ] Test GET /api/sync/pet/[petId]: fetch pet sync data
- [ ] Test POST /api/sync/offline: process offline actions
- [ ] Test offline action validation and conflict resolution
- [ ] Test sync state tracking and updates
- [ ] Coverage: 100% of sync route handlers
- [ ] Typecheck passes

### Business Logic & Utilities Testing

#### US-TEST-013: Test genetics and trait assignment logic
**Description:** As a developer, I need tests for the genetics system to ensure correct trait inheritance.

**Acceptance Criteria:**
- [ ] Test generateRandomPersonality(): returns values 0-100 for all traits
- [ ] Test assignRandomTraits(): assigns correct number of traits by type
- [ ] Test assignRandomTraits(): respects rarity distribution
- [ ] Test assignRandomTraits(): falls back to any rarity if specific not available
- [ ] Test createPetWithGenetics(): creates pet with personality and traits
- [ ] Test breeding trait inheritance: 50% from each parent
- [ ] Test breeding mutation: 15% chance applies correctly over 1000 iterations
- [ ] Test breeding generation calculation
- [ ] Coverage: 100% of src/lib/genetics.ts
- [ ] Typecheck passes

#### US-TEST-014: Test stat decay and warning system
**Description:** As a developer, I need tests for pet stat degradation and health warnings.

**Acceptance Criteria:**
- [ ] Test stat decay rates: hunger +0.5/hour, happiness -0.3/hour, energy -0.4/hour
- [ ] Test health reduction when hunger > 80
- [ ] Test neglect state detection (no interaction > 48 hours)
- [ ] Test critical state trigger (health < 20)
- [ ] Test warning generation for low stats
- [ ] Test warning severity levels (warning vs critical)
- [ ] Test checkPetWarnings(): returns correct warnings
- [ ] Test stat update clamping (0-100 range)
- [ ] Coverage: 100% of src/lib/warnings.ts and stat calculation logic
- [ ] Typecheck passes

#### US-TEST-015: Test authentication utilities
**Description:** As a developer, I need tests for JWT, password hashing, and auth validation.

**Acceptance Criteria:**
- [ ] Test password hashing with bcrypt
- [ ] Test password verification (correct and incorrect passwords)
- [ ] Test JWT token generation with correct payload
- [ ] Test JWT token verification and decoding
- [ ] Test expired token rejection
- [ ] Test invalid token rejection
- [ ] Test email validation regex
- [ ] Test password strength validation
- [ ] Coverage: 100% of auth validation utilities
- [ ] Typecheck passes

#### US-TEST-016: Test background jobs and scheduled tasks
**Description:** As a developer, I need tests for stat updates, memory summarization, and daily challenges.

**Acceptance Criteria:**
- [ ] Test runStatUpdateJob(): updates all pets' stats correctly
- [ ] Test runStatUpdateJob(): generates warnings after update
- [ ] Test runStatUpdateJob(): handles errors gracefully
- [ ] Test runMemorySummarizationJob(): summarizes old memories
- [ ] Test runMemorySummarizationJob(): runs on schedule
- [ ] Test daily challenge assignment
- [ ] Test challenge completion detection
- [ ] Coverage: 100% of src/lib/backgroundJobs.ts
- [ ] Typecheck passes

#### US-TEST-017: Test pet model configuration
**Description:** As a developer, I need tests for 3D model trait-to-visual mapping.

**Acceptance Criteria:**
- [ ] Test getPetModelConfig(): returns correct base color for color traits
- [ ] Test getPetModelConfig(): detects rainbow shimmer trait
- [ ] Test getPetModelConfig(): detects galaxy pattern trait
- [ ] Test getPetModelConfig(): detects glowing eyes trait
- [ ] Test getPetModelConfig(): detects crystal horns trait
- [ ] Test getPetModelConfig(): maps pattern types (striped, spotted, gradient)
- [ ] Test getPetModelConfig(): handles health-based color adjustments
- [ ] Coverage: 100% of src/lib/petModelConfig.ts
- [ ] Typecheck passes

### Component Testing

#### US-TEST-018: Test authentication components
**Description:** As a developer, I need tests for login and registration forms.

**Acceptance Criteria:**
- [ ] Test LoginPage: renders form fields correctly
- [ ] Test LoginPage: validates email format
- [ ] Test LoginPage: validates password requirements
- [ ] Test LoginPage: calls login API on submit
- [ ] Test LoginPage: redirects to dashboard on success
- [ ] Test LoginPage: shows error message on failure
- [ ] Test RegisterPage: renders form fields including age verification
- [ ] Test RegisterPage: validates COPPA age requirement
- [ ] Test RegisterPage: calls register API on submit
- [ ] Test RegisterPage: shows success message and redirects
- [ ] Coverage: 100% of auth page components
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-TEST-019: Test dashboard and pet display components
**Description:** As a developer, I need tests for the main dashboard and pet cards.

**Acceptance Criteria:**
- [ ] Test DashboardPage: renders loading state
- [ ] Test DashboardPage: fetches and displays pets
- [ ] Test DashboardPage: shows empty state when no pets
- [ ] Test DashboardPage: displays pet stats correctly
- [ ] Test DashboardPage: handles feed button click
- [ ] Test DashboardPage: shows critical state banner for sick pets
- [ ] Test DashboardPage: displays warnings correctly
- [ ] Test VitalityOrb: renders stat bar with correct width
- [ ] Test VitalityOrb: applies correct color based on stat level
- [ ] Test VitalityOrb: shows animation for health states
- [ ] Coverage: 100% of dashboard components
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-TEST-020: Test pet creation component
**Description:** As a developer, I need tests for the pet creation form.

**Acceptance Criteria:**
- [ ] Test CreatePetPage: renders form with name input
- [ ] Test CreatePetPage: validates pet name (required, max 50 chars)
- [ ] Test CreatePetPage: calls create pet API on submit
- [ ] Test CreatePetPage: redirects to dashboard with success message
- [ ] Test CreatePetPage: shows error if 10 pet limit reached
- [ ] Test CreatePetPage: requires authentication
- [ ] Coverage: 100% of pet creation components
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-TEST-021: Test breeding components
**Description:** As a developer, I need tests for breeding selection and flow.

**Acceptance Criteria:**
- [ ] Test BreedPage: displays eligible pets
- [ ] Test BreedPage: shows eligibility warnings (age, health, cooldown)
- [ ] Test BreedPage: validates parent selection (can't breed same pet)
- [ ] Test BreedPage: calls breed API on submit
- [ ] Test BreedPage: shows breeding animation/feedback
- [ ] Test BreedPage: redirects to dashboard with new pet
- [ ] Test BreedingRequestsPanel: displays pending requests
- [ ] Test BreedingRequestsPanel: accept/decline actions work
- [ ] Coverage: 100% of breeding components
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-TEST-022: Test chat interface component
**Description:** As a developer, I need tests for the AI chat interface.

**Acceptance Criteria:**
- [ ] Test ChatInterface: renders chat input and message history
- [ ] Test ChatInterface: sends message on submit
- [ ] Test ChatInterface: displays AI response
- [ ] Test ChatInterface: shows loading state during API call
- [ ] Test ChatInterface: includes pet personality in context
- [ ] Test ChatInterface: scrolls to latest message
- [ ] Test ChatInterface: disabled for critical pets
- [ ] Coverage: 100% of chat components
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-TEST-023: Test marketplace components
**Description:** As a developer, I need tests for skill and item marketplace.

**Acceptance Criteria:**
- [ ] Test MarketplacePage: displays available skills
- [ ] Test MarketplacePage: filters by category
- [ ] Test MarketplacePage: shows skill price and description
- [ ] Test MarketplacePage: handles purchase flow
- [ ] Test MarketplacePage: shows insufficient funds error
- [ ] Test MarketplacePage: displays owned items
- [ ] Test Stripe checkout integration (mocked)
- [ ] Coverage: 100% of marketplace components
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-TEST-024: Test tutorial overlay component
**Description:** As a developer, I need tests for the tutorial/onboarding flow.

**Acceptance Criteria:**
- [ ] Test TutorialOverlay: displays current step
- [ ] Test TutorialOverlay: shows progress bar
- [ ] Test TutorialOverlay: advances on step completion
- [ ] Test TutorialOverlay: allows skipping
- [ ] Test TutorialOverlay: grants reward on completion
- [ ] Test TutorialOverlay: fits within viewport (no overflow)
- [ ] Coverage: 100% of tutorial components
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-TEST-025: Test 3D pet model component
**Description:** As a developer, I need tests for the Three.js pet rendering.

**Acceptance Criteria:**
- [ ] Test PetModel3D: renders Canvas and 3D scene
- [ ] Test PetModel3D: applies trait-based colors correctly
- [ ] Test PetModel3D: shows health-based visual changes
- [ ] Test PetModel3D: renders special features (horns, glowing eyes)
- [ ] Test PetModel3D: handles animation states (idle, happy, hungry)
- [ ] Test PetModel3D: auto-rotates if enabled
- [ ] Mock Three.js renderer to avoid WebGL in tests
- [ ] Coverage: 100% of PetModel3D component
- [ ] Typecheck passes

#### US-TEST-026: Test AR viewer component
**Description:** As a developer, I need tests for the AR/WebXR functionality.

**Acceptance Criteria:**
- [ ] Test ARPetViewer: checks WebXR support on mount
- [ ] Test ARPetViewer: shows unsupported message on incompatible devices
- [ ] Test ARPetViewer: displays 3D preview before AR session
- [ ] Test ARPetViewer: starts AR session when supported
- [ ] Test ARPetViewer: handles feed action in AR
- [ ] Test ARPetViewer: handles voice chat activation
- [ ] Test ARPetViewer: handles device motion (shake detection)
- [ ] Test ARPetViewer: logs session analytics correctly
- [ ] Mock navigator.xr API for testing
- [ ] Coverage: 100% of AR viewer component
- [ ] Typecheck passes

### End-to-End Testing

#### US-TEST-027: E2E test for user registration and first pet
**Description:** As a user, I need an E2E test that verifies the complete onboarding flow.

**Acceptance Criteria:**
- [ ] Start at homepage
- [ ] Click "Create Account" link
- [ ] Fill registration form (email, password, name, age verification)
- [ ] Submit and verify redirect to login
- [ ] Login with new credentials
- [ ] Verify redirect to dashboard
- [ ] See tutorial overlay appear
- [ ] Create first pet via tutorial
- [ ] Verify pet appears on dashboard with stats
- [ ] Test passes consistently
- [ ] Typecheck passes

#### US-TEST-028: E2E test for feeding and pet interaction
**Description:** As a user, I need an E2E test that verifies feeding and stat changes.

**Acceptance Criteria:**
- [ ] Login as existing user with pets
- [ ] Click feed button on a pet
- [ ] Verify hunger stat decreases
- [ ] Verify happiness stat increases
- [ ] Verify cooldown message appears on second feed attempt
- [ ] Open chat interface
- [ ] Send message to pet
- [ ] Verify AI response appears
- [ ] Test passes consistently
- [ ] Typecheck passes

#### US-TEST-029: E2E test for breeding flow
**Description:** As a user, I need an E2E test that verifies breeding two pets.

**Acceptance Criteria:**
- [ ] Login as user with 2+ eligible pets
- [ ] Navigate to breed page
- [ ] Select two parent pets
- [ ] Verify eligibility checks pass
- [ ] Click breed button
- [ ] Wait for breeding to complete
- [ ] Verify redirect to dashboard
- [ ] Verify new offspring pet appears with correct generation
- [ ] Verify offspring has traits from both parents
- [ ] Test passes consistently
- [ ] Typecheck passes

#### US-TEST-030: E2E test for marketplace purchase
**Description:** As a user, I need an E2E test that verifies buying and assigning a skill.

**Acceptance Criteria:**
- [ ] Login as user with sufficient virtual currency
- [ ] Navigate to marketplace
- [ ] Browse available skills
- [ ] Select a skill to purchase
- [ ] Complete purchase flow
- [ ] Assign skill to a pet
- [ ] Verify skill appears in pet's skill list
- [ ] Verify virtual currency deducted
- [ ] Test passes consistently
- [ ] Typecheck passes

#### US-TEST-031: E2E test for critical pet recovery
**Description:** As a user, I need an E2E test that verifies recovering a critical pet.

**Acceptance Criteria:**
- [ ] Login as user with critical pet (health < 20)
- [ ] See critical state banner on pet card
- [ ] Verify feed button is disabled
- [ ] Click "Use Health Potion" button
- [ ] Verify pet health restored to 50
- [ ] Verify health potion consumed from inventory
- [ ] Verify max health penalty applied
- [ ] Test passes consistently
- [ ] Typecheck passes

#### US-TEST-032: E2E test for friend requests and social features
**Description:** As a user, I need an E2E test that verifies friend request flow.

**Acceptance Criteria:**
- [ ] Create two test users
- [ ] Login as user 1
- [ ] Navigate to friends page
- [ ] Search for user 2
- [ ] Send friend request
- [ ] Logout and login as user 2
- [ ] See pending friend request
- [ ] Accept friend request
- [ ] Logout and login as user 1
- [ ] See user 2 in friends list
- [ ] View user 2's pets
- [ ] Test passes consistently
- [ ] Typecheck passes

### Performance & Accessibility Testing

#### US-TEST-033: Performance testing for dashboard load
**Description:** As a developer, I need performance benchmarks for critical pages.

**Acceptance Criteria:**
- [ ] Measure dashboard load time with 10 pets
- [ ] Verify all pets render within 2 seconds
- [ ] Measure 3D model rendering performance
- [ ] Verify no memory leaks on pet interactions
- [ ] Measure API response times (all < 500ms)
- [ ] Create performance baseline metrics
- [ ] Set up performance regression detection
- [ ] Typecheck passes

#### US-TEST-034: Accessibility testing
**Description:** As a developer, I need to ensure the app is accessible to all users.

**Acceptance Criteria:**
- [ ] Run axe-core accessibility tests on all pages
- [ ] Verify all images have alt text
- [ ] Verify all forms have proper labels
- [ ] Verify keyboard navigation works throughout app
- [ ] Verify color contrast meets WCAG AA standards
- [ ] Verify screen reader compatibility
- [ ] Fix all critical accessibility violations
- [ ] Typecheck passes

### Visual Regression Testing

#### US-TEST-035: Visual regression tests for UI components
**Description:** As a developer, I need visual tests to catch unintended UI changes.

**Acceptance Criteria:**
- [ ] Set up Playwright visual comparison
- [ ] Capture baseline screenshots of all pages (desktop)
- [ ] Capture baseline screenshots of all pages (mobile)
- [ ] Create snapshots for all component states (loading, error, success)
- [ ] Create snapshots for 3D pet models with different traits
- [ ] Create snapshots for different stat levels (healthy, sick, critical)
- [ ] Set up visual diff reports in CI
- [ ] Typecheck passes

### Documentation & Reporting

#### US-TEST-036: Create testing documentation
**Description:** As a developer, I need comprehensive docs on writing and running tests.

**Acceptance Criteria:**
- [ ] Document testing philosophy and patterns
- [ ] Document how to write unit tests with examples
- [ ] Document how to write integration tests with examples
- [ ] Document how to write E2E tests with examples
- [ ] Document test data factories and fixtures
- [ ] Document mocking strategies (DB, APIs, WebXR)
- [ ] Document CI/CD testing pipeline
- [ ] Document coverage requirements
- [ ] Create TESTING.md in project root
- [ ] Typecheck passes

#### US-TEST-037: Set up coverage reporting
**Description:** As a team, we need visibility into test coverage metrics.

**Acceptance Criteria:**
- [ ] Configure Vitest coverage reporting (c8 or istanbul)
- [ ] Generate HTML coverage reports
- [ ] Upload coverage to Codecov or similar service
- [ ] Add coverage badge to README
- [ ] Set coverage thresholds: 100% for statements, branches, functions, lines
- [ ] Fail CI if coverage drops below 100%
- [ ] Create coverage report artifact in CI
- [ ] Coverage reporting works in local and CI environments

## Functional Requirements

**Test Infrastructure:**
- FR-1: All tests must run in isolation with no shared state between tests
- FR-2: Test database must be seeded with consistent data using factories
- FR-3: All external APIs (OpenAI, Stripe) must be mocked in tests
- FR-4: Tests must run in parallel where possible to minimize execution time
- FR-5: All test commands must complete in under 5 minutes

**Unit Testing:**
- FR-6: All utility functions must have 100% code coverage
- FR-7: All business logic must be tested with edge cases
- FR-8: All error paths must be tested

**Integration Testing:**
- FR-9: All API endpoints must be tested with real database (SQLite in-memory)
- FR-10: All API endpoints must test authentication/authorization
- FR-11: All API endpoints must test validation and error responses

**Component Testing:**
- FR-12: All React components must be tested with React Testing Library
- FR-13: All user interactions (clicks, form submissions) must be tested
- FR-14: All loading and error states must be tested
- FR-15: All conditional rendering must be tested

**E2E Testing:**
- FR-16: All critical user flows must have E2E tests (auth, pet creation, feeding, breeding, purchases)
- FR-17: E2E tests must use Playwright against locally running Next.js server
- FR-18: E2E tests must use test database, not production

**AR/3D Testing:**
- FR-19: Three.js components must have unit tests with mocked renderer
- FR-20: WebXR functionality must be tested with mocked navigator.xr API
- FR-21: 3D model trait mapping must be tested for all visual traits

**CI/CD:**
- FR-22: All tests must run on every PR
- FR-23: Coverage must be 100% or PR is blocked
- FR-24: E2E tests must run on staging environment before production deploy

## Non-Goals (Out of Scope)

- No manual testing - all tests must be automated
- No testing of third-party libraries (Three.js, Prisma) - trust their tests
- No load testing or stress testing (separate performance testing initiative)
- No cross-browser testing beyond Chromium (Playwright default)
- No mobile device testing on real devices (use Playwright device emulation)
- No penetration testing or security audits (separate security initiative)

## Technical Considerations

**Testing Stack:**
- Vitest: Unit and integration tests
- React Testing Library: Component tests
- Playwright: E2E tests
- @testing-library/jest-dom: DOM matchers
- MSW (Mock Service Worker): API mocking if needed
- c8 or istanbul: Coverage reporting

**Database Strategy:**
- Unit tests: Mock Prisma client or use in-memory SQLite
- Integration tests: Real Prisma with in-memory SQLite
- E2E tests: Real local SQLite database, reset between tests

**Mocking Strategy:**
- OpenAI API: Mock all AI chat responses
- Stripe API: Mock checkout and webhook handlers
- WebXR navigator.xr: Mock for AR tests
- Three.js WebGLRenderer: Mock for 3D tests
- LocalStorage: Mock for client-side storage tests

**Performance Considerations:**
- Run tests in parallel (Vitest --threads, Playwright --workers)
- Use test database seeding once per file, cleanup between tests
- Skip heavy integration tests in watch mode during development
- Cache dependencies in CI to speed up runs

**Key Files:**
- `vitest.config.ts` - Vitest configuration
- `playwright.config.ts` - Playwright configuration
- `tests/setup.ts` - Global test setup
- `tests/factories/` - Test data factories
- `tests/utils/` - Test utilities and helpers
- `tests/unit/` - Unit tests
- `tests/integration/` - Integration tests
- `tests/e2e/` - E2E tests

## Success Metrics

- 100% code coverage across all files (statements, branches, functions, lines)
- All tests passing in CI/CD pipeline
- Test suite execution time < 5 minutes
- Zero flaky tests (tests must be deterministic)
- All critical user flows covered by E2E tests
- Zero accessibility violations on core pages
- All visual regression tests passing
- Test documentation complete and up-to-date

## Open Questions

- Should we use Vitest or Jest? (Recommendation: Vitest for better Vite/Next.js integration)
- Do we need contract testing for API routes? (Recommendation: Not initially, covered by integration tests)
- Should we test Stripe webhooks with Stripe CLI or mocks? (Recommendation: Mocks in tests, manual verification in staging)
- How do we handle flaky AR/WebXR tests? (Recommendation: Extensive mocking, skip on CI if too flaky)
- Should we test database migrations? (Recommendation: Yes, but separate from main test suite)
- Do we need mutation testing? (Recommendation: Not initially, focus on 100% coverage first)
- Should we test error logging/Sentry integration? (Recommendation: Yes, verify errors are logged correctly)

## Implementation Order

**Phase 1: Infrastructure (Week 1)**
- US-TEST-001: Configure testing framework
- US-TEST-002: Set up test database
- US-TEST-003: Configure CI/CD
- US-TEST-036: Create testing documentation
- US-TEST-037: Set up coverage reporting

**Phase 2: Backend/API (Week 2-3)**
- US-TEST-004: Auth API tests
- US-TEST-005: Pet management API tests
- US-TEST-006: Breeding API tests
- US-TEST-007: Marketplace API tests
- US-TEST-008: Chat/AI API tests
- US-TEST-009: Friends API tests
- US-TEST-010: Tutorial API tests
- US-TEST-011: Admin API tests
- US-TEST-012: Sync API tests

**Phase 3: Business Logic (Week 3)**
- US-TEST-013: Genetics logic tests
- US-TEST-014: Stat decay tests
- US-TEST-015: Auth utilities tests
- US-TEST-016: Background jobs tests
- US-TEST-017: Pet model config tests

**Phase 4: Components (Week 4)**
- US-TEST-018: Auth components tests
- US-TEST-019: Dashboard components tests
- US-TEST-020: Pet creation tests
- US-TEST-021: Breeding components tests
- US-TEST-022: Chat interface tests
- US-TEST-023: Marketplace tests
- US-TEST-024: Tutorial overlay tests
- US-TEST-025: 3D model tests
- US-TEST-026: AR viewer tests

**Phase 5: E2E (Week 5)**
- US-TEST-027: Registration/first pet E2E
- US-TEST-028: Feeding/interaction E2E
- US-TEST-029: Breeding E2E
- US-TEST-030: Marketplace E2E
- US-TEST-031: Recovery E2E
- US-TEST-032: Friends E2E

**Phase 6: Quality & Polish (Week 6)**
- US-TEST-033: Performance testing
- US-TEST-034: Accessibility testing
- US-TEST-035: Visual regression tests
- Bug fixes and refinement
- Documentation updates
- Final coverage verification

---

**Total Estimated Effort:** 6 weeks for 100% coverage
**Team Size:** 1-2 developers (can parallelize API and component testing)

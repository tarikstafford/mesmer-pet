# Codebase Structure

**Analysis Date:** 2026-02-09

## Directory Layout

```
mesmer-main/
├── src/
│   ├── app/                    # Next.js App Router - pages and API routes
│   │   ├── api/               # REST API endpoints (66 route.ts files)
│   │   │   ├── auth/         # Authentication endpoints (login, register, verify-email)
│   │   │   ├── chat/         # Pet chat/LLM interaction
│   │   │   ├── pets/         # Pet CRUD and actions (feed, breed, health-check)
│   │   │   │   └── marketplace/  # Marketplace buy/sell/list operations
│   │   │   ├── memory/       # Memory store/retrieve/summarize
│   │   │   ├── tutorial/     # Tutorial progression tracking
│   │   │   ├── friends/      # Friend system endpoints
│   │   │   ├── admin/        # Admin-only endpoints
│   │   │   └── privacy/      # GDPR/privacy endpoints (data export, account deletion)
│   │   ├── dashboard/        # Main pet dashboard page (1421 lines)
│   │   ├── pets/            # Pet-related pages (create, marketplace)
│   │   ├── breed/           # Breeding interface
│   │   ├── auth/            # Auth pages (login, register)
│   │   ├── admin/           # Admin dashboard
│   │   ├── friends/         # Friend system UI
│   │   ├── marketplace/     # Marketplace UI pages
│   │   ├── settings/        # User settings (privacy controls)
│   │   ├── privacy/         # Privacy policy page
│   │   ├── terms/           # Terms of service page
│   │   ├── layout.tsx        # Root layout with CookieConsent
│   │   └── globals.css      # Global styles
│   │
│   ├── components/          # React UI components (19 .tsx files)
│   │   ├── PetCard.tsx      # Individual pet display card (541 lines)
│   │   ├── PetModel3D.tsx   # 3D AR pet visualization using Three.js/React Three Fiber
│   │   ├── ChatInterface.tsx # Chat interaction component
│   │   ├── ARPetViewer.tsx  # AR viewer (770 lines)
│   │   ├── EngagementPanel.tsx  # Daily engagement tracking UI
│   │   ├── BreedingRequestsPanel.tsx # Breeding request display
│   │   ├── FamilyTree.tsx   # Pet genealogy visualization
│   │   ├── ChessBoard.tsx   # Chess game UI for chess skill
│   │   ├── TutorialOverlay.tsx # Tutorial UI overlay
│   │   ├── MarketplaceCard.tsx # Marketplace listing card
│   │   ├── PetCreationForm.tsx # New pet creation form
│   │   ├── StatBar.tsx      # Stat visualization component
│   │   ├── TraitBadge.tsx   # Trait display badge
│   │   ├── VitalityOrb.tsx  # Pet health/vitality visualization
│   │   ├── SyncStatus.tsx   # Sync state indicator
│   │   ├── CookieConsent.tsx # GDPR cookie consent UI
│   │   └── (backup files)   # PetModel3D.tsx.backup
│   │
│   ├── lib/                 # Business logic services and utilities (30+ modules, ~141 exports)
│   │   ├── prisma.ts        # Prisma ORM singleton with LibSQL adapter
│   │   ├── auth.ts          # Password hashing, JWT token generation/verification
│   │   ├── adminAuth.ts     # Admin role verification
│   │   ├── genetics.ts      # Pet genetics, trait assignment, rarity distribution
│   │   ├── breeding.ts      # Breeding logic, compatibility calculation, offspring creation
│   │   ├── personality.ts   # Personality trait mapping to LLM prompt descriptions
│   │   ├── memory.ts        # Hybrid memory system (recent + summarized)
│   │   ├── memorySummarization.ts # OpenAI-based memory summarization
│   │   ├── engagement.ts    # Daily login tracking, challenge progress, bonuses
│   │   ├── statDegradation.ts # Hunger/happiness/health stat degradation over time
│   │   ├── feeding.ts       # Feeding mechanics with cooldown
│   │   ├── recovery.ts      # Recovery item usage, pet restoration
│   │   ├── warnings.ts      # Health warning generation and management
│   │   ├── skills.ts        # Skill mechanics and proficiency
│   │   ├── skillPrompts.ts  # LLM prompts for skill-based abilities
│   │   ├── chess.ts         # Chess game logic and AI (pure functions)
│   │   ├── marketplace.ts   # Pet marketplace logic (listing, purchasing)
│   │   ├── friends.ts       # Friend system logic
│   │   ├── tutorial.ts      # Tutorial state and progression
│   │   ├── backgroundJobs.ts # Periodic job scheduling
│   │   ├── sync.ts          # Client-server sync state tracking
│   │   ├── syncManager.ts   # Cross-platform sync coordination
│   │   ├── encryption.ts    # Message encryption/decryption at rest
│   │   ├── errorLogger.ts   # Sentry error logging with context
│   │   ├── performanceMonitor.ts # Request timing and monitoring
│   │   ├── petModelConfig.ts # 3D pet configuration for AR rendering
│   │   ├── stripe.ts        # Stripe payment integration
│   │   └── validations/     # Zod schema definitions (subdirectory)
│   │
│   └── __tests__/           # Unit and integration tests (mirror src/ structure)
│       ├── api/            # API route tests (11 test files)
│       ├── components/     # Component tests (11 test files)
│       ├── lib/            # Service layer tests (7 test files)
│       └── setup.test.ts   # Test configuration
│
├── prisma/
│   ├── schema.prisma       # Database schema definition (19 models)
│   ├── migrations/         # Database schema versions (20+ migrations)
│   └── seed.ts            # Seed database with initial data (traits, skills, etc.)
│
├── e2e/                    # End-to-end tests (Playwright)
│   ├── accessibility.spec.ts # Axe-core accessibility testing
│   ├── visual-regression.spec.ts # Percy visual regression
│   ├── load-tests/         # k6 load testing scripts
│   └── (playwright-report/) # Test execution reports
│
├── scripts/
│   └── ralph/              # Utility scripts
│
├── load-tests/             # k6 load testing configurations
│
├── types/                  # TypeScript type definitions (newly created)
│   ├── axe-core-playwright.d.ts
│   ├── percy-playwright.d.ts
│   └── playwright-lighthouse.d.ts
│
├── .github/                # GitHub Actions CI/CD config
│
├── Configuration Files:
│   ├── tsconfig.json       # TypeScript compiler config with path aliases
│   ├── next.config.ts      # Next.js with Sentry integration
│   ├── vitest.config.ts    # Vitest unit test runner config
│   ├── playwright.config.ts # Playwright E2E test config with Percy/axe
│   ├── tailwind.config.ts  # Tailwind CSS configuration
│   ├── postcss.config.mjs  # PostCSS config for Tailwind
│   ├── prisma.config.ts    # Prisma configuration (adapter, generator)
│   ├── sentry.*.config.ts  # Sentry initialization (client, server, edge)
│   ├── .eslintrc.json      # ESLint configuration
│   ├── .env.example        # Environment variable template
│   ├── .env.turso.backup   # Turso/LibSQL database backup
│   └── package.json        # Dependencies and build scripts
│
├── Documentation:
│   ├── README.md
│   ├── DATABASE_SETUP.md
│   ├── DEPLOYMENT.md
│   ├── SENTRY_SETUP.md
│   ├── STRIPE_SETUP.md
│   ├── TESTING.md
│   ├── TEST_UI.md
│   ├── VISUAL_REGRESSION.md
│   ├── LOAD_TESTING.md
│   ├── DESIGN_TRANSFORMATION.md
│   └── DESIGN_TRANSFORMATION.md
│
└── .planning/codebase/     # GSD planning documents
```

## Directory Purposes

**src/app:**
- Purpose: Next.js App Router defining all routes (pages and API endpoints)
- Contains: Page components (.tsx), API route handlers (route.ts), layout definitions
- Key files: `dashboard/page.tsx` (main UI), `api/pets/route.ts`, `api/chat/route.ts`

**src/app/api:**
- Purpose: RESTful API layer handling all data operations and validations
- Contains: 66 endpoint implementations organized by feature domain
- Pattern: Each route.ts file uses try/catch with Zod validation, returns NextResponse JSON
- Example: `/api/pets/route.ts` handles GET (fetch user pets) and POST (create new pet)

**src/components:**
- Purpose: Reusable React UI components for rendering across pages
- Contains: Functional components using React hooks, dynamically imported in dashboard for SSR avoidance
- Key components: PetCard (pet display), ChatInterface (LLM interaction), PetModel3D (3D rendering)
- Characteristics: Most components use `'use client'` directive, some use dynamic() import wrapper

**src/lib:**
- Purpose: Business logic and utility services isolated from UI/API concerns
- Contains: Domain-specific operations (genetics, breeding, engagement, memory) + cross-cutting utilities
- Usage: Imported by API routes and components, never directly by other libraries
- Pattern: Pure functions or async functions with side effects (DB writes), error handling delegated to caller

**src/__tests__:**
- Purpose: Unit and integration tests mirroring src/ structure
- Contains: .test.ts/.test.tsx files for API routes, components, and services
- Runner: Vitest with React Testing Library for components
- Pattern: Test files colocated structure (`__tests__/api/`, `__tests__/components/`, `__tests__/lib/`)

**prisma/:**
- Purpose: Database schema definition and migrations
- Contains: schema.prisma (19 Prisma models), 20+ migration files tracking schema evolution
- Key models: User, Pet, Trait, Skill, Interaction, MemorySummary, MarketplaceListing, Friendship, etc.
- Adapter: LibSQL (Turso) for development, SQLite production support

**e2e/:**
- Purpose: End-to-end tests using Playwright
- Contains: Accessibility tests (axe-core), visual regression (Percy), load tests (k6)
- Execution: `npm run test:e2e`, `npm run test:e2e:ui` for interactive mode
- Reports: Saved to `playwright-report/` after each run

**types/:**
- Purpose: Custom TypeScript type definitions for third-party libraries
- Contains: Type stubs for @axe-core/playwright, @percy/playwright, playwright-lighthouse
- Usage: Imported by test files to provide proper TS support

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` - Root layout component providing page wrapper
- `src/app/dashboard/page.tsx` - Main authenticated dashboard (1421 lines, largest component)
- `src/app/auth/login/page.tsx` - Login page
- `src/app/auth/register/page.tsx` - Registration page

**Configuration:**
- `next.config.ts` - Next.js config with Sentry integration
- `tsconfig.json` - TypeScript config with path aliases (@/components, @/lib)
- `package.json` - Dependencies and npm scripts
- `.env` - Environment variables (secrets - never committed)
- `prisma/schema.prisma` - Database schema

**Core Logic:**
- `src/lib/prisma.ts` - Prisma ORM singleton
- `src/lib/genetics.ts` - Pet genetics system (trait inheritance, rarity)
- `src/lib/breeding.ts` - Breeding mechanics (compatibility, offspring)
- `src/lib/personality.ts` - Personality-to-LLM-prompt conversion
- `src/lib/memory.ts` - Hybrid memory with recent + summarized interactions
- `src/lib/engagement.ts` - Daily login, challenges, rewards
- `src/lib/auth.ts` - Password hashing, JWT handling

**API Routes (High-Impact):**
- `src/app/api/pets/route.ts` - Pet CRUD operations
- `src/app/api/chat/route.ts` - Chat with pet (OpenAI integration)
- `src/app/api/pets/breed/route.ts` - Breeding endpoint
- `src/app/api/pets/feed/route.ts` - Feeding mechanics
- `src/app/api/auth/login/route.ts` - User login
- `src/app/api/auth/register/route.ts` - User registration

**Testing:**
- `src/__tests__/setup.test.ts` - Test configuration and setup
- `src/__tests__/api/pets.test.ts` - Pet API tests (656 lines)
- `src/__tests__/components/PetCard.test.tsx` - Component tests (648 lines)
- `e2e/accessibility.spec.ts` - Accessibility testing
- `e2e/visual-regression.spec.ts` - Visual regression testing
- `playwright.config.ts` - E2E test configuration

## Naming Conventions

**Files:**
- `[feature].ts` - Service/utility modules (genetics.ts, breeding.ts)
- `[name].tsx` - React components (PetCard.tsx, ChatInterface.tsx)
- `[name].test.ts[x]` - Unit/integration tests mirror source file names
- `route.ts` - Next.js API route handlers (exact filename required)
- `page.tsx` - Next.js page component (exact filename required)
- `layout.tsx` - Next.js layout wrapper
- `schema.prisma` - Prisma schema definition
- `[identifier].ts` - Route parameters in dynamic routes (e.g., `[petId]/route.ts`)

**Directories:**
- `src/app/[feature]/` - Feature-based page organization (pets/, auth/, marketplace/)
- `src/lib/` - All business logic and services at top level (no subdirectories except validations/)
- `src/components/` - Components at top level organized alphabetically
- `src/__tests__/[category]/` - Test structure mirrors src/ structure (api/, components/, lib/)
- `prisma/migrations/[timestamp]_[description]/` - Schema migration versioning

**TypeScript/Variables:**
- camelCase - Function and variable names (feedPet, generatePersonalityPrompt)
- PascalCase - Component and interface names (PetCard, PersonalityTraits)
- UPPER_SNAKE_CASE - Constants (FEEDING_COOLDOWN_MINUTES, MAX_RECENT_INTERACTIONS)
- _prefix - Private/internal utilities (rarely used, prefer no prefix)

**API Routes:**
- GET `/api/[resource]` - Fetch resource(s) with ?query parameters
- POST `/api/[resource]` - Create resource or trigger action
- PUT `/api/[resource]` - Update resource (not commonly used in codebase)
- DELETE `/api/[resource]` - Delete resource (limited use)
- Nested routes: `/api/pets/marketplace/buy`, `/api/auth/verify-email`

## Where to Add New Code

**New Feature (e.g., Pet Skills):**
1. Define data model in `prisma/schema.prisma`
2. Run `prisma migrate dev --name add_skill_feature`
3. Create business logic in `src/lib/skills.ts`
4. Create API routes in `src/app/api/skills/route.ts`
5. Create components in `src/components/SkillCard.tsx`, `src/components/SkillPanel.tsx`
6. Create page in `src/app/skills/page.tsx` if needed
7. Add tests: `src/__tests__/lib/skills.test.ts`, `src/__tests__/api/skills.test.ts`

**New Component:**
- Location: `src/components/[ComponentName].tsx`
- Use `'use client'` directive for interactive components
- Import from `@/lib` for any business logic
- Wrap expensive/3D components with `dynamic(() => import(...), { ssr: false })`
- Create test file: `src/__tests__/components/[ComponentName].test.tsx`

**New Utility/Service:**
- Location: `src/lib/[utilityName].ts`
- Export functions and interfaces for reuse
- Include JSDoc comments for public functions
- Import Prisma for database access: `import { prisma } from './prisma'`
- Add tests: `src/__tests__/lib/[utilityName].test.ts`

**New API Endpoint:**
- Location: `src/app/api/[feature]/[action]/route.ts`
- Follow pattern: try/catch with Zod validation
- Call service functions from `src/lib/`
- Return NextResponse.json with appropriate status codes
- Add test: `src/__tests__/api/[feature].test.ts`

**Database Changes:**
1. Modify `prisma/schema.prisma`
2. Run `prisma migrate dev --name [description]`
3. Update service layer if needed
4. Update API routes to use new fields/relations
5. Create migration test if complex

## Special Directories

**prisma/migrations/:**
- Purpose: Track all database schema changes
- Generated: Automatically by `prisma migrate dev`
- Committed: Yes, required for reproducible schema
- Contents: Each migration contains up.sql (apply) and down.sql (rollback) files

**node_modules/:**
- Purpose: Installed dependencies
- Generated: By npm install (from package-lock.json)
- Committed: No
- Size: ~700 directories, do not modify

 **.next/:**
- Purpose: Next.js build output and cache
- Generated: By `npm run build` and dev server
- Committed: No
- Contents: Compiled JS, static assets, server chunks

**e2e/playwright-report/:**
- Purpose: Test execution results and screenshots
- Generated: By Playwright test runner
- Committed: No
- Contents: HTML report, video recordings, screenshots

**.planning/:**
- Purpose: GSD orchestrator planning documents
- Generated: By `/gsd:map-codebase` commands
- Committed: Yes (part of project documentation)
- Contents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, etc.

**.env files:**
- Purpose: Environment-specific configuration (secrets)
- Generated: Manual creation in each environment
- Committed: No (.gitignore prevents accidents)
- Contents: API keys, database URLs, signing keys (never committed)

---

*Structure analysis: 2026-02-09*

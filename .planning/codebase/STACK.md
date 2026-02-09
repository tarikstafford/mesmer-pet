# Technology Stack

**Analysis Date:** 2026-02-09

## Languages

**Primary:**
- TypeScript 5.9.3 - Full codebase (frontend, backend, API routes)
- JavaScript - Configuration files and scripts

**Secondary:**
- SQL - Database queries through Prisma ORM
- CSS - Styling via Tailwind CSS

## Runtime

**Environment:**
- Node.js (latest LTS assumed from `.nvmrc` not found, using next dev)

**Package Manager:**
- npm (present)
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with app router
- React 19.2.4 - UI components and views
- React DOM 19.2.4 - React DOM rendering

**3D Graphics:**
- Three.js 0.182.0 - 3D rendering engine
- @react-three/fiber 9.5.0 - React wrapper for Three.js
- @react-three/drei 10.7.7 - Reusable Three.js components

**Styling:**
- Tailwind CSS 4.1.18 - Utility-first CSS framework
- @tailwindcss/postcss 4.1.18 - PostCSS plugin for Tailwind
- PostCSS 8.5.6 - CSS transformation tool
- autoprefixer 10.4.24 - Vendor prefix auto-generation

**Testing:**
- Vitest 4.0.18 - Unit/component test runner
- @vitest/ui 4.0.18 - Vitest UI dashboard
- @vitest/coverage-v8 4.0.18 - Code coverage reporting
- Playwright 1.58.2 - E2E browser testing
- @axe-core/playwright 4.10.2 - Accessibility testing integration
- @percy/playwright 1.0.7 - Visual regression testing
- @percy/cli 1.30.1 - Percy command-line interface
- @testing-library/react 16.3.2 - React component testing utilities
- @testing-library/jest-dom 6.9.1 - Jest DOM matchers
- happy-dom 20.5.0 - Lightweight DOM implementation
- jsdom 28.0.0 - Full DOM implementation for tests

**Build/Dev:**
- tsx 4.21.0 - TypeScript executor
- ESLint 9.39.2 - Code linting
- eslint-config-next 16.1.6 - Next.js ESLint config
- playwright-lighthouse 4.0.0 - Lighthouse performance testing

## Key Dependencies

**Critical:**
- @prisma/client 7.3.0 - Database ORM client
- @prisma/adapter-libsql 7.3.0 - LibSQL adapter for Prisma
- @libsql/client 0.17.0 - LibSQL database client for Turso

**Authentication & Security:**
- bcryptjs 3.0.3 - Password hashing
- jsonwebtoken 9.0.3 - JWT token generation and verification
- next-auth 5.0.0-beta.30 - Authentication library (beta)

**AI & LLM Integration:**
- openai 6.18.0 - OpenAI API client for chat/personality

**Payment Processing:**
- stripe 20.3.1 - Stripe payment processing SDK

**Error Tracking & Monitoring:**
- @sentry/nextjs 10.38.0 - Sentry error tracking and monitoring

**Utilities:**
- dotenv 17.2.4 - Environment variable loading
- zod 4.3.6 - TypeScript-first schema validation
- lucide-react 0.563.0 - Icon library for React

**Type Definitions:**
- @types/node 25.2.1 - Node.js type definitions
- @types/react 19.2.13 - React type definitions
- @types/react-dom 19.2.3 - React DOM type definitions
- @types/bcryptjs 2.4.6 - bcryptjs type definitions
- @types/jsonwebtoken 9.0.10 - JWT type definitions

## Configuration

**Environment:**
- Environment variables defined in `.env` (local) and `.env.example` (template)
- Required vars: `DATABASE_URL`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SENTRY_DSN`
- Optional vars: `STRIPE_PUBLISHABLE_KEY`, `ENCRYPTION_KEY`, `SMTP_*` (email), `APPLE_IAP_*`, `GOOGLE_PLAY_*`

**Build:**
- `next.config.ts` - Next.js configuration with Sentry integration
- `tsconfig.json` - TypeScript compilation settings (strict mode enabled)
- `postcss.config.mjs` - PostCSS configuration for Tailwind
- `vitest.config.ts` - Vitest test configuration with jsdom environment
- `playwright.config.ts` - Playwright E2E test configuration
- `prisma.config.ts` - Prisma configuration

**Linting:**
- `.eslintrc.json` - ESLint configuration extending Next.js core web vitals

## Database

**Primary Database:**
- SQLite with LibSQL adapter (via Turso)
- Connection: Configured through `DATABASE_URL` environment variable
- Provider: Supports both local SQLite (`file:./prisma/dev.db`) and remote Turso databases
- Adapter: `@prisma/adapter-libsql` enables Prisma with LibSQL

**Schema Location:** `prisma/schema.prisma`

**Migrations:** Located in `prisma/migrations/` directory

**Seeding:** `prisma/seed.ts` - Populates predefined traits, skills, recovery items

**Test Database:** `test.db` (SQLite for unit/integration tests)

## Monitoring & Analytics

**Error Tracking:**
- Sentry DSN configuration in environment
- Client-side: `sentry.client.config.ts`
- Server-side: `sentry.server.config.ts`
- Edge runtime: `sentry.edge.config.ts`
- Next.js Integration: Configured in `next.config.ts` with `withSentryConfig`

**Performance Monitoring:**
- Lighthouse integration via `playwright-lighthouse`
- Percy visual regression testing via `@percy/playwright`

## Instrumentation

**Next.js Instrumentation:**
- Configured in `src/instrumentation.ts`
- Runs background jobs on server startup using Node.js runtime

## Platform Requirements

**Development:**
- Node.js (latest LTS recommended)
- npm package manager
- Modern web browser (Chrome, Firefox, Safari for development)

**Production:**
- Node.js server (Vercel default for Next.js)
- SQLite database or Turso remote database
- Environment variables configured for production

**Testing:**
- Playwright browsers (chromium, firefox, webkit installed)
- Percy account (for visual regression testing)
- Lighthouse CLI (included via playwright-lighthouse)

---

*Stack analysis: 2026-02-09*

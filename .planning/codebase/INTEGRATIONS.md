# External Integrations

**Analysis Date:** 2026-02-09

## APIs & External Services

**OpenAI (LLM):**
- Service: GPT-based language model for pet personality and chat
- SDK/Client: `openai` 6.18.0
- Auth: `OPENAI_API_KEY` environment variable
- Usage:
  - Pet chat responses via `src/app/api/chat/route.ts`
  - Memory summarization via `src/app/api/memory/summarize/route.ts`
  - Personality generation via `src/lib/personality.ts`
- Features: Integrated with pet traits, skills, and memory context

**Stripe (Payments):**
- Service: Payment processing for skill purchases and recovery items
- SDK/Client: `stripe` 20.3.1
- Auth:
  - `STRIPE_SECRET_KEY` (server-side)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client-side)
  - `STRIPE_WEBHOOK_SECRET` (webhook verification)
- Usage:
  - Checkout session creation: `src/lib/stripe.ts`
  - Webhook handler: `src/app/api/webhooks/stripe/route.ts`
  - Checkout endpoint: `src/app/api/checkout/route.ts`
- Webhook Events: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`
- Features: Skill purchases (US-016), recovery item IAP, payment failure logging

## Data Storage

**Databases:**
- **Primary:** SQLite with LibSQL adapter (Turso)
  - Connection: `DATABASE_URL` environment variable
  - Client: Prisma with `@prisma/adapter-libsql`
  - Supports both local SQLite and remote Turso databases
  - Prisma Version: 7.3.0
  - LibSQL Client: 0.17.0
  - Adapter: @prisma/adapter-libsql 7.3.0

**File Storage:**
- Local filesystem only (no cloud storage integration detected)
- Generated files stored in `.next/` directory
- Test data in `test.db` and `dev.db`

**Caching:**
- None detected - relies on database direct queries
- In-memory session management via next-auth

## Authentication & Identity

**Auth Strategy:**
- Custom JWT-based authentication combined with next-auth beta
- Implementation: `src/lib/auth.ts`
- Features:
  - Password hashing with bcryptjs
  - JWT token generation and verification
  - Email verification tokens
  - Session management

**Password Security:**
- Algorithm: bcryptjs (salt rounds: 10)
- Verification: `bcrypt.compare()` for password validation

**Session Management:**
- Method: JWT tokens with 7-day expiration
- Token Generation: `jsonwebtoken` 9.0.3
- Provider Configuration: NextAuth 5.0.0-beta.30

**Database Models for Auth:**
- `User` model: email, password, email verification status
- `Account` model: OAuth provider accounts
- `Session` model: Session tokens with expiration
- `VerificationToken` model: Email verification tokens

## Monitoring & Observability

**Error Tracking:**
- Service: Sentry
- DSN Configuration: `SENTRY_DSN` environment variable (optional)
- Client Setup: `sentry.client.config.ts`
- Server Setup: `sentry.server.config.ts`
- Edge Setup: `sentry.edge.config.ts`
- Features:
  - Session replay (10% sample rate)
  - Error replay (100% on error)
  - Source map upload
  - React component annotation
  - Breadcrumb tracking for user actions
  - Anonymized user context tracking

**Error Categories Logged:**
- LLM API failures: `logLLMFailure()` in `src/lib/errorLogger.ts`
- Payment failures: `logPaymentFailure()` - anonymized by Sentry
- AR session crashes: `logARSessionCrash()`
- General errors: `logError()` with context
- Warnings: `logWarning()`
- Info events: `logInfo()`

**Logs:**
- Console logging (development)
- Sentry integration for production monitoring
- Breadcrumb trails for user action tracking

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from next.config.ts Vercel Cron configuration)
- Alternative: Any Node.js hosting supporting Next.js

**Build Configuration:**
- Build command: `next build`
- Start command: `next start`
- Dev command: `next dev`
- Vercel-specific: `vercel-build` script runs `prisma generate && next build`

**Environment Setup:**
- Database migration on build: Prisma auto-generates client
- Post-install: `prisma generate` runs automatically

## Testing Integrations

**Visual Regression Testing:**
- Service: Percy (by BrowserStack)
- SDK/Client: `@percy/playwright` 1.0.7, `@percy/cli` 1.30.1
- Configuration: `.percy.yml`
- Snapshot Widths: 375px (mobile), 768px (tablet), 1280px (desktop), 1920px (large desktop)
- Features:
  - CSS rules to hide animations
  - Timestamp normalization
  - Asset discovery with font hosting
  - Network idle detection

**Performance Testing:**
- Service: Lighthouse (via Playwright)
- SDK/Client: `playwright-lighthouse` 4.0.0
- Metrics: Web Vitals (FCP, LCP, CLS, etc.)

**Accessibility Testing:**
- Service: Axe-core
- SDK/Client: `@axe-core/playwright` 4.10.2
- Integration: E2E test suite accessibility checks

**Load Testing:**
- Service: k6 (load testing framework)
- Configuration: Scripts in `load-tests/` directory
- Documented in `LOAD_TESTING.md`

## Webhooks & Callbacks

**Incoming Webhooks:**
- Stripe payment webhooks: `src/app/api/webhooks/stripe/route.ts`
  - Endpoint: `/api/webhooks/stripe`
  - Events: Payment completion, expiration, failure
  - Verification: STRIPE_WEBHOOK_SECRET signature validation

**Outgoing Webhooks:**
- Not detected in codebase

## Environment Configuration

**Required Environment Variables:**
- `DATABASE_URL` - Database connection string (SQLite or Turso)
- `OPENAI_API_KEY` - OpenAI API key (sk-...)
- `STRIPE_SECRET_KEY` - Stripe secret key (sk_test_...)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (pk_test_...)
- `ENCRYPTION_KEY` - 32-character hex key for data encryption
- `NEXTAUTH_SECRET` - Secret for JWT token signing (defaults to 'your-secret-key-change-this-in-production')

**Optional Environment Variables:**
- `SENTRY_DSN` - Sentry error tracking endpoint
- `NEXT_PUBLIC_APP_URL` - Application URL (defaults to http://localhost:3000)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - Email service configuration
- `APPLE_IAP_SHARED_SECRET` - Apple In-App Purchase shared secret
- `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` - Google Play service account key path
- `SENTRY_ORG`, `SENTRY_PROJECT` - Sentry organization settings
- `CI` - CI/CD environment flag

**Secrets Location:**
- Development: `.env` file (git-ignored)
- Template: `.env.example` (committed to repo with placeholder values)
- Production: Vercel Environment Variables or hosting provider secrets

## Third-Party Dependencies Overview

**Payment & Monetization:**
- Stripe (online payments)
- iOS Apple IAP (commented/optional)
- Android Google Play (commented/optional)

**AI & Intelligence:**
- OpenAI (chat, personality, memory summarization)

**Observability:**
- Sentry (error tracking, monitoring, session replay)
- Percy (visual regression testing)
- Lighthouse (performance testing)

**Authentication:**
- NextAuth v5 (OAuth/session management)
- bcryptjs (password hashing)
- jsonwebtoken (JWT tokens)

**Data Management:**
- Prisma (ORM)
- LibSQL/Turso (database provider)

---

*Integration audit: 2026-02-09*

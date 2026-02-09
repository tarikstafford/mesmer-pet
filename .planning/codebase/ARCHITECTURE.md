# Architecture

**Analysis Date:** 2026-02-09

## Pattern Overview

**Overall:** Next.js App Router with API routes serving a React client, backed by Prisma ORM with SQLite database

**Key Characteristics:**
- Server-side rendering with dynamic client-side enhancements (SSR + SSG)
- Full-stack TypeScript implementation
- REST API layer handling all data operations
- Modular service layer organized by domain (pets, breeding, memory, engagement, etc.)
- Hybrid memory system combining recent interactions with LLM-summarized history
- Event-driven engagement tracking system
- Genetics-based pet breeding simulation

## Layers

**Presentation Layer:**
- Purpose: React components rendering UI, client-side state management, 3D AR visualization
- Location: `src/components/`, `src/app/`
- Contains: React components (PetCard.tsx, ARPetViewer.tsx, ChatInterface.tsx), page components for routes
- Depends on: API routes via fetch/HTTP, utility libraries (lucide-react, three.js, @react-three/fiber)
- Used by: Next.js routing system, browser clients

**API Layer:**
- Purpose: RESTful endpoints for all data operations, request validation, auth checks
- Location: `src/app/api/`
- Contains: 66 route.ts files organized by resource (pets/, auth/, memory/, chat/, marketplace/, breeding/, etc.)
- Depends on: Service layer, Prisma ORM, OpenAI API, Sentry error tracking
- Used by: Client-side components, external integrations

**Service/Business Logic Layer:**
- Purpose: Domain-specific operations and calculations (genetics, breeding, engagement, memory, feeding, etc.)
- Location: `src/lib/`
- Contains: 30+ utility modules including genetics.ts, breeding.ts, engagement.ts, memory.ts, personality.ts, skills.ts, feeding.ts, marketplace.ts, recovery.ts, sync.ts
- Depends on: Prisma ORM, OpenAI, encryption utilities, database models
- Used by: API routes, background jobs

**Data Layer:**
- Purpose: Database schema definition and ORM abstraction
- Location: `prisma/schema.prisma`, `src/lib/prisma.ts`
- Contains: Prisma models for User, Pet, Trait, Skill, Interaction, MemorySummary, GameState, Marketplace models
- Depends on: SQLite database via LibSQL adapter, environment configuration
- Used by: All service and API layer code via prisma client singleton

**Infrastructure/Cross-cutting:**
- Purpose: Error logging, performance monitoring, authentication, sync state management
- Location: `src/lib/errorLogger.ts`, `src/lib/performanceMonitor.ts`, `src/lib/auth.ts`, `src/lib/sync.ts`, `src/lib/syncManager.ts`
- Depends on: Sentry, bcryptjs, jsonwebtoken
- Used by: API routes and service layer

## Data Flow

**Pet Chat Interaction:**

1. User submits message in ChatInterface component (`src/components/ChatInterface.tsx`)
2. POST request to `/api/chat` with { petId, userId, message }
3. API route validates request and fetches pet with traits/skills from database via Prisma
4. Service layer generates:
   - Personality prompt from pet traits (`src/lib/personality.ts`)
   - Memory context combining recent interactions + summarized history (`src/lib/memory.ts`)
   - Skill-based prompts for active pet abilities (`src/lib/skillPrompts.ts`)
5. Combined prompt sent to OpenAI API (gpt-4o-mini)
6. LLM response stored as interaction in database (encrypted at rest)
7. Engagement metrics updated if chatting completes daily challenges (`src/lib/engagement.ts`)
8. Response returned to client, sync state updated (`src/lib/sync.ts`)

**Pet Breeding Flow:**

1. User selects two compatible pets in breed UI
2. POST request to `/api/pets/breed` with { pet1Id, pet2Id, userId }
3. Breeding service validates cooldowns, compatibility, genetic data (`src/lib/breeding.ts`)
4. Genetics engine generates offspring traits via inheritance/mutation (`src/lib/genetics.ts`)
5. New pet created with parent references and genetic traits in database
6. Both parents' breeding cooldown timestamp updated
7. Trait system links random inherited/mutated traits to new pet
8. Response includes family tree data for visualization

**Memory Management:**

1. Each chat interaction stored as Interaction record with encrypted content
2. Background job monitors for interactions older than 30 days
3. Summarization service calls OpenAI to condense old interactions (`src/lib/memorySummarization.ts`)
4. Summary stored in MemorySummary table with period reference
5. Old interactions optionally pruned to maintain performance
6. Memory context builder retrieves recent interactions + summaries when building LLM prompt

**Daily Engagement & Stat Degradation:**

1. Background jobs run periodically via startBackgroundJobs() (`src/lib/backgroundJobs.ts`)
2. Daily login processing tracks streaks and awards bonuses (`src/lib/engagement.ts`)
3. Stat degradation calculation runs: hunger increases, happiness decreases over time (`src/lib/statDegradation.ts`)
4. Health warnings generated if stats reach threshold (`src/lib/warnings.ts`)
5. Critical state triggered if health reaches 0 - blocks chat/interactions
6. Recovery items can restore pet to healthy state (`src/lib/recovery.ts`)

**Marketplace System:**

1. User lists pet for sale: POST `/api/pets/marketplace/list` with price
2. Listing stored in database as MarketplaceListing
3. Other users browse active listings: GET `/api/pets/marketplace/listings`
4. Purchase triggers payment via Stripe (`src/lib/stripe.ts`)
5. On successful payment, pet ownership transferred, listing closed
6. Seller receives transaction history record

**State Synchronization:**

1. Every mutation tracked in sync system (`src/lib/sync.ts`)
2. Client maintains lastSyncTimestamp
3. Cross-platform sync via sync endpoint ensures consistency across devices (`src/lib/syncManager.ts`)
4. Conflict resolution uses last-write-wins for simple operations

**State Management:**

- Client-side: React component state (hooks) for UI interactions
- Server-side: Persistent state in SQLite, Prisma manages relationships
- Session state: JWT tokens for auth, stored in HTTP-only cookies
- Real-time state: Engagement/sync state communicated via API responses

## Key Abstractions

**Pet Model:**
- Purpose: Core domain entity representing virtual pets with stats, traits, genetics
- Examples: `src/lib/genetics.ts`, `src/lib/personality.ts`, `src/lib/breeding.ts`
- Pattern: Services accept Pet objects, perform calculations, return updates to be persisted via Prisma

**Trait System:**
- Purpose: Genetic inheritance mechanism for visual/personality/skill traits with rarity tiers
- Examples: `prisma/schema.prisma` (Trait, PetTrait models)
- Pattern: Traits assigned by rarity distribution, inherited during breeding with mutation chance

**Memory Context:**
- Purpose: Hybrid approach combining full recent interactions with summarized historical context
- Examples: `src/lib/memory.ts` (storeInteraction, getMemoryContext, formatMemoryForPrompt)
- Pattern: Recent 50 interactions stored fully, older ones summarized by OpenAI, both formatted for LLM

**Engagement Challenges:**
- Purpose: Daily/weekly progress tracking with rewards bonuses
- Examples: `src/lib/engagement.ts` (processDailyLogin, updateChallengeProgress)
- Pattern: UserChallenge records track progress, daily login processing calculates streak bonuses

**Marketplace Listing:**
- Purpose: Enable peer-to-peer pet trading with Stripe payment integration
- Examples: `src/lib/marketplace.ts`, `/api/pets/marketplace/` routes
- Pattern: Listing lifecycle (create → browse → purchase → complete → archive)

**Skill Activation:**
- Purpose: Unlock gameplay features for pets (chess, art, sports, education)
- Examples: `src/lib/skillPrompts.ts`, `src/lib/chess.ts`, UserSkill/PetSkill models
- Pattern: User purchases skill globally, pet individually activates with proficiency tracking

**Recovery System:**
- Purpose: Prevent pet death with consumable items that restore health/stats
- Examples: `src/lib/recovery.ts`, RecoveryItem/UserRecoveryItem models
- Pattern: Items purchasable or earnable, consumed on use, temporary health restoration

## Entry Points

**Web Application:**
- Location: `src/app/layout.tsx`
- Triggers: Browser navigation to https://mesmer-app.vercel.app
- Responsibilities: Root layout providing CookieConsent component, metadata, rendering child pages

**Authentication Routes:**
- Location: `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx`
- Triggers: New/returning user access
- Responsibilities: User credential handling, NextAuth integration, session establishment

**Dashboard/Main Experience:**
- Location: `src/app/dashboard/page.tsx` (1421 lines - largest component)
- Triggers: Authenticated user accessing main app
- Responsibilities: Pet management UI, dynamically imported components (PetModel3D, ChatInterface, FamilyTree, ChessBoard)

**API Entry Points:**
- POST `/api/pets` - Create new pet
- GET `/api/pets?userId=xxx` - Fetch user's pets
- POST `/api/chat` - Send message to pet
- POST `/api/pets/breed` - Breed two pets
- POST `/api/pets/feed` - Feed pet
- GET/POST `/api/pets/marketplace/*` - Marketplace operations
- POST `/api/auth/login`, `/api/auth/register` - User authentication
- POST `/api/tutorial/*` - Tutorial progression tracking
- POST `/api/memory/store`, `/api/memory/[petId]`, `/api/memory/summarize` - Memory operations
- GET `/api/admin` - Admin dashboard (requires isAdmin flag)

**Background Jobs:**
- Location: `src/lib/backgroundJobs.ts`
- Triggers: Application startup
- Responsibilities: Periodic stat degradation, memory summarization, daily login processing

## Error Handling

**Strategy:** Layered error catching with Sentry integration for production monitoring

**Patterns:**
- API routes wrap try/catch blocks, return 4xx/5xx JSON responses with user-friendly messages
- Service functions throw errors that bubble to API layer
- logError() calls in catch blocks send structured error info to Sentry (`src/lib/errorLogger.ts`)
- Client receives either resolved data or error object with status code
- Critical errors (LLM failures) logged separately via logLLMFailure()
- Fallback responses provided for degraded service (e.g., critical pet cannot chat)

## Cross-Cutting Concerns

**Logging:**
- Approach: Sentry for production error tracking, console logging in development
- Implementation: `src/lib/errorLogger.ts` - logError() includes context (component, action, userId)
- LLM-specific logging via logLLMFailure() tracks API failures and token usage

**Validation:**
- Approach: Zod schema validation at API layer before processing
- Implementation: API routes define z.object() schemas for request bodies, call safeParse()
- Returns 400 with validation error details if schema fails

**Authentication:**
- Approach: NextAuth for session-based auth, JWT tokens for custom endpoints
- Implementation: `src/lib/auth.ts` (hashPassword, verifyPassword, generateToken, verifyToken)
- Admin auth via isAdmin flag in User model, verified by adminAuth.ts
- API routes check userId query param + pet ownership before operations

**Authorization:**
- Approach: Owner-based verification (userId from token matches pet.userId)
- Implementation: Pet fetch followed by comparison, 403 Unauthorized returned if mismatch
- Admin operations require admin role verification via isUserAdmin()

**Data Encryption:**
- Approach: At-rest encryption for sensitive data (interactions/messages)
- Implementation: `src/lib/encryption.ts` - encrypt()/decrypt() functions using crypto
- Applied to Interaction.message and Interaction.context fields for privacy compliance (US-030)

**Performance Monitoring:**
- Approach: Custom monitoring for pet loading and LLM requests
- Implementation: `src/lib/performanceMonitor.ts` - monitorPetLoad(), monitorLLMRequest()
- Tracks load times, reports slow operations to Sentry

---

*Architecture analysis: 2026-02-09*

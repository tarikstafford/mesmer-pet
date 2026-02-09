# Codebase Concerns

**Analysis Date:** 2026-02-09

## Tech Debt

**Missing Email Verification Implementation:**
- Issue: Email verification is skipped in MVP - verification tokens are created but never sent via email
- Files: `src/app/api/auth/register/route.ts` (line 59)
- Impact: Users are automatically verified without confirming email ownership, creating security and GDPR compliance risk
- Fix approach: Implement email sending (e.g., Resend, SendGrid) with verification link logic; enforce email verification before account activation

**Disabled Cron Job Authentication:**
- Issue: Memory summarization endpoint (`/api/memory/summarize`) has authentication check commented out
- Files: `src/app/api/memory/summarize/route.ts` (lines 17-20)
- Impact: Any unauthenticated request can trigger memory summarization job, consuming resources and potentially causing DoS
- Fix approach: Uncomment and implement proper CRON_SECRET validation; use environment variable for webhook authorization

**Type Safety Issues with `as any` Casts:**
- Issue: Multiple instances of unsafe `as any` type assertions bypass TypeScript safety
- Files:
  - `src/app/admin/page.tsx` (lines 238, 341)
  - `src/app/api/chat/route.ts` (lines 163, 199-200)
  - `src/app/api/pets/route.ts` (line 69)
  - `src/app/api/pets/breed/route.ts` (lines 128-129)
  - `src/components/ARPetViewer.tsx` (lines 306, 410, 510)
- Impact: Silent type errors, reduced IDE support, harder to refactor, potential runtime failures
- Fix approach: Create proper TypeScript types for API responses; use type guards instead of casts; leverage type narrowing

**Untyped State in Dashboard Component:**
- Issue: Critical state variables use `any` type (`user`, `healthSummary`, `tutorialProgress`)
- Files: `src/app/dashboard/page.tsx` (lines 162, 179, 182)
- Impact: No autocomplete, potential runtime errors, maintenance burden
- Fix approach: Create comprehensive interface definitions for all dashboard state; use discriminated unions for complex state

**localStorage Access Without SSR Guards:**
- Issue: Direct localStorage access in multiple components without SSR environment checks
- Files: `src/lib/syncManager.ts`, `src/components/ChatInterface.tsx`, `src/app/dashboard/page.tsx`
- Impact: Potential hydration mismatches causing runtime errors in Next.js; breaks during SSR
- Fix approach: Add explicit `typeof window !== 'undefined'` guards; consider moving to client boundary with proper lazy loading

## Known Bugs

**Dashboard Component Size and Complexity:**
- Symptoms: Page loads slowly with many dynamic imports; potential performance degradation with multiple pets
- Files: `src/app/dashboard/page.tsx` (1421 lines total)
- Trigger: Dashboard initialization with multiple pets and real-time data fetches
- Workaround: Create separate sub-pages for each major feature; split into smaller presentational components

**Multiple API Calls in Dashboard Pet Fetch:**
- Symptoms: N+1 query pattern for pet warnings and personality summaries
- Files: `src/app/dashboard/page.tsx` (lines 250-269)
- Trigger: Fetching pets - initiates one request per pet for warnings + one per pet for personality
- Workaround: None currently - backend should aggregate this data in single query
- Impact: Scales poorly; if user has 10 pets, makes 21 API calls instead of 1

**Race Condition in SyncManager:**
- Symptoms: Concurrent sync operations may process same offline actions twice if sync triggers before completion
- Files: `src/lib/syncManager.ts` (line 92: `if (this.isSyncing || !this.isOnline)`)
- Trigger: Multiple rapid network changes or concurrent sync() calls
- Workaround: SyncManager has `isSyncing` flag, but doesn't lock queue modifications
- Impact: Duplicate actions on server (double feeding, duplicate stat updates)

**Test Database Files Committed:**
- Symptoms: `test.db` and `test.db-journal` appear in working directory with test data
- Files: `test.db` (556K), `test.db-journal` (77K)
- Trigger: Test execution leaves database artifacts
- Impact: Pollutes git history, takes up space, may conflict across branches
- Fix approach: Add `test.db*` to `.gitignore`; use temporary test database paths

## Security Considerations

**Unvalidated User Ownership Checks:**
- Risk: Some endpoints validate pet ownership loosely; relying on client-provided userId without strong verification
- Files: `src/app/api/chat/route.ts` (lines 50-56 has check, but others don't)
- Current mitigation: Auth token must match userId in database
- Recommendations:
  - Always extract userId from verified JWT token, never trust client-provided userId
  - Implement middleware to enforce this pattern across all protected routes
  - Add comprehensive ownership validation tests

**localStorage Contains Sensitive Auth Token:**
- Risk: Authentication token stored in plain localStorage vulnerable to XSS attacks
- Files: `src/components/BreedingRequestsPanel.tsx`, `src/lib/syncManager.ts`, `src/app/friends/page.tsx`
- Current mitigation: Token-based auth, no password stored client-side
- Recommendations:
  - Consider httpOnly cookies instead of localStorage
  - Implement Content Security Policy (CSP) headers
  - Add token expiration and refresh logic

**Stripe Webhook Signature Verification:**
- Risk: Webhook handler correctly verifies signatures, but handling is overly broad
- Files: `src/app/api/webhooks/stripe/route.ts` (lines 30, 39-75)
- Current mitigation: `constructWebhookEvent()` validates signature; metadata validation present
- Recommendations:
  - Add additional idempotency checks beyond existing duplicate check (line 100)
  - Log all webhook events for audit trail
  - Implement retry logic with exponential backoff for database failures

**API Routes Missing Rate Limiting:**
- Risk: No rate limiting on public endpoints; vulnerable to brute force and DoS
- Files: All `/api/*` routes
- Current mitigation: None detected
- Recommendations:
  - Implement rate limiting middleware (e.g., upstash-ratelimit)
  - Different limits for authenticated vs. anonymous requests
  - Add CAPTCHA to registration/login endpoints

**Password Hashing Implementation:**
- Risk: Using `bcryptjs` which is acceptable, but no evidence of salt rounds configuration
- Files: `src/lib/auth.ts` (hashPassword function)
- Current mitigation: bcryptjs handles salt generation
- Recommendations:
  - Verify salt rounds >= 10; document configuration
  - Consider upgrading to `argon2` for better security

## Performance Bottlenecks

**Unoptimized Pet Trait Loading:**
- Problem: Fetching all pet traits and skills with full relationships for every pet query
- Files: `src/app/api/pets/route.ts` (lines 93-106)
- Cause: Eager loading of all nested relationships without pagination or field selection
- Current impact: Slow dashboard load; SQLite doesn't handle complex joins well
- Improvement path:
  - Implement selective field loading with Prisma select
  - Add pagination for traits if > 10
  - Cache trait definitions separately (they're shared)

**Chat Interface AI Processing:**
- Problem: Full memory context, personality, and skill prompt generation for every message
- Files: `src/app/api/chat/route.ts` (lines 72-120)
- Cause: All context regenerated from scratch; no caching of stable data
- Current impact: ~500-1000ms additional latency per chat message
- Improvement path:
  - Cache personality prompt (doesn't change often)
  - Cache skill prompts (only change on skill assignment)
  - Implement token counting to stay under OpenAI context limits

**Background Job Performance:**
- Problem: Stat degradation updates all pets sequentially every 15 minutes
- Files: `src/lib/backgroundJobs.ts` (lines 56-80)
- Cause: Using `Promise.all()` with unbounded pet count; no batch processing
- Current impact: With 100+ users * 10 pets = 1000 database updates every 15 minutes
- Improvement path:
  - Batch updates in chunks of 50-100
  - Add jitter to prevent thundering herd at interval boundary
  - Consider moving to serverless job queue (e.g., Bull, Quirrel)

**3D Model Rendering Not Optimized:**
- Problem: ARPetViewer renders complex 3D geometry every frame
- Files: `src/components/ARPetViewer.tsx` (full component)
- Cause: No geometry caching, redundant material recreation on every render
- Current impact: High CPU usage on mobile devices, battery drain
- Improvement path:
  - Move material creation outside useFrame
  - Implement geometry pooling
  - Add LOD (level of detail) system for mobile

**Dashboard Multiple Concurrent Async Calls:**
- Problem: Pet fetching, recovery items, tutorial progress, and admin status all fetch independently
- Files: `src/app/dashboard/page.tsx` (useEffect starting at line 185)
- Cause: Four separate fetch calls with no batching or caching
- Current impact: Slower initial load; unnecessary requests on page refresh
- Improvement path:
  - Create single `/api/dashboard/summary` endpoint
  - Implement react-query or SWR for deduplication and caching
  - Add response streaming for large payloads

## Fragile Areas

**Tutorial State Management:**
- Files: `src/app/dashboard/page.tsx` (tutorial-related state: lines 181-182), `src/components/TutorialOverlay.tsx`
- Why fragile: Tutorial progress tracked in localStorage and database separately; no synchronization mechanism
- Safe modification: Always verify tutorial state in useEffect with both sources before rendering
- Test coverage: Gaps in offline scenario testing; missing edge case for simultaneous updates from different tabs
- Risk: Tutorial can get stuck; users may complete steps but state doesn't reflect it

**Breeding System Genetics Logic:**
- Files: `src/lib/genetics.ts`, `src/app/api/pets/breed/route.ts`
- Why fragile: Complex genetic inheritance calculations with multiple trait combinations
- Safe modification: Add comprehensive unit tests for edge cases (recessive traits, legendary rarity, mutation odds)
- Test coverage: Some coverage exists but missing edge case tests
- Risk: Users could get unexpected pet traits; fairness concerns in randomization

**Memory Summarization Job:**
- Files: `src/lib/memorySummarization.ts`, `src/lib/backgroundJobs.ts`
- Why fragile: Job runs daily but has no deduplication; could summarize same memory twice if triggered twice
- Safe modification: Check summary creation timestamp before processing; add job lock mechanism
- Test coverage: Missing tests for concurrent job execution
- Risk: Duplicate memory summaries; wasted API tokens

**Sync State Recovery After Network Failure:**
- Files: `src/lib/syncManager.ts`
- Why fragile: Offline queue stored in localStorage without corruption detection
- Safe modification: Add checksums to queue; validate before processing
- Test coverage: Missing tests for storage quota exceeded scenarios
- Risk: Lost offline actions if localStorage corrupted or quota exceeded

**Admin Skill Management:**
- Files: `src/app/admin/page.tsx` (547 lines), multiple admin API routes
- Why fragile: No access control for admin endpoints - only checks if request succeeds
- Safe modification: Implement middleware that verifies user.isAdmin from JWT; audit all admin operations
- Test coverage: Missing tests for unauthorized admin attempts
- Risk: User with valid token could become admin; privilege escalation vulnerability

## Scaling Limits

**SQLite Database Choice:**
- Current capacity: Single file, ~500K-1MB per heavy user; works for MVP
- Limit: Hits bottleneck at ~10,000+ concurrent users or 1M+ total records
- Scaling path:
  - Migrate to PostgreSQL for multi-client support
  - Implement read replicas for reporting
  - Add connection pooling with Supabase or Neon

**In-Memory Background Job Timers:**
- Current capacity: Single process, runs all jobs sequentially
- Limit: With 1000+ pets, stat update job takes >30 seconds, backs up next run
- Scaling path:
  - Move to serverless cron (Vercel Cron, AWS Lambda)
  - Use job queue with multiple workers (Bull, RabbitMQ)
  - Implement distributed locking to prevent duplicate runs

**Chat Memory Context:**
- Current capacity: ~5000 tokens per chat message for context (personality + memory + skills)
- Limit: OpenAI API has 128K token limit; supporting 20+ simultaneous chats hits limits
- Scaling path:
  - Implement sliding context window
  - Cache and reuse personality summaries across users
  - Use cheaper models for less critical interactions

**Client-Side Offline Queue:**
- Current capacity: localStorage limited to 5-10MB typically
- Limit: With ~1KB per offline action, max ~5000-10000 queued actions
- Scaling path:
  - Implement IndexedDB for larger storage (50-100MB)
  - Add compression for queued actions
  - Implement cleanup of old queue entries

## Dependencies at Risk

**OpenAI API Integration:**
- Risk: Hard dependency on OpenAI API; if service unavailable, all chat/personality features fail
- Impact: 30% of core feature set blocked; memory summarization stalls
- Migration plan:
  - Add fallback to local LLM option (Ollama, together.ai)
  - Implement graceful degradation (pre-computed personalities)
  - Add circuit breaker pattern to fail faster

**Next Auth Beta Version:**
- Risk: Using `next-auth@5.0.0-beta.30` - not stable; security fixes may not be backported
- Impact: Potential authentication vulnerabilities; breaking API changes
- Migration plan:
  - Schedule upgrade to stable version before production
  - Monitor beta release notes for security patches
  - Add comprehensive auth integration tests

**Three.js for 3D Rendering:**
- Risk: Large dependency (770KB); breaks on older browsers without WebGL
- Impact: Poor mobile support; high memory usage
- Mitigation:
  - Implement fallback 2D sprite rendering
  - Add feature detection for WebGL
  - Consider replacing with Babylon.js (better mobile support)

**Prisma LibSQL Adapter:**
- Risk: New adapter; not all Prisma features fully supported
- Impact: Complex queries may fail; migrations might be unreliable
- Mitigation:
  - Keep database migrations tested before deployment
  - Monitor Prisma-LibSQL compatibility releases
  - Have manual SQL fallback for complex queries

## Missing Critical Features

**Email Notifications System:**
- Problem: No email sent for friend requests, breeding success, account creation, or password reset
- Blocks: Full user engagement loop; users unaware of important game events
- Impact: Player retention likely affected; friend system unusable
- Priority: High - needed before multiplayer launch

**Input Validation on Many Endpoints:**
- Problem: Several API routes accept user input but only validate required fields, not data type/range
- Blocks: Potential for invalid data in database; inconsistent state
- Impact: Data integrity issues; unexpected behavior
- Priority: High - security and reliability risk

**Audit Logging for Admin Actions:**
- Problem: No logging of admin operations (skill creation, user modifications)
- Blocks: Compliance reporting; security investigation
- Impact: Can't track who changed what; potential for malicious admin activity
- Priority: Medium - regulatory requirement for production

**Data Privacy Deletion Workflow:**
- Problem: `deletionRequestedAt` field exists but deletion is not actually implemented
- Blocks: GDPR compliance; users cannot exercise right to be forgotten
- Impact: Legal liability; regulatory violation
- Priority: Critical - must implement before EU launch

## Test Coverage Gaps

**API Authentication and Authorization:**
- What's not tested: Edge cases in token validation; user ownership across all endpoints
- Files: All `/api/*` routes lack comprehensive auth tests
- Risk: Authorization bypass not caught until production
- Priority: High

**Offline Sync Edge Cases:**
- What's not tested: Network failures during queue processing; localStorage corruption; offline queue overflow
- Files: `src/lib/syncManager.ts`
- Risk: Data loss or duplication in offline scenarios
- Priority: High

**Genetics Trait Inheritance Edge Cases:**
- What's not tested: Legendary trait inheritance odds; mutation probabilities; multi-generation breeding
- Files: `src/lib/genetics.ts`
- Risk: Unfair gameplay; exploitable breeding patterns
- Priority: Medium

**Background Job Concurrency:**
- What's not tested: Two jobs running simultaneously; job failure recovery; database transaction rollback
- Files: `src/lib/backgroundJobs.ts`
- Risk: Race conditions; data corruption; stat inconsistencies
- Priority: High

**AR Viewer on Various Devices:**
- What's not tested: WebGL support detection; performance on low-end devices; battery drain
- Files: `src/components/ARPetViewer.tsx`
- Risk: App crashes on incompatible devices; poor user experience
- Priority: Medium (covered by e2e tests but need real device testing)

**Payment Flow Idempotency:**
- What's not tested: Duplicate webhook deliveries; network retry scenarios; expired sessions
- Files: `src/app/api/webhooks/stripe/route.ts`, `src/app/api/checkout/route.ts`
- Risk: Duplicate skill grants; user confusion about payments
- Priority: Critical

---

*Concerns audit: 2026-02-09*

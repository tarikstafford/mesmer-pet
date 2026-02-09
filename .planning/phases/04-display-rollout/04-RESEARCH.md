# Phase 4: Display Rollout - Research

**Researched:** 2026-02-09
**Domain:** React component replacement, Next.js client components, visual regression testing, SVG performance optimization
**Confidence:** HIGH

## Summary

Phase 4 replaces the current 3D polygon pet rendering (`PetModel3D`) with the enhanced 2D SVG system (`AnimatedPetSVG`) across all display contexts. The codebase currently uses dynamic imports of `PetModel3D` across 6+ pages (dashboard, marketplace, breeding, friends), requiring careful replacement to avoid layout regressions and maintain visual consistency.

The core challenge is a component migration across multiple pages while preserving layout dimensions, loading states, and user experience. Modern React patterns recommend the "Strangler Fig" approach: replace components incrementally by display context, validate each context for visual regressions, then remove old components once rollout is complete.

Key findings: (1) `PetModel3D` is dynamically imported with SSR disabled across all contexts, (2) SVG components render on server by default in Next.js App Router but need 'use client' for animations, (3) visual regression testing via Percy prevents layout shifts during replacement, (4) existing component props (traitNames, health, width, height) map cleanly to new `AnimatedPetSVG` interface but require database trait field access.

**Primary recommendation:** Replace `PetModel3D` imports with `AnimatedPetSVG` one context at a time (dashboard → cards → marketplace → breeding → friends), validate each replacement with visual regression tests, add feature flag for gradual rollout if needed, and maintain loading state parity to prevent layout shift.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 | Client/server component system | Already in stack, supports 'use client' directive for interactive components |
| React.memo | 19.2.4 | Component memoization | Already used in PetSVG, prevents re-renders on trait changes |
| Percy (Playwright) | 1.0.7 | Visual regression testing | Already in devDependencies, detects pixel-level layout changes |
| Dynamic imports | Native | Code splitting for heavy components | Already used for PetModel3D, same pattern for AnimatedPetSVG |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| AnimatedPetSVG | Internal | Enhanced pet rendering with animations | Already built in Phase 3, direct replacement for PetModel3D |
| PetSVG | Internal | Base SVG rendering without animations | Use when animations not needed (static contexts) |
| loadTraits | Internal | Database trait loading/validation | Already built in Phase 3, use in all pet display components |
| Playwright | 1.58.2 | E2E testing framework | Already in stack, validate replacement behavior |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct replacement | Feature flags (environment variables) | Feature flags add complexity but enable gradual rollout and A/B testing. Use if phased rollout across user base needed (not required for internal milestone). |
| Percy visual testing | Manual screenshot comparison | Manual testing misses pixel-level regressions. Percy automates detection but adds CI/CD dependency. Worth it for layout-critical replacement. |
| AnimatedPetSVG everywhere | Conditional rendering (3D for AR, 2D elsewhere) | Keeping both systems adds maintenance burden. Full replacement simpler unless 3D explicitly required for future AR features. Current ARPetViewer uses separate AR system. |

**Installation:**
No new packages required - all dependencies already in stack.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── pet-svg/
│   │   ├── PetSVG.tsx              # Base SVG (Phase 1)
│   │   ├── AnimatedPetSVG.tsx      # Animated wrapper (Phase 3)
│   │   └── layers/                 # Layer components
│   ├── PetCard.tsx                 # UPDATE: Replace PetModel3D import
│   ├── MarketplaceCard.tsx         # UPDATE: Add pet rendering
│   └── PetModel3D.tsx              # DEPRECATE after rollout complete
├── app/
│   ├── dashboard/page.tsx          # UPDATE: Replace inline PetModel3D
│   ├── marketplace/page.tsx        # UPDATE: Pass traits to MarketplaceCard
│   ├── breed/page.tsx              # UPDATE: Replace PetModel3D in selection
│   └── friends/                    # UPDATE: Replace in friend pet views
└── lib/
    └── traits/
        ├── migration.ts            # loadTraits utility (Phase 3)
        └── types.ts                # PetTraits interface
```

### Pattern 1: Component Replacement Strategy (Strangler Fig)

**What:** Replace `PetModel3D` imports with `AnimatedPetSVG` incrementally by display context, validating each replacement before moving to next context.

**When to use:** All pet display locations in Phase 4 rollout.

**Example:**
```tsx
// BEFORE (current state):
import dynamic from 'next/dynamic'

const PetModel3D = dynamic(() => import('@/components/PetModel3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-gray-400">Loading 3D model...</div>
    </div>
  ),
})

// Usage in component:
<PetModel3D traitNames={visualTraitNames} health={health} width={350} height={280} />

// AFTER (Phase 4 replacement):
import { AnimatedPetSVG } from '@/components/pet-svg/AnimatedPetSVG'
import { loadTraits } from '@/lib/traits/migration'

// In component function:
const traits = loadTraits(pet.traits, pet.id) // Load from database JSON field

// Render:
<div className="w-full h-64 flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-lg">
  <AnimatedPetSVG
    petId={pet.id}
    traits={traits}
    size="large"
    className="w-[350px] h-[280px]"
  />
</div>
```

**Key differences:**
- `PetModel3D` takes `traitNames` (string array), `AnimatedPetSVG` takes `traits` (PetTraits object)
- `PetModel3D` uses dynamic import (client-side only), `AnimatedPetSVG` uses 'use client' directive (hydrates on client)
- `PetModel3D` has custom loading state, `AnimatedPetSVG` renders immediately (SVG is lightweight)
- Size prop changed from `width/height` numbers to `size` enum ('small' | 'medium' | 'large')

Sources:
- [Replacing jQuery with React: a pragmatic migration plan](https://marsbased.com/blog/2026/01/08/replacing-jquery-with-react-a-pragmatic-migration-plan-with-real-estimates)
- [Modernizing a React Application: A Phased Approach](https://medium.com/@sriram_in/modernizing-a-react-application-a-phased-approach-to-backend-migration-and-frontend-refactoring-bf170caf79ef)

### Pattern 2: Database Trait Access

**What:** Access pet traits from database JSON field (added in Phase 2) and validate/migrate using `loadTraits` utility before rendering.

**When to use:** Every location that displays a pet (dashboard, cards, marketplace, etc.).

**Example:**
```tsx
// In page component fetching pets from API:
const response = await fetch(`/api/pets?userId=${userId}`)
const data = await response.json()
const pets = data.pets // Each pet has `traits` JSON field

// In render:
{pets.map((pet) => {
  // Validate and migrate traits (handles null, undefined, version mismatches)
  const validTraits = loadTraits(pet.traits, pet.id)

  return (
    <AnimatedPetSVG
      key={pet.id}
      petId={pet.id}
      traits={validTraits}
      size="medium"
    />
  )
})}
```

**Key insight:** `loadTraits` utility built in Phase 3 handles all edge cases (missing traits, invalid JSON, version migrations, fallback generation). Always use it instead of direct trait access.

Source: Phase 3 implementation (03-01-PLAN.md)

### Pattern 3: Layout Preservation

**What:** Match existing layout dimensions and spacing when replacing `PetModel3D` to prevent visual regressions.

**When to use:** All replacement contexts to maintain visual continuity.

**Example:**
```tsx
// BEFORE: PetModel3D in dashboard
<div className="mb-6 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-2xl overflow-hidden shadow-inner border-2 border-purple-200">
  <Suspense fallback={
    <div className="w-full h-72 flex items-center justify-center">
      <div className="text-gray-400 animate-pulse">Loading 3D model...</div>
    </div>
  }>
    <PetModel3D traitNames={visualTraitNames} health={pet.health} width={350} height={280} autoRotate={true} />
  </Suspense>
</div>

// AFTER: AnimatedPetSVG with same layout
<div className="mb-6 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-2xl overflow-hidden shadow-inner border-2 border-purple-200">
  <div className="w-full h-72 flex items-center justify-center">
    <AnimatedPetSVG
      petId={pet.id}
      traits={loadTraits(pet.traits, pet.id)}
      size="large"
      className="w-[350px] h-[280px]"
    />
  </div>
</div>
```

**Critical:** Preserve container classes (`mb-6`, `bg-gradient-to-br`, `rounded-2xl`, etc.) and dimensions (`h-72`, `w-[350px]`) to prevent layout shift.

Sources:
- [Visual Regression Testing for React with Chromatic](https://oneuptime.com/blog/post/2026-01-15-visual-regression-testing-react-chromatic/view)
- [Percy: Detects layout shifts and styling issues](https://www.browserstack.com/guide/visual-testing-for-react-apps)

### Pattern 4: Loading State Handling

**What:** Replace heavy 3D loading states with instant SVG rendering, but maintain loading UI for data fetching.

**When to use:** All contexts that currently use `PetModel3D` dynamic import with loading fallback.

**Example:**
```tsx
// BEFORE: Dynamic import with loading state for 3D component
const PetModel3D = dynamic(() => import('@/components/PetModel3D'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-100 h-64 rounded-lg" />,
})

// AFTER: Remove component-level loading (SVG loads instantly)
// But keep data-level loading if fetching pet data:
{loading ? (
  <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg animate-pulse">
    <div className="text-gray-400">Loading pet...</div>
  </div>
) : (
  <AnimatedPetSVG
    petId={pet.id}
    traits={loadTraits(pet.traits, pet.id)}
    size="large"
  />
)}
```

**Key insight:** SVG components render instantly (no bundle splitting needed), so only show loading state while fetching pet data from API, not during component mount.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Visual regression detection | Manual screenshot comparison scripts | Percy (already in devDependencies) | Percy automates pixel-level comparison, handles responsive viewports, integrates with CI/CD. Manual scripts miss subtle regressions. |
| Component lazy loading | Custom code splitting logic | Next.js dynamic imports (already used) | Next.js handles bundle splitting, prefetching, loading states automatically. Custom solutions risk SEO and performance issues. |
| Trait validation | Manual JSON parsing/validation | loadTraits utility (Phase 3) | loadTraits handles version migrations, missing fields, fallback generation, and edge cases tested in Phase 3. Don't reimplement. |
| Feature flags | Custom environment variable system | Keep it simple - use direct replacement | Feature flags add complexity (toggle logic, A/B testing, gradual rollout). Only needed for user-facing rollouts. Phase 4 is internal milestone - direct replacement simpler. |

**Key insight:** Existing infrastructure (Percy, loadTraits, dynamic imports) handles all rollout needs. Focus implementation on component replacement, not tooling.

## Common Pitfalls

### Pitfall 1: Forgetting 'use client' Directive

**What goes wrong:** AnimatedPetSVG uses client-side hooks (useState, useEffect) for animations. If imported into Server Component without 'use client', Next.js throws hydration errors.

**Why it happens:** Next.js App Router defaults to Server Components. AnimatedPetSVG has 'use client' at top, but pages importing it might not.

**How to avoid:**
1. Verify AnimatedPetSVG.tsx has 'use client' at line 1 (already present from Phase 3)
2. When importing into page component, page can be Server Component (children can be client)
3. If page uses client features (useState, etc.), add 'use client' to page

**Warning signs:**
- Error: "You're importing a component that needs useState. It only works in a Client Component..."
- Animations don't work (page renders but pets don't breathe/blink)

Source: [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)

### Pitfall 2: Layout Shift During Replacement

**What goes wrong:** Replacing PetModel3D with AnimatedPetSVG causes cards to resize, breaking grid layouts or causing visual jumps.

**Why it happens:**
1. PetModel3D has fixed width/height props (e.g., width={350} height={280})
2. AnimatedPetSVG uses size prop ('small' | 'medium' | 'large') with different default dimensions
3. Container dimensions not preserved during replacement

**How to avoid:**
1. Always wrap AnimatedPetSVG in container with explicit height (e.g., `h-64`, `h-72`)
2. Use className to match old PetModel3D dimensions: `className="w-[350px] h-[280px]"`
3. Preserve all container classes (padding, background, borders)
4. Run Percy visual tests before/after replacement to catch pixel-level shifts

**Warning signs:**
- Cards different sizes after replacement
- Grid layouts break (e.g., 3-column becomes 2-column)
- Scrollbar appears/disappears
- Content jumps when pets load

Source: [Percy: AI-powered visual testing detects layout shifts](https://www.browserstack.com/guide/visual-testing-for-react-apps)

### Pitfall 3: Missing Trait Data Handling

**What goes wrong:** Some pets in database have `traits: null` (created before Phase 2 migration). Direct trait access causes render errors.

**Why it happens:**
1. Migration backfill (Phase 2) might have missed pets or failed on some records
2. New code assumes traits always present
3. No fallback generation for null traits

**How to avoid:**
1. ALWAYS use `loadTraits(pet.traits, pet.id)` - never access `pet.traits` directly
2. loadTraits handles null/undefined/invalid JSON and generates fallback traits deterministically
3. If replacing PetCard component, verify it uses loadTraits pattern
4. Run database query to find pets with null traits before rollout: `SELECT COUNT(*) FROM Pet WHERE traits IS NULL`

**Warning signs:**
- "Cannot read property 'bodyColor' of null" errors
- White polygon fallback appears (PetSVG showFallback=true)
- Some pets render, others show error boundary

Source: Phase 3-01 implementation (loadTraits utility design)

### Pitfall 4: Performance Regression with Many Pets

**What goes wrong:** Dashboard with 10+ pets becomes sluggish after replacement (ironically, SVG should be faster than 3D).

**Why it happens:**
1. AnimatedPetSVG runs animation timers (breathing, blinking) for each pet
2. Without React.memo, pets re-render on every parent state change
3. Many simultaneous animations thrash requestAnimationFrame

**How to avoid:**
1. AnimatedPetSVG already uses React.memo (via PetSVG), but parent components must pass stable props
2. Use useMemo for trait objects: `const traits = useMemo(() => loadTraits(pet.traits, pet.id), [pet.traits, pet.id])`
3. For 20+ pets, consider viewport culling (render only visible pets) - defer to Phase 5
4. Profile with React DevTools Profiler before/after replacement

**Warning signs:**
- Frame rate drops below 60fps on dashboard
- CPU usage spikes with many pets visible
- Scroll lag when scrolling past pet grid

Sources:
- [React.memo best practices](https://react.dev/reference/react/memo)
- [SVG Performance Optimization: Sprite systems for multiple instances](https://strapi.io/blog/mastering-react-svg-integration-animation-optimization)

## Code Examples

Verified patterns from existing codebase:

### Example 1: Dashboard Pet Card Replacement

**Current implementation** (src/app/dashboard/page.tsx lines 981-990):
```tsx
<div className="mb-6 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-2xl overflow-hidden shadow-inner border-2 border-purple-200">
  <Suspense fallback={
    <div className="w-full h-72 flex items-center justify-center">
      <div className="text-gray-400 animate-pulse">Loading 3D model...</div>
    </div>
  }>
    <PetModel3D traitNames={visualTraitNames} health={pet.health} width={350} height={280} autoRotate={true} />
  </Suspense>
</div>
```

**Replacement implementation:**
```tsx
'use client'

import { AnimatedPetSVG } from '@/components/pet-svg/AnimatedPetSVG'
import { loadTraits } from '@/lib/traits/migration'
import { useMemo } from 'react'

// In component body:
const validatedTraits = useMemo(
  () => loadTraits(pet.traits, pet.id),
  [pet.traits, pet.id]
)

// In render:
<div className="mb-6 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-2xl overflow-hidden shadow-inner border-2 border-purple-200">
  <div className="w-full h-72 flex items-center justify-center">
    <AnimatedPetSVG
      petId={pet.id}
      traits={validatedTraits}
      size="large"
      className="w-[350px] h-[280px]"
    />
  </div>
</div>
```

**Changes:**
1. Removed Suspense (SVG loads instantly, no dynamic import needed)
2. Removed PetModel3D import
3. Added AnimatedPetSVG import
4. Added loadTraits call with useMemo
5. Changed props: traitNames → traits, width/height → size + className
6. Kept container dimensions identical to prevent layout shift

### Example 2: MarketplaceCard Enhancement

**Current implementation** (src/components/MarketplaceCard.tsx):
```tsx
// No pet rendering - just placeholder or static image
{petImage && (
  <div className="pet-image mb-4">
    <img
      src={petImage}
      alt={petName}
      className="w-full h-48 object-cover rounded-xl"
    />
  </div>
)}
```

**Enhanced implementation:**
```tsx
'use client'

import { AnimatedPetSVG } from '@/components/pet-svg/AnimatedPetSVG'
import { loadTraits } from '@/lib/traits/migration'
import type { PetTraits } from '@/lib/traits/types'

interface MarketplaceCardProps {
  listingId: string
  petName: string
  petId: string          // ADD: petId for animations
  petTraits: PetTraits  // ADD: trait data from API
  price: number
  // ... other props
}

// In component:
<div className="pet-display mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl overflow-hidden shadow-inner border-2 border-purple-200">
  <div className="w-full h-48 flex items-center justify-center">
    <AnimatedPetSVG
      petId={petId}
      traits={loadTraits(petTraits, petId)}
      size="medium"
      className="w-48 h-48"
    />
  </div>
</div>
```

**Changes:**
1. Added petId and petTraits props to MarketplaceCard interface
2. Replaced static image with AnimatedPetSVG
3. Kept h-48 container height to match original layout
4. Used size="medium" for card context (smaller than dashboard)

**API changes needed:**
- Marketplace API endpoint must return pet traits: `GET /api/marketplace/listings`
- Include `traits` JSON field in pet data response

### Example 3: PetCard Component Integration

**Current implementation** (src/components/PetCard.tsx lines 243-252):
```tsx
<div className="mb-6 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-2xl overflow-hidden shadow-inner border-2 border-purple-200">
  <Suspense fallback={
    <div className="w-full h-72 flex items-center justify-center">
      <div className="text-gray-400 animate-pulse">Loading 3D model...</div>
    </div>
  }>
    <PetModel3D traitNames={visualTraitNames} health={health} width={350} height={280} autoRotate={true} />
  </Suspense>
</div>
```

**Replacement implementation:**
```tsx
'use client'

import { AnimatedPetSVG } from '@/components/pet-svg/AnimatedPetSVG'
import { loadTraits } from '@/lib/traits/migration'
import type { PetTraits } from '@/lib/traits/types'
import { useMemo } from 'react'

// Add to PetCardProps interface:
interface PetCardProps {
  id: string
  name: string
  health: number
  petTraits: PetTrait[]
  // ... existing props
  rawTraits?: PetTraits  // ADD: raw traits JSON from database
}

// In component body:
const validatedTraits = useMemo(() => {
  // If rawTraits provided, use them; otherwise derive from petTraits
  if (rawTraits) {
    return loadTraits(rawTraits, id)
  }
  // Fallback: generate from petId (deterministic)
  return loadTraits(null, id)
}, [rawTraits, id])

// In render:
<div className="mb-6 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-2xl overflow-hidden shadow-inner border-2 border-purple-200">
  <div className="w-full h-72 flex items-center justify-center">
    <AnimatedPetSVG
      petId={id}
      traits={validatedTraits}
      size="large"
      className="w-[350px] h-[280px]"
    />
  </div>
</div>
```

**Changes:**
1. Added rawTraits optional prop (PetCard might receive full pet object or minimal data)
2. useMemo ensures stable trait object (prevents re-renders)
3. Fallback to null triggers deterministic generation in loadTraits
4. Container structure preserved exactly

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 3D polygon pets (Three.js/R3F) | 2D SVG with animations | Phase 3 (2026-02-09) | Lighter bundle (-30KB Three.js), faster rendering, server-side compatible |
| traitNames string array | PetTraits typed object | Phase 1 (2026-02-09) | Type safety, validation, version migrations |
| Direct trait access | loadTraits utility | Phase 3 (2026-02-09) | Handles null/invalid/old versions gracefully |
| Dynamic imports everywhere | 'use client' directive | Next.js 13+ App Router | Server/client separation, better SSR, smaller bundles |
| Manual visual testing | Percy automated screenshots | DevOps standard 2025+ | Catches pixel-level regressions, CI/CD integration |

**Deprecated/outdated:**
- PetModel3D component: Will be removed after Phase 4 rollout complete (keep as backup during Phase 4)
- visualTraitNames extraction: No longer needed (AnimatedPetSVG takes full traits object)
- Three.js/R3F for pet display: Only used in ARPetViewer now (separate AR system)

## Open Questions

### Question 1: Should we keep PetModel3D for 3D AR contexts?

**What we know:**
- ARPetViewer (src/components/ARPetViewer.tsx) uses PetModel3D for 3D AR display
- AR context needs 3D rendering for realistic spatial placement
- Current Phase 4 scope: Replace "white polygons" in 2D UI contexts

**What's unclear:**
- Does "all contexts" include ARPetViewer, or just 2D UI?
- Requirements say "replace all white polygon placeholders" - is AR included?

**Recommendation:**
- Phase 4 scope: Replace PetModel3D in 2D contexts only (dashboard, cards, marketplace, breeding, friends)
- Keep PetModel3D for ARPetViewer (AR display is separate feature, not a "placeholder")
- Phase 5: Evaluate if ARPetViewer needs enhanced traits or stays with current 3D system
- Rationale: AR feature is working, out of scope for "placeholder replacement"

### Question 2: Do all marketplace listings have trait data?

**What we know:**
- Phase 2 backfill added traits to all existing pets
- New pets auto-generate traits on creation
- loadTraits handles null traits with deterministic fallback

**What's unclear:**
- Does marketplace API endpoint return pet trait data?
- Current MarketplaceCard takes petImage (string) - does API provide traits?

**Recommendation:**
- Before implementing DISPLAY-03 (marketplace listings), verify API endpoint
- Run: `GET /api/marketplace/listings` and check response format
- If traits missing: Update API to include `traits` field in response
- If traits present: Proceed with MarketplaceCard enhancement
- Fallback: loadTraits generates from petId if traits unavailable

### Question 3: Performance target for Phase 4 vs Phase 5?

**What we know:**
- Phase 5 explicitly handles performance validation (PERF-01 through PERF-05)
- Phase 4 success criteria: "No visual regressions in layout or sizing"
- No FPS requirements in Phase 4

**What's unclear:**
- Should Phase 4 include basic performance testing, or defer all to Phase 5?
- If replacement causes FPS drop, is that a Phase 4 blocker or Phase 5 optimization?

**Recommendation:**
- Phase 4: Basic smoke test (dashboard with 10 pets should not freeze)
- Phase 4: Profile before/after replacement to detect major regressions
- Phase 5: Formal 60fps validation, viewport culling, optimization
- Rationale: Phase 4 validates replacement works, Phase 5 optimizes it

## Sources

### Primary (HIGH confidence)
- Next.js Official Docs: [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- React Official Docs: [React.memo API](https://react.dev/reference/react/memo)
- Strapi: [Master React SVG Integration, Animation and Optimization](https://strapi.io/blog/mastering-react-svg-integration-animation-optimization)
- Phase 3 Research: .planning/phases/03-animation-persistence/03-RESEARCH.md
- Existing codebase: src/app/dashboard/page.tsx, src/components/PetCard.tsx, src/components/MarketplaceCard.tsx

### Secondary (MEDIUM confidence)
- MarsBased: [Replacing jQuery with React: a pragmatic migration plan (with real estimates)](https://marsbased.com/blog/2026/01/08/replacing-jquery-with-react-a-pragmatic-migration-plan-with-real-estimates)
- Medium: [Modernizing a React Application: A Phased Approach to Backend Migration and Frontend Refactoring](https://medium.com/@sriram_in/modernizing-a-react-application-a-phased-approach-to-backend-migration-and-frontend-refactoring-bf170caf79ef)
- BrowserStack: [Visual Testing for React Apps](https://www.browserstack.com/guide/visual-testing-for-react-apps)
- OneUpTime: [Visual Regression Testing for React with Chromatic](https://oneuptime.com/blog/post/2026-01-15-visual-regression-testing-react-chromatic/view)

### Tertiary (LOW confidence)
- Builder.io: [15 Best React UI Libraries for 2026](https://www.builder.io/blog/react-component-libraries-2026) - General component library trends, not specific to replacement patterns
- LogRocket: [A guide to using SVGs in React](https://blog.logrocket.com/guide-svgs-react/) - SVG integration basics covered in Phase 1/3

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools already in project, verified in package.json
- Architecture: HIGH - Patterns verified against existing codebase (dashboard, PetCard)
- Pitfalls: HIGH - Based on Next.js App Router known issues and Phase 3 learnings
- Open questions: MEDIUM - Require verification before implementation (AR scope, API traits)

**Research date:** 2026-02-09
**Valid until:** 60 days (stable domain - React/Next.js patterns, SVG optimization)
**Codebase snapshot:** Phase 3 complete (AnimatedPetSVG built, trait persistence working)

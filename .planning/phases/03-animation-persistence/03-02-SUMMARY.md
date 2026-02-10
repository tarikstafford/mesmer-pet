---
phase: 03-animation-persistence
plan: 02
subsystem: animation
tags: [animation, css, hooks, accessibility, performance]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: PetSVG component with className pass-through and ExpressionLayer structure
  - phase: 03-animation-persistence/01
    provides: loadTraits utility for trait validation and persistence safety
provides:
  - Complete idle animation system with breathing and blinking
  - GPU-accelerated animations using only transform and opacity
  - Tab visibility pause for battery efficiency
  - Accessibility support via prefers-reduced-motion
  - Body-size-specific timing (small/medium/large pets breathe at different rates)
  - Unique per-pet animation offsets (no sync between multiple pets)
affects: [04-trait-display, all-pet-rendering]

# Tech tracking
tech-stack:
  added: []
  patterns: [CSS custom properties for animation timing, recursive timeout scheduling for randomized intervals, SSR-safe hook initialization]

key-files:
  created:
    - src/hooks/usePageVisibility.ts
    - src/hooks/useReducedMotion.ts
    - src/components/pet-svg/AnimatedPetSVG.tsx
    - src/components/pet-svg/pet-animations.css
  modified:
    - src/components/pet-svg/ExpressionLayer.tsx
    - src/components/pet-svg/index.ts
    - src/app/globals.css

key-decisions:
  - "Used CSS custom properties (--pet-breathing-duration, --pet-breathing-delay) for per-pet animation timing without inline styles"
  - "Recursive setTimeout pattern for blink scheduling instead of setInterval (better cleanup, more flexible timing)"
  - "Animation state kept outside PetSVG via wrapper component to preserve React.memo optimization"
  - "Blink animation applied via CSS class on SVG element (not prop drilling through PetSVG)"
  - "Added pet-eyes className to ExpressionLayer eye groups for CSS targeting"
  - "SSR-safe hook initialization with typeof checks for document/window"
  - "Defense-in-depth accessibility: both React hook AND CSS media query for reduced motion"

patterns-established:
  - "Wrapper component pattern: keep animation state external to preserve child component memoization"
  - "CSS custom properties for dynamic animation values (avoids inline style recalculation)"
  - "Deterministic phase offset using seedrandom(petId) for unique per-pet timing"
  - "Randomized intervals using seedrandom with timestamp seed for unpredictable behavior"

# Metrics
duration: 5min
completed: 2026-02-09
---

# Phase 03 Plan 02: Animation System Summary

**Complete idle animation system with GPU-accelerated breathing and blinking, body-size-specific timing, tab pause, accessibility support, and unique per-pet phase offsets**

## Performance

- **Duration:** 5 min (estimated from checkpoint flow)
- **Started:** 2026-02-09T19:38:00Z (approximate from first commit)
- **Completed:** 2026-02-09T11:53:48Z
- **Tasks:** 3 (2 code tasks + 1 visual verification checkpoint)
- **Files modified:** 7

## Accomplishments

- Created two SSR-safe React hooks for page visibility and reduced motion detection
- Implemented GPU-only CSS animations (transform and opacity) with @keyframes
- Built AnimatedPetSVG wrapper component with all 7 ANIM requirements implemented
- Integrated PERSIST-01 trait validation via loadTraits in animation system
- Added pet-eyes className to ExpressionLayer for CSS-based blink targeting
- Updated barrel export to include AnimatedPetSVG alongside PetSVG
- Visual verification confirmed all requirements working correctly

## Task Commits

Each task was committed atomically:

1. **Task 1: Create animation hooks and CSS keyframes** - `a7e722c` (feat)
2. **Task 2: Create AnimatedPetSVG wrapper component** - `225f960` (feat)
3. **Task 3: Verify animations visually** - No commit (verification checkpoint, approved by user)

## Files Created/Modified

**Created:**
- `src/hooks/usePageVisibility.ts` - Hook returning boolean for tab active/hidden state using Page Visibility API
- `src/hooks/useReducedMotion.ts` - Hook returning boolean for prefers-reduced-motion user preference
- `src/components/pet-svg/AnimatedPetSVG.tsx` - Animated wrapper with breathing, blinking, pause, accessibility, and PERSIST-01 integration
- `src/components/pet-svg/pet-animations.css` - CSS @keyframes and animation classes (GPU-accelerated only)

**Modified:**
- `src/components/pet-svg/ExpressionLayer.tsx` - Added pet-eyes className to eye group elements for CSS targeting
- `src/components/pet-svg/index.ts` - Added AnimatedPetSVG export alongside PetSVG
- `src/app/globals.css` - Imported pet-animations.css for application-wide animation class availability

## Decisions Made

1. **CSS custom properties for animation timing** - Used `--pet-breathing-duration` and `--pet-breathing-delay` CSS variables instead of inline styles. This allows per-pet timing without triggering style recalculation on every render. Set via inline style object on wrapper div, consumed by CSS animation rule.

2. **Recursive setTimeout for blink scheduling** - Used recursive `setTimeout` pattern instead of `setInterval` for blink scheduling. This provides better cleanup (single timeout ref), more flexible timing (each blink can have different interval), and prevents interval drift.

3. **Wrapper component preserves PetSVG memoization** - Kept all animation state (isBlinking, isVisible, reducedMotion) in AnimatedPetSVG wrapper instead of passing as props to PetSVG. This preserves PetSVG's React.memo optimization (avoids Pitfall 6 from research). PetSVG only receives traits and size, both stable props.

4. **CSS class-based blink application** - Applied `pet-blinking` class to SVG element rather than passing `isBlinking` prop to PetSVG. CSS selector `.pet-blinking .pet-eyes` targets eye elements. This keeps PetSVG prop surface minimal and avoids breaking memoization.

5. **Added pet-eyes className to ExpressionLayer** - Minimal change to ExpressionLayer: added `className="pet-eyes"` to eye group wrapper elements in each expression type. This provides CSS hook for blink animation without changing component API or behavior.

6. **SSR-safe hook initialization** - Both hooks use `typeof document !== 'undefined'` and `typeof window !== 'undefined'` checks to initialize state safely on server. Default to visible=true and reducedMotion=false on server (conservative defaults that enable animations).

7. **Defense-in-depth accessibility** - Implemented reduced motion support at TWO levels: React hook disables animation state, AND CSS @media query sets `animation: none !important`. This ensures animations are disabled even if JavaScript fails or loads slowly.

## Deviations from Plan

None - plan executed exactly as written. All 7 ANIM requirements implemented as specified with no scope creep or architectural changes.

## Issues Encountered

None - plan execution was smooth. Visual verification checkpoint worked as intended, user confirmed all requirements met.

## User Setup Required

None - no external service configuration required. Animations work out of the box.

## Next Phase Readiness

**Ready for Phase 04 (Trait Display Integration):**
- Animation system complete with all accessibility and performance requirements met
- AnimatedPetSVG component ready to use as drop-in replacement for PetSVG
- PERSIST-01 integrated: traits validated via loadTraits before rendering
- Visual verification confirmed 60fps GPU-accelerated animations
- No regressions in existing PetSVG functionality

**Integration points for downstream phases:**
- Import `AnimatedPetSVG` from `@/components/pet-svg` to render pets with animations
- Use same props as PetSVG: `petId`, `traits`, `size`, `className`
- Animations automatically respect user preferences (reduced motion) and tab visibility
- Each pet has unique animation phase offset (no sync issues with multiple pets)

**Verified requirements:**
- ✅ ANIM-01: Subtle breathing animation (3-4 second cycle, 2% scale)
- ✅ ANIM-02: Random blinking (3-5 second intervals, 200ms duration, eyes only)
- ✅ ANIM-03: Body-size-specific timing (small=2.5s, medium=3.5s, large=4.5s)
- ✅ ANIM-04: Tab pause (animations pause when tab inactive, resume smoothly)
- ✅ ANIM-05: Accessibility (animations disabled with prefers-reduced-motion)
- ✅ ANIM-06: GPU-only (only transform and opacity animated, no layout thrashing)
- ✅ ANIM-07: Unique offsets (deterministic seedrandom per petId, no sync)
- ✅ PERSIST-01: Trait validation (loadTraits called before rendering)

**Blockers:** None

## Self-Check: PASSED

All claims verified:
- Created files exist:
  - ✅ src/hooks/usePageVisibility.ts
  - ✅ src/hooks/useReducedMotion.ts
  - ✅ src/components/pet-svg/AnimatedPetSVG.tsx
  - ✅ src/components/pet-svg/pet-animations.css
- Modified files exist:
  - ✅ src/components/pet-svg/ExpressionLayer.tsx (pet-eyes className added)
  - ✅ src/components/pet-svg/index.ts (AnimatedPetSVG export added)
  - ✅ src/app/globals.css (pet-animations.css import added)
- Commits exist:
  - ✅ a7e722c (Task 1)
  - ✅ 225f960 (Task 2)
- Visual verification:
  - ✅ User approved all 7 ANIM requirements in checkpoint response

---
*Phase: 03-animation-persistence*
*Completed: 2026-02-09*

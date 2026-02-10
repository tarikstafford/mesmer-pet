# Phase 5: Performance & Quality - Research

**Researched:** 2026-02-10
**Domain:** React Performance Optimization, SVG Animation Performance, Quality Validation
**Confidence:** HIGH

## Summary

Phase 5 focuses on ensuring the AnimatedPetSVG system maintains 60fps (16ms per frame) across single-pet and multi-pet scenarios, implementing viewport culling for large grids (20+ pets), and validating visual quality through automated testing of color harmony and pet distinctiveness.

The existing codebase already implements GPU-accelerated animations (transform/opacity only), Page Visibility API pausing, and prefers-reduced-motion accessibility. Research confirms these are industry best practices. The primary optimization needs are React component memoization, Intersection Observer viewport culling, and automated visual/color validation.

React 19 is in use (package.json shows react@19.2.4), which includes improved automatic batching and transitions. However, manual memoization with React.memo, useMemo, and useCallback remains critical for scenarios with 10+ simultaneously rendered pets, as the React Compiler (which would automate this) is not yet production-ready.

**Primary recommendation:** Use React.memo on AnimatedPetSVG and PetSVG, implement react-intersection-observer for viewport culling, measure performance with React Profiler API + requestAnimationFrame FPS monitoring, and validate quality with programmatic color harmony checks + Percy visual regression testing.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | UI framework | Already in use; includes performance features like automatic batching |
| react-intersection-observer | latest (9.x) | Viewport culling | Most popular React wrapper for Intersection Observer API (lightweight, 1.5KB gzipped) |
| seedrandom | 3.0.5 | Deterministic PRNG | Already in use for trait generation; ensures consistent animation offsets per pet |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-fps-stats | latest | Real-time FPS monitoring | Development/debugging only; displays current/min/max FPS + graph overlay |
| @percy/playwright | 1.0.7 | Visual regression | Already in package.json; validates color combinations and pet distinctiveness at scale |
| @axe-core/playwright | 4.10.2 | Accessibility testing | Already in package.json; validates prefers-reduced-motion and Page Visibility compliance |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-intersection-observer | Custom useIntersectionObserver hook | Library handles edge cases (SSR, cleanup, ref management) better than most custom implementations |
| Percy | Chromatic, Applitools | Percy already integrated; has AI-powered diffing to filter animation noise |
| React Profiler API | Chrome DevTools Performance tab | Profiler API allows programmatic measurement in tests; DevTools for manual investigation |

**Installation:**
```bash
npm install react-intersection-observer
npm install --save-dev react-fps-stats
```

(Percy and Axe already installed per package.json)

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── pet-svg/
│       ├── AnimatedPetSVG.tsx          # Memoized wrapper with animations
│       ├── PetSVG.tsx                   # Memoized pure SVG renderer
│       ├── LazyPetGrid.tsx              # NEW: Viewport culling wrapper for grids
│       └── pet-animations.css           # GPU-only animations
├── hooks/
│   ├── usePageVisibility.ts             # Already exists
│   ├── useReducedMotion.ts              # Already exists
│   └── useFPSMonitor.ts                 # NEW: Dev-only FPS tracking
├── lib/
│   └── traits/
│       ├── colorHarmony.ts              # Already exists
│       ├── validation.ts                # Enhance for color contrast testing
│       └── generation.ts                # Already exists
└── __tests__/
    ├── performance/
    │   ├── fps-benchmark.test.ts        # NEW: Automated FPS testing
    │   └── memory-leak.test.ts          # NEW: Mount/unmount cycle testing
    └── quality/
        ├── color-harmony.test.ts        # NEW: Validate 1000+ color samples
        └── visual-regression.test.ts    # NEW: Percy snapshot tests
```

### Pattern 1: React.memo with Shallow Prop Comparison
**What:** Wrap components in React.memo to skip re-renders when props unchanged
**When to use:** For components that render frequently but receive identical props
**Example:**
```typescript
// Source: https://react.dev/reference/react/memo
import { memo } from 'react';

// PetSVG should be memoized - traits object rarely changes
export const PetSVG = memo(function PetSVG({ traits, size, className }) {
  // Pure rendering logic
  return <svg>...</svg>;
});

// AnimatedPetSVG should be memoized - petId and traits stable
export const AnimatedPetSVG = memo(function AnimatedPetSVG({
  petId,
  traits,
  size,
  className
}) {
  // Animation state logic
  return <PetSVG traits={validatedTraits} size={size} />;
});
```

### Pattern 2: Viewport Culling with Intersection Observer
**What:** Only render pet components when they're near the viewport
**When to use:** Grids with 20+ pets (PERF-03 requirement)
**Example:**
```typescript
// Source: https://github.com/thebuilder/react-intersection-observer
import { useInView } from 'react-intersection-observer';

function LazyPet({ petId, traits }) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px', // Start rendering 200px before visible
    triggerOnce: false   // Re-cull when scrolled out of view
  });

  return (
    <div ref={ref} className="pet-container">
      {inView ? (
        <AnimatedPetSVG petId={petId} traits={traits} />
      ) : (
        <div className="pet-placeholder" /> // Maintain layout
      )}
    </div>
  );
}
```

### Pattern 3: FPS Monitoring with requestAnimationFrame
**What:** Track frame times to detect performance regressions
**When to use:** Development and automated performance tests
**Example:**
```typescript
// Source: https://www.growingwiththeweb.com/2017/12/fast-simple-js-fps-counter.html
function useFPSMonitor() {
  const [fps, setFps] = useState(60);
  const times = useRef<number[]>([]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    let rafId: number;
    const measureFPS = () => {
      const now = performance.now();

      // Remove timestamps older than 1 second
      while (times.current.length > 0 && times.current[0] <= now - 1000) {
        times.current.shift();
      }

      times.current.push(now);
      setFps(times.current.length);

      rafId = requestAnimationFrame(measureFPS);
    };

    rafId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return fps;
}
```

### Pattern 4: React Profiler for Render Timing
**What:** Measure component render durations programmatically
**When to use:** Automated performance testing, CI/CD validation
**Example:**
```typescript
// Source: https://react.dev/reference/react/Profiler
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: "mount" | "update" | "nested-update",
  actualDuration: number,
  baseDuration: number
) {
  console.log(`${id} ${phase}: ${actualDuration.toFixed(2)}ms`);

  // Fail test if single pet render exceeds 16ms (PERF-01)
  if (id === 'single-pet' && actualDuration > 16) {
    throw new Error(`Render time ${actualDuration}ms exceeds 16ms budget`);
  }
}

// In test
<Profiler id="single-pet" onRender={onRenderCallback}>
  <AnimatedPetSVG petId="test-pet-1" traits={traits} />
</Profiler>
```

### Pattern 5: useMemo for Expensive Calculations
**What:** Cache computed values that depend on stable inputs
**When to use:** Color generation, trait validation, animation timing calculations
**Example:**
```typescript
// Source: https://react.dev/reference/react/useMemo
// Already implemented in AnimatedPetSVG.tsx
const validatedTraits = useMemo(
  () => loadTraits(traits, petId),
  [traits, petId]
);

const breathingDuration = useMemo(() => {
  switch (validatedTraits.bodySize) {
    case 'small': return 2.5;
    case 'large': return 4.5;
    default: return 3.5;
  }
}, [validatedTraits.bodySize]);
```

### Anti-Patterns to Avoid
- **Creating objects/arrays in render:** New references break React.memo. Use useMemo or pass primitives instead.
- **JavaScript-driven animations:** Avoid setInterval/setTimeout for animation loops. Use CSS animations (GPU thread) or requestAnimationFrame.
- **Deep equality checks in arePropsEqual:** Expensive and can cause more slowdown than re-rendering. Prefer shallow comparison or restructure props.
- **Premature optimization:** Don't memoize everything. Profile first, optimize bottlenecks second.
- **Intersection Observer without rootMargin:** Start rendering 100-200px before visible to avoid pop-in during scroll.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Intersection Observer React hook | Custom useIntersectionObserver with ref callbacks, cleanup logic, SSR guards | react-intersection-observer (9.x) | Handles edge cases: SSR, ref forwarding, cleanup, TypeScript types, triggerOnce optimization |
| FPS monitoring | Manual requestAnimationFrame loop with state updates | react-fps-stats or useFPSMonitor pattern | Timestamps queue pattern is subtle (need 1-second sliding window, not interval-based counting) |
| Color contrast validation | Manual luminance calculation from HSL | Existing colorHarmony.ts + extend with WCAG checks | HSL-to-relative-luminance math has precision edge cases; color science is complex |
| Performance budgets | Custom performance.mark/measure parsing | Lighthouse budgets + Playwright integration | Lighthouse already installed (playwright-lighthouse@4.0.0 in package.json); handles metric aggregation |

**Key insight:** React performance tools (memo, useMemo, Profiler) are built-in and battle-tested. Intersection Observer API is standard but needs React wrapper for proper lifecycle management. Visual testing requires tooling (Percy) to handle cross-browser rendering differences and animation frame timing.

## Common Pitfalls

### Pitfall 1: Object Props Breaking React.memo
**What goes wrong:** Parent component creates new object/array/function on every render, causing memoized child to re-render despite "same" data
**Why it happens:** JavaScript reference equality (`Object.is`) - `{x:1} !== {x:1}` even though values identical
**How to avoid:**
- Pass primitive props when possible (`name={pet.name} age={pet.age}` not `pet={pet}`)
- Wrap objects in useMemo: `const person = useMemo(() => ({name, age}), [name, age])`
- Wrap functions in useCallback: `const handler = useCallback(() => {...}, [])`
**Warning signs:** React DevTools Profiler shows component re-rendering when parent updates unrelated state

### Pitfall 2: Animation Jank from Layout Thrashing
**What goes wrong:** Animations stutter or drop below 60fps despite "simple" changes
**Why it happens:** Animating properties like width, height, top, left, margin triggers layout recalculation (expensive CPU work on main thread)
**How to avoid:**
- Only animate transform and opacity (GPU compositor thread)
- Use `transform: scale()` instead of width/height
- Use `transform: translateX()` instead of left/right
- Add `will-change: transform` to hint browser (sparingly - creates layers)
**Warning signs:** Chrome DevTools Performance tab shows purple "Layout" bars during animation frames

**Current implementation status:** AnimatedPetSVG already follows this correctly (pet-animations.css only uses transform/opacity)

### Pitfall 3: Intersection Observer Triggering Too Late
**What goes wrong:** Pets pop into view before rendering completes, causing visible "blank then appear" flicker
**Why it happens:** Default threshold:0 triggers when 1px enters viewport, but React render + paint takes several frames
**How to avoid:**
- Set rootMargin to preload: `rootMargin: '200px'` starts rendering 200px before viewport
- Adjust based on average render time: slower devices need larger margin
- Provide placeholder skeleton during render to maintain layout
**Warning signs:** Users report "flashing" or "popping" content during scroll

### Pitfall 4: Memory Leaks from Animation Timers
**What goes wrong:** Application slows down over time, especially after navigating between pages with pets
**Why it happens:** setTimeout/setInterval not cleared in useEffect cleanup, or animation refs not cancelled
**How to avoid:**
- Always return cleanup function from useEffect: `return () => clearTimeout(timeoutId)`
- Store timeout IDs in refs, not state: `const timeoutRef = useRef<NodeJS.Timeout | null>(null)`
- Cancel requestAnimationFrame: `return () => cancelAnimationFrame(rafId)`
**Warning signs:** Chrome DevTools Memory tab shows increasing heap size over time; Performance Monitor shows rising DOM node count

**Current implementation status:** AnimatedPetSVG correctly cleans up blink timeouts in useEffect cleanup (lines 109-114)

### Pitfall 5: False Positive Performance Regressions from Animation Timing
**What goes wrong:** Visual regression tests fail randomly due to animation frame differences
**Why it happens:** Percy/screenshot tools capture at arbitrary animation frame; breathing/blinking animations mid-cycle look different
**How to avoid:**
- Disable animations in visual regression tests: set `prefers-reduced-motion: reduce` in test environment
- Use Percy's animation stabilization (waits for animations to settle)
- Or: capture multiple frames and compare against baseline range
**Warning signs:** Percy shows "differences" that are just animation mid-frame; tests flaky (pass/fail inconsistently)

### Pitfall 6: Color Validation Failing to Test Edge Cases
**What goes wrong:** Color harmony passes validation but users report "ugly" or "unreadable" combinations
**Why it happens:** Testing too few samples (e.g., 100 pets) misses rare seed combinations that produce edge cases
**How to avoid:**
- Test QUALITY-01 requirement: generate 1000+ random pet IDs, validate all color combinations
- Test boundary conditions: extreme hues (0, 180, 359), min/max saturation/lightness
- Visual inspection: render grid of random samples, manual review for obvious clashes
**Warning signs:** User reports or support tickets about specific pets looking "bad" or "hard to see"

## Code Examples

Verified patterns from official sources:

### Viewport Culling for Pet Grids
```typescript
// Source: https://github.com/thebuilder/react-intersection-observer
import { useInView } from 'react-intersection-observer';

interface LazyPetGridProps {
  pets: Array<{ id: string; traits: PetTraits }>;
}

export function LazyPetGrid({ pets }: LazyPetGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {pets.map(pet => (
        <LazyPetCard key={pet.id} pet={pet} />
      ))}
    </div>
  );
}

function LazyPetCard({ pet }: { pet: { id: string; traits: PetTraits } }) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px', // PERF-03: Preload before visible
    triggerOnce: false   // Re-cull when off-screen
  });

  return (
    <div ref={ref} className="pet-card">
      {inView ? (
        <AnimatedPetSVG petId={pet.id} traits={pet.traits} size="medium" />
      ) : (
        // Placeholder maintains layout, prevents content shift
        <div className="pet-skeleton h-64 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}
```

### Performance Profiling in Tests
```typescript
// Source: https://react.dev/reference/react/Profiler
import { Profiler, ProfilerOnRenderCallback } from 'react';
import { render } from '@testing-library/react';

describe('PERF-01: Single pet rendering', () => {
  it('completes in <16ms per frame', () => {
    const renderTimings: number[] = [];

    const onRender: ProfilerOnRenderCallback = (
      id,
      phase,
      actualDuration
    ) => {
      if (phase === 'mount' || phase === 'update') {
        renderTimings.push(actualDuration);
      }
    };

    render(
      <Profiler id="single-pet" onRender={onRender}>
        <AnimatedPetSVG
          petId="test-pet-1"
          traits={mockTraits}
        />
      </Profiler>
    );

    // Verify PERF-01: Single pet maintains 60fps
    expect(Math.max(...renderTimings)).toBeLessThan(16);
  });
});
```

### Color Harmony Mass Validation
```typescript
// Source: Existing colorHarmony.ts + QUALITY-01 requirement
import { generatePetTraits } from '@/lib/traits/generation';
import { validateColorHarmony, hslToString } from '@/lib/traits/colorHarmony';

describe('QUALITY-01: Color combinations', () => {
  it('validates harmony across 1000+ random samples', () => {
    const sampleSize = 1000;
    const failures: string[] = [];

    for (let i = 0; i < sampleSize; i++) {
      const petId = `quality-test-${i}`;
      const traits = generatePetTraits(petId);

      const colors = [traits.bodyColor];
      if (traits.patternColor) {
        colors.push(traits.patternColor);
      }

      const isValid = validateColorHarmony(colors);
      if (!isValid) {
        failures.push(
          `Pet ${petId}: ${colors.map(hslToString).join(' + ')}`
        );
      }
    }

    // QUALITY-01: No clashing colors in large sample
    expect(failures).toHaveLength(0);
    if (failures.length > 0) {
      console.error('Color harmony failures:', failures);
    }
  });
});
```

### FPS Monitoring Hook
```typescript
// Source: https://www.growingwiththeweb.com/2017/12/fast-simple-js-fps-counter.html
import { useState, useEffect, useRef } from 'react';

export function useFPSMonitor() {
  const [fps, setFps] = useState(60);
  const times = useRef<number[]>([]);

  useEffect(() => {
    // Only in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    let rafId: number;

    const measureFPS = () => {
      const now = performance.now();

      // Remove timestamps older than 1 second
      while (times.current.length > 0 && times.current[0] <= now - 1000) {
        times.current.shift();
      }

      times.current.push(now);
      setFps(times.current.length);

      rafId = requestAnimationFrame(measureFPS);
    };

    rafId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return fps;
}

// Usage in development overlay
export function DevFPSOverlay() {
  const fps = useFPSMonitor();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-2 rounded font-mono text-sm">
      {fps} FPS
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual shouldComponentUpdate | React.memo with useMemo/useCallback | React 16.8+ (Hooks) | Simpler API, less error-prone, better TypeScript support |
| scroll event listeners + getBoundingClientRect | Intersection Observer API | Native since 2019, react-intersection-observer 9.x | No main thread blocking, better performance, browser-optimized |
| setInterval for animations | CSS animations + requestAnimationFrame for timing | Always preferred for visual | GPU acceleration, no JavaScript overhead, respects prefers-reduced-motion |
| Manual performance.now() timing | React Profiler API | React 16.5+ | Built-in, works with DevTools, measures actual render cost |
| Manual color contrast calculation | WCAG 2.1 relative luminance formula | Updated WCAG 2.1 (2018) | Accessible color combinations, standardized across tools |

**Deprecated/outdated:**
- **React.PureComponent**: Use React.memo instead (functional components preferred in modern React)
- **will-change CSS everywhere**: Overuse creates too many compositor layers; use sparingly for known animation targets
- **IntersectionObserver polyfill**: Native support in all modern browsers since 2019; polyfill only needed for IE11

## Open Questions

1. **What FPS threshold triggers viewport culling?**
   - What we know: PERF-03 requires culling for 20+ pets
   - What's unclear: Should culling activate based on pet count (fixed threshold) or measured FPS drop?
   - Recommendation: Start with fixed threshold (20+ pets), add FPS-based dynamic culling if needed after performance testing

2. **How to validate "visually distinguishable at a glance" (QUALITY-02)?**
   - What we know: Requirement states users should distinguish pets in grid view
   - What's unclear: No quantitative metric for "distinguishable" - subjective assessment
   - Recommendation: Combine automated checks (no duplicate trait combinations within visible viewport) with manual visual review of Percy grid snapshots

3. **Should animation performance differ between development and production?**
   - What we know: React DevTools and FPS overlays add overhead in development
   - What's unclear: Whether to profile in production mode or accept development overhead as baseline
   - Recommendation: Run performance tests in production build (`NODE_ENV=production`) but keep FPS monitor available in development for debugging

## Sources

### Primary (HIGH confidence)
- React.memo official docs: https://react.dev/reference/react/memo
- React Profiler API: https://react.dev/reference/react/Profiler
- Intersection Observer API (MDN): https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- react-intersection-observer (GitHub): https://github.com/thebuilder/react-intersection-observer
- CSS GPU Animation: https://developer.chrome.com/blog/hardware-accelerated-animations
- Page Visibility API (MDN): Implicit from existing usePageVisibility.ts implementation
- prefers-reduced-motion (MDN): Implicit from existing useReducedMotion.ts implementation

### Secondary (MEDIUM confidence)
- [How to Optimize React Re-Renders with useMemo and useCallback](https://oneuptime.com/blog/post/2026-01-15-optimize-react-rerenders-usememo-usecallback/view) - 2026-01-15 publication date
- [Intersection Observer API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [React Intersection Observer - A Practical Guide](https://www.builder.io/blog/react-intersection-observer)
- [Accessible Animations in React with "prefers-reduced-motion"](https://www.joshwcomeau.com/react/prefers-reduced-motion/)
- [Fast and Simple JavaScript FPS Counter](https://www.growingwiththeweb.com/2017/12/fast-simple-js-fps-counter.html)
- [Chrome DevTools Performance API](https://developer.chrome.com/docs/devtools/performance/reference)
- [Use Lighthouse for performance budgets](https://web.dev/articles/use-lighthouse-for-performance-budgets)
- [Percy: All-in-one visual testing and review platform](https://percy.io/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Tertiary (LOW confidence)
- Color harmony algorithms: No single authoritative source found; existing colorHarmony.ts implementation appears custom
- FPS benchmarking thresholds: Community consensus is 60fps but no official React guidance on when to optimize

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - React.memo, Intersection Observer, and Profiler API are official/standard tools with extensive documentation
- Architecture: HIGH - Patterns verified against official React docs and popular libraries (react-intersection-observer has 5.3k+ GitHub stars)
- Pitfalls: HIGH - Documented in React docs (memo object prop issue), Chrome DevTools docs (layout thrashing), and community best practices
- Quality validation: MEDIUM - Color harmony validation approach is custom; no standard library found for HSL aesthetic validation (WCAG exists for contrast but not "clashing" colors)

**Research date:** 2026-02-10
**Valid until:** 2026-03-10 (30 days - React ecosystem stable, patterns unlikely to change rapidly)

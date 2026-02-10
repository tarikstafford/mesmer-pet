# Phase 3: Animation & Persistence - Research

**Researched:** 2026-02-09
**Domain:** CSS animations, React performance, Page Visibility API, Prisma JSON persistence
**Confidence:** HIGH

## Summary

Phase 3 implements idle animations (breathing, blinking, body-specific movement) for pets and ensures visual trait persistence across sessions. The domain splits into two independent concerns: (1) GPU-accelerated CSS animations with accessibility support, and (2) database-driven trait loading with versioning.

Modern CSS animations using `transform` and `opacity` provide 60fps performance without JavaScript intervention. The Page Visibility API pauses animations when tabs are inactive, and `prefers-reduced-motion` media query handles motion sensitivity. Prisma's existing JSON field support (already implemented in Phase 2) handles trait persistence, with application-level versioning managed through the `traitVersion` field.

**Primary recommendation:** Use CSS `@keyframes` animations with transform/opacity only, apply unique animation delays via inline CSS custom properties, implement Page Visibility API in custom React hook, and leverage existing Prisma JSON field for trait persistence with application-level schema versioning.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| CSS Animations | Native | GPU-accelerated idle animations | Browser-optimized rendering pipeline, no library overhead, [widely supported since 2020](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) |
| Page Visibility API | Native | Detect tab active/inactive state | [Native browser API since 2015](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API), no dependencies needed |
| Prisma Client | 7.3.0 | Database ORM with JSON support | Already in stack, [handles JSON fields natively](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields) |
| React hooks | 19.2.4 | State and lifecycle management | Already in stack, useEffect for event listeners |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| seedrandom | 3.0.5 | Deterministic random for animation offsets | Already in stack from Phase 1, reuse for unique delays |
| CSS custom properties | Native | Dynamic animation values | Pass pet-specific delays as inline styles |
| prefers-reduced-motion | Native | Accessibility media query | Detect user motion sensitivity preference |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS Animations | Framer Motion / Motion One | Animation libraries add bundle size (Motion One: ~15KB, Framer Motion: ~30KB). [CSS animations are more performant](https://www.keycdn.com/blog/animation-performance) for simple transforms. Use libraries only if complex orchestration or gesture detection needed. |
| Inline CSS delays | JavaScript-driven animations | JS animations require RAF loops, state management, and manual pause handling. CSS animations pause automatically with `animation-play-state: paused` and leverage GPU. |
| Custom hooks | Third-party visibility hook | Package adds dependency. [Custom hook is 15 lines](https://medium.com/@josephat94/exploring-document-visibility-in-react-with-the-usedocumentvisibility-hook-9ecdd134d401), no external code needed. |

**Installation:**
No new packages required - all dependencies already in stack.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── pet-svg/
│       ├── PetSVG.tsx              # Existing component (add animation classes)
│       ├── AnimatedPetSVG.tsx      # New wrapper with animation logic
│       └── layers/                 # Existing layer components
├── lib/
│   └── traits/
│       ├── generation.ts           # Existing (no changes)
│       └── types.ts                # Existing (traitVersion already present)
└── hooks/
    ├── usePageVisibility.ts        # New hook for tab detection
    └── useReducedMotion.ts         # New hook for motion preference
```

### Pattern 1: GPU-Accelerated CSS Animations

**What:** Use only `transform` and `opacity` properties in animations to leverage GPU compositing without triggering layout or paint.

**When to use:** All pet idle animations (breathing, blinking, subtle movement).

**Example:**
```css
/* Breathing animation - scales from center */
@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

/* Blink animation - opacity fade */
@keyframes blink {
  0%, 90%, 100% { opacity: 1; }
  95% { opacity: 0; }
}

.pet-breathing {
  animation: breathe 3.5s ease-in-out infinite;
  transform-origin: center center;
}

.pet-eyes {
  animation: blink 0.2s ease-in-out;
}
```

Source: [CSS GPU Animation Guide](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)

### Pattern 2: Unique Animation Phase Offsets

**What:** Use CSS custom properties (variables) to apply unique animation delays per pet, preventing synchronized movement when multiple pets are visible.

**When to use:** When rendering multiple PetSVG components on same page (dashboard, marketplace).

**Example:**
```tsx
// Generate unique delay from pet ID
const rng = seedrandom(petId);
const breathingDelay = rng() * -3.5; // Negative delay starts animation mid-cycle
const blinkDelay = rng() * -5;

<svg
  style={{
    '--breathing-delay': `${breathingDelay}s`,
    '--blink-delay': `${blinkDelay}s`
  } as React.CSSProperties}
  className="pet-svg"
>
```

```css
.pet-breathing {
  animation: breathe 3.5s ease-in-out infinite;
  animation-delay: var(--breathing-delay);
}
```

Source: [CSS Custom Properties with React](https://www.joshwcomeau.com/css/css-variables-for-react-devs/)

### Pattern 3: Page Visibility Hook

**What:** Custom React hook that listens to `visibilitychange` event and returns boolean indicating if tab is active.

**When to use:** Pause animations, stop unnecessary renders when tab is inactive.

**Example:**
```typescript
// Source: https://medium.com/@josephat94/exploring-document-visibility-in-react-with-the-usedocumentvisibility-hook-9ecdd134d401
function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = React.useState(!document.hidden);

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
```

### Pattern 4: Reduced Motion Hook

**What:** Custom React hook that queries `prefers-reduced-motion` media query and returns boolean.

**When to use:** Disable or simplify animations for users with motion sensitivity.

**Example:**
```typescript
function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
```

### Pattern 5: Animation Control via CSS Classes

**What:** Toggle animation state using CSS classes instead of JavaScript animation control.

**When to use:** Pause/resume animations based on page visibility or user preference.

**Example:**
```tsx
const isVisible = usePageVisibility();
const reducedMotion = useReducedMotion();

<svg
  className={cn(
    'pet-svg',
    isVisible && !reducedMotion && 'animate-breathing',
    isVisible && !reducedMotion && 'animate-blinking'
  )}
>
```

```css
/* Animations only active when class present */
.animate-breathing {
  animation: breathe 3.5s ease-in-out infinite;
}

.animate-blinking .eyes {
  animation: blink 0.2s ease-in-out;
  animation-iteration-count: 1;
}

/* Or use animation-play-state for pause/resume */
.pet-svg {
  animation-play-state: running;
}

.pet-svg.paused {
  animation-play-state: paused;
}
```

### Pattern 6: Body-Size-Specific Animation Timing

**What:** Adjust animation duration based on pet body size (small = faster, large = slower).

**When to use:** Make animations feel natural and weight-appropriate.

**Example:**
```tsx
const animationDuration = {
  small: 2.5,  // Faster breathing
  medium: 3.5, // Default
  large: 4.5   // Slower breathing
}[traits.bodySize];

<svg
  style={{
    '--breathing-duration': `${animationDuration}s`
  } as React.CSSProperties}
>
```

```css
.pet-breathing {
  animation: breathe var(--breathing-duration, 3.5s) ease-in-out infinite;
}
```

### Pattern 7: Trait Persistence via Database

**What:** Load pet traits from database JSON field on every render, not regenerate client-side.

**When to use:** All pet renders across app to ensure visual consistency.

**Example:**
```typescript
// Database query includes traits field
const pet = await prisma.pet.findUnique({
  where: { id: petId },
  select: {
    id: true,
    name: true,
    traits: true, // JSON field containing PetTraits
    // ... other fields
  }
});

// Parse and validate traits
const traits = pet.traits
  ? PetTraitsSchema.parse(pet.traits)
  : generatePetTraits(pet.id); // Fallback if missing

// Render with persisted traits
<PetSVG traits={traits} />
```

Source: [Prisma JSON Fields Documentation](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields)

### Pattern 8: Application-Level Schema Versioning

**What:** Use `traitVersion` field in JSON schema to handle future trait system evolution.

**When to use:** When trait schema changes in future (new fields, renamed properties).

**Example:**
```typescript
// Handle old trait versions gracefully
function migrateTraits(traits: unknown): PetTraits {
  const rawTraits = traits as any;

  // Version 1 traits (current)
  if (rawTraits.traitVersion === 1) {
    return PetTraitsSchema.parse(rawTraits);
  }

  // Future: Handle version 2 traits
  // if (rawTraits.traitVersion === 2) {
  //   return migrateV2ToV3(rawTraits);
  // }

  // Unknown version: regenerate
  console.warn('Unknown trait version, regenerating');
  return generatePetTraits(petId);
}
```

Source: [Schema Versioning Strategies](https://www.jusdb.com/blog/schema-versioning-and-migration-strategies-for-scalable-databases)

### Anti-Patterns to Avoid

- **Animating layout properties:** Never animate `width`, `height`, `top`, `left`, `margin`, `padding`. These trigger layout recalculation and paint on every frame, causing jank. Use `transform: scale()` and `transform: translate()` instead.

- **Overusing will-change:** Don't apply `will-change` to multiple elements preemptively. [Browser allocates resources for each element](https://blog.logrocket.com/when-how-use-css-will-change/), harming performance. Only use when animation is imminent, remove after animation completes.

- **JavaScript animation loops:** Don't use `setInterval` or manual `requestAnimationFrame` loops for simple animations. CSS animations leverage GPU automatically and require no JavaScript execution.

- **Blocking main thread:** Don't perform heavy computation in animation-related useEffect hooks. Page Visibility listeners should only update state, not trigger expensive operations.

- **Regenerating traits client-side:** Never call `generatePetTraits` on page load for existing pets. This breaks persistence (same pet shows different appearance). Always load from database.

- **Synchronous animation timing:** Don't animate multiple pets with same start time. Creates unnatural synchronized movement. Use unique delays per pet via seedrandom.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation performance optimization | Custom frame scheduling, manual GPU triggers | CSS `transform` and `opacity` with `@keyframes` | Browser optimizes automatically. CSS animations [run on compositor thread](https://web.dev/articles/animations-guide), avoiding main thread jank. Custom solutions require deep browser internals knowledge and fail across devices. |
| Motion sensitivity detection | Settings panel, localStorage flags | `prefers-reduced-motion` media query | OS-level preference [supported in all major browsers](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion). Users set once system-wide, works across all sites. Custom settings require per-site configuration and miss users who need accessibility but don't know to configure. |
| Tab visibility detection | Focus/blur events, timer-based detection | Page Visibility API (`document.hidden`, `visibilitychange` event) | Focus/blur events fire unreliably (modals, iframes cause false positives). Timer-based detection wastes resources. [Page Visibility API is reliable standard](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) since 2015. |
| Random but deterministic delays | `Math.random()` with stored seeds, custom PRNG | Existing `seedrandom` library (already in stack) | Custom PRNGs have distribution bugs (clumping, periodicity). seedrandom is [battle-tested, cross-platform identical](https://github.com/davidbau/seedrandom), already used for trait generation. Reuse eliminates new dependency. |
| JSON schema migration system | Custom migration framework, version-specific parsers | Application-level versioning with fallback regeneration | [Prisma doesn't support JSON migrations](https://www.prisma.io/docs/orm/prisma-migrate). Custom migration systems add complexity for edge case (trait schema changes rare). Simple version check + fallback handles 99% of cases without framework overhead. |

**Key insight:** Browser APIs have matured significantly. CSS animations, Page Visibility, and media queries solve animation/performance concerns better than custom JavaScript. Leverage browser-native features rather than rebuilding functionality that exists in platform.

## Common Pitfalls

### Pitfall 1: Animation Causes Layout Thrashing

**What goes wrong:** Animations stutter, feel janky, or cause page scrolling to lag.

**Why it happens:** Animating properties like `width`, `height`, `top`, `left`, or `margin` triggers layout recalculation on every frame (60 times per second). Browser must recalculate positions of all elements, repaint, and composite. This blocks main thread and drops frames.

**How to avoid:** Only animate `transform` and `opacity`. These properties affect only the compositing step, [run on GPU without layout/paint](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/).

```css
/* BAD - triggers layout */
@keyframes bad-breathe {
  0% { width: 100px; height: 100px; }
  50% { width: 102px; height: 102px; }
}

/* GOOD - GPU-accelerated */
@keyframes good-breathe {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
```

**Warning signs:**
- DevTools Performance tab shows "Recalculate Style" or "Layout" during animation
- Animation FPS drops below 60fps on mid-range devices
- Other page elements feel sluggish when animations run

### Pitfall 2: Animations Run When Tab Inactive

**What goes wrong:** Browser throttles background tabs to save battery, but animations continue consuming resources. Users return to tab and see "jumpiness" as animations catch up.

**Why it happens:** CSS animations continue in background tabs by default. Browser may throttle animation frame rate from 60fps to 1fps, creating visual discontinuity when tab becomes visible again.

**How to avoid:** Use Page Visibility API to pause animations when tab hidden. Apply `animation-play-state: paused` via CSS class.

```typescript
const isVisible = usePageVisibility();

<svg className={cn('pet-svg', !isVisible && 'paused')}>
```

```css
.pet-svg.paused * {
  animation-play-state: paused;
}
```

**Warning signs:**
- Battery drain complaints from users
- Pets "jump" or snap to different animation frame when returning to tab
- DevTools shows high CPU usage for inactive tab

### Pitfall 3: Multiple Pets Move in Sync

**What goes wrong:** When multiple pets render on same page (dashboard, marketplace), they all breathe and blink simultaneously. Looks robotic and unnatural.

**Why it happens:** CSS animations start at same time for all elements with same animation. No default staggering or phase offset.

**How to avoid:** Apply unique negative `animation-delay` per pet using their ID as seed. Negative delays start animation mid-cycle, creating phase offset.

```typescript
const rng = seedrandom(petId);
const delay = rng() * -3.5; // Negative offset for 3.5s animation

<svg style={{ '--breathing-delay': `${delay}s` }}>
```

**Warning signs:**
- All pets on page breathe in perfect unison
- Blinks happen simultaneously across multiple pets
- Animation feels mechanical rather than organic

### Pitfall 4: Accessibility Ignored

**What goes wrong:** Users with vestibular disorders, motion sensitivity, or epilepsy experience discomfort or triggers from animations. Site fails WCAG 2.1 accessibility compliance.

**Why it happens:** Animations implemented without checking `prefers-reduced-motion` preference. Developers test with default OS settings, miss accessibility concerns.

**How to avoid:** Query `prefers-reduced-motion` media query and disable or simplify animations when `reduce` preference set.

```typescript
const reducedMotion = useReducedMotion();

<svg className={!reducedMotion ? 'animate-breathing' : 'static'}>
```

```css
@media (prefers-reduced-motion: reduce) {
  .animate-breathing {
    animation: none;
  }

  /* Or keep subtle animation */
  .animate-breathing {
    animation-duration: 10s; /* Much slower */
  }
}
```

**Warning signs:**
- No media query for `prefers-reduced-motion` in codebase
- Accessibility audit flags motion issues
- User complaints about dizziness or discomfort

### Pitfall 5: Pet Appearance Changes Across Sessions

**What goes wrong:** User sees pet with blue body and crown, reloads page, now pet has green body and horns. Visual identity not preserved.

**Why it happens:** Calling `generatePetTraits(petId)` on every render instead of loading from database. While function is deterministic per ID, database contains the source of truth. If pet was created before trait system existed, or ID changed, appearance drifts.

**How to avoid:** Always load traits from database `traits` JSON field. Only regenerate if field is `null` (legacy pets, backfill edge cases).

```typescript
// CORRECT: Load from database
const pet = await prisma.pet.findUnique({
  where: { id: petId },
  select: { traits: true }
});

const traits = pet.traits
  ? PetTraitsSchema.parse(pet.traits)
  : generatePetTraits(pet.id); // Fallback only

// WRONG: Regenerate on every load
const traits = generatePetTraits(pet.id); // Don't do this!
```

**Warning signs:**
- Pet appearance changes between page reloads (rare, but breaks trust)
- Different appearance on web vs mobile for same pet
- Users report "my pet looks different today"

### Pitfall 6: React.memo Breaks with Animation State

**What goes wrong:** PetSVG component re-renders unnecessarily despite React.memo, causing animation restarts or performance issues.

**Why it happens:** Animation state (visibility, reduced motion) passed as props. When state changes, memo comparison fails, component re-renders, animations restart from beginning.

**How to avoid:** Keep animation control outside PetSVG component. Use CSS classes or CSS custom properties for animation state, not component props. PetSVG should only receive `traits`, `size`, `className`.

```tsx
// GOOD: Animation control outside component
function AnimatedPetSVG({ petId, traits }) {
  const isVisible = usePageVisibility();
  const reducedMotion = useReducedMotion();

  return (
    <PetSVG
      traits={traits}
      className={cn(
        isVisible && !reducedMotion && 'animate'
      )}
    />
  );
}

// PetSVG stays pure, React.memo works
export const PetSVG = React.memo(({ traits, className }) => {
  // No animation state here
});
```

**Warning signs:**
- Animations restart when switching tabs
- DevTools React Profiler shows PetSVG re-rendering frequently
- Console logs show "Invalid pet traits, using fallback" on every visibility change (validation running on each render)

### Pitfall 7: Prisma JSON Field Type Safety Lost

**What goes wrong:** TypeScript allows any shape to be stored in `traits` field, runtime errors occur when invalid data read back.

**Why it happens:** Prisma's `Json` type is `any` in TypeScript. No compile-time validation that stored data matches `PetTraits` interface.

**How to avoid:** Always validate with Zod schema when reading from database. Parse with `PetTraitsSchema.parse()` or `.safeParse()` before using traits.

```typescript
// Reading from database
const pet = await prisma.pet.findUnique({
  where: { id: petId },
  select: { traits: true }
});

// WRONG: Trust database data
const traits = pet.traits as PetTraits; // Type cast is lie!

// CORRECT: Validate with Zod
const parseResult = PetTraitsSchema.safeParse(pet.traits);
if (!parseResult.success) {
  console.warn('Invalid traits, regenerating:', parseResult.error);
  traits = generatePetTraits(pet.id);
} else {
  traits = parseResult.data;
}
```

**Warning signs:**
- Runtime errors like "Cannot read property 'h' of undefined"
- PetSVG renders fallback traits despite database containing data
- TypeScript shows no errors but runtime crashes occur

## Code Examples

Verified patterns from official sources and codebase analysis:

### Breathing Animation (GPU-Accelerated)

```css
/* Source: https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/ */
@keyframes breathe {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.pet-breathing {
  animation: breathe var(--breathing-duration, 3.5s) ease-in-out infinite;
  animation-delay: var(--breathing-delay, 0s);
  transform-origin: center center;
}

/* Body-size-specific timing */
.pet-breathing[data-size="small"] {
  --breathing-duration: 2.5s;
}

.pet-breathing[data-size="large"] {
  --breathing-duration: 4.5s;
}
```

### Blink Animation (Triggered on Interval)

```typescript
// Component manages blink timing
function AnimatedPetSVG({ traits, petId }: Props) {
  const [isBlinking, setIsBlinking] = React.useState(false);
  const isVisible = usePageVisibility();
  const reducedMotion = useReducedMotion();

  // Random blink interval 3-5 seconds
  React.useEffect(() => {
    if (!isVisible || reducedMotion) return;

    const rng = seedrandom(`${petId}-blink-${Date.now()}`);
    const scheduleNextBlink = () => {
      const delay = 3000 + rng() * 2000; // 3-5 seconds

      const timeoutId = setTimeout(() => {
        setIsBlinking(true);

        // Blink duration: 200ms
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink(); // Schedule next blink
        }, 200);
      }, delay);

      return timeoutId;
    };

    const timeoutId = scheduleNextBlink();
    return () => clearTimeout(timeoutId);
  }, [petId, isVisible, reducedMotion]);

  return (
    <PetSVG
      traits={traits}
      className={cn(
        isVisible && !reducedMotion && 'animate-breathing',
        isBlinking && 'blinking'
      )}
    />
  );
}
```

```css
/* Blink animation runs once when class applied */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.blinking .eyes {
  animation: blink 0.2s ease-in-out;
}
```

### Page Visibility Hook

```typescript
// Source: https://medium.com/@josephat94/exploring-document-visibility-in-react-with-the-usedocumentvisibility-hook-9ecdd134d401
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = React.useState(
    typeof document !== 'undefined' ? !document.hidden : true
  );

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
```

### Reduced Motion Hook

```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Fallback for older browsers (Safari < 14)
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReducedMotion;
}
```

### Loading Traits from Database

```typescript
// API route or server component
import { prisma } from '@/lib/prisma';
import { PetTraitsSchema } from '@/lib/traits/validation';
import { generatePetTraits } from '@/lib/traits/generation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const petId = searchParams.get('id');

  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: {
      id: true,
      name: true,
      traits: true, // JSON field
      health: true,
      hunger: true,
      happiness: true,
      energy: true,
    }
  });

  if (!pet) {
    return Response.json({ error: 'Pet not found' }, { status: 404 });
  }

  // Validate and parse traits
  let traits;
  if (pet.traits) {
    const parseResult = PetTraitsSchema.safeParse(pet.traits);
    if (parseResult.success) {
      traits = parseResult.data;
    } else {
      console.warn('Invalid traits in database, regenerating:', parseResult.error);
      traits = generatePetTraits(pet.id);

      // Update database with valid traits
      await prisma.pet.update({
        where: { id: pet.id },
        data: { traits: traits as any }
      });
    }
  } else {
    // Legacy pet without traits - generate and save
    traits = generatePetTraits(pet.id);
    await prisma.pet.update({
      where: { id: pet.id },
      data: { traits: traits as any }
    });
  }

  return Response.json({
    ...pet,
    traits // Validated traits
  });
}
```

### Handling Trait Version Evolution

```typescript
// lib/traits/migration.ts
import type { PetTraits } from './types';
import { PetTraitsSchema } from './validation';

/**
 * Migrate traits from older versions to current schema
 * Handles backward compatibility for pet trait evolution
 */
export function migrateTraits(rawTraits: unknown, petId: string): PetTraits {
  const traits = rawTraits as any;

  // No traits or invalid JSON - regenerate
  if (!traits || typeof traits !== 'object') {
    console.warn(`Invalid traits for pet ${petId}, regenerating`);
    return generatePetTraits(petId);
  }

  // Version 1 (current) - validate and return
  if (traits.traitVersion === 1) {
    const parseResult = PetTraitsSchema.safeParse(traits);
    if (parseResult.success) {
      return parseResult.data;
    } else {
      console.warn(`V1 traits invalid for pet ${petId}:`, parseResult.error);
      return generatePetTraits(petId);
    }
  }

  // Unknown version - regenerate
  console.warn(`Unknown trait version ${traits.traitVersion} for pet ${petId}, regenerating`);
  return generatePetTraits(petId);

  // Future: Add version 2 migration
  // if (traits.traitVersion === 2) {
  //   return migrateV2ToV1(traits);
  // }
}
```

### Applying Unique Animation Delays

```typescript
// AnimatedPetSVG.tsx
import seedrandom from 'seedrandom';

interface AnimatedPetSVGProps {
  petId: string;
  traits: PetTraits;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function AnimatedPetSVG({ petId, traits, size, className }: AnimatedPetSVGProps) {
  const isVisible = usePageVisibility();
  const reducedMotion = useReducedMotion();

  // Generate unique animation delays from pet ID
  const rng = seedrandom(petId);
  const breathingDelay = -(rng() * 3.5); // Negative delay = start mid-cycle

  // Body-size-specific animation duration
  const breathingDuration = {
    small: 2.5,
    medium: 3.5,
    large: 4.5
  }[traits.bodySize];

  return (
    <div
      style={{
        '--breathing-delay': `${breathingDelay}s`,
        '--breathing-duration': `${breathingDuration}s`
      } as React.CSSProperties}
    >
      <PetSVG
        traits={traits}
        size={size}
        className={cn(
          className,
          isVisible && !reducedMotion && 'animate-breathing'
        )}
      />
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JavaScript RAF loops for animations | CSS animations with GPU acceleration | ~2015 | CSS animations offload to compositor thread, reduce jank, improve battery life. [All major browsers support](https://caniuse.com/css-animation) since 2015. |
| `will-change` applied preemptively | `will-change` used sparingly, only before animation | ~2018 | Overuse caused performance degradation. [Modern guidance](https://blog.logrocket.com/when-how-use-css-will-change/) recommends apply on hover/focus, remove after animation. |
| Focus/blur for tab detection | Page Visibility API | 2015 | Focus/blur unreliable (false positives from modals). [Page Visibility API standardized](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) in 2015, reliable cross-browser. |
| Manual accessibility settings | `prefers-reduced-motion` media query | 2020 | OS-level preference [became baseline](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) in 2020. All major browsers support. Users set once system-wide. |
| Framer Motion for all animations | CSS for simple, Framer Motion for complex | ~2023 | [Bundle size concerns](https://www.keycdn.com/blog/animation-performance) drove shift. Use native CSS for simple transforms, libraries only for gesture detection or complex orchestration. |
| JSON migration frameworks | Application-level versioning with fallback | Ongoing | [Prisma lacks JSON migration support](https://www.prisma.io/docs/orm/prisma-migrate). Simple version field + regeneration fallback handles edge cases without framework complexity. |

**Deprecated/outdated:**
- **`will-change: transform` on all animated elements:** Now anti-pattern. Apply only when animation imminent, remove after. Premature optimization that wastes resources.
- **Animating `left`/`top` for movement:** Triggers layout. Use `transform: translate()` instead for GPU acceleration.
- **`addListener()` for MediaQueryList:** Safari < 14 only. Use `addEventListener()` with fallback.
- **Polling `document.hidden` for visibility:** Inefficient. Use `visibilitychange` event listener.

## Open Questions

1. **Should animations vary by expression type?**
   - What we know: Pets have expressions (happy, sleepy, mischievous). "Sleepy" might breathe slower, "mischievous" might blink more.
   - What's unclear: Do expression-specific animations add meaningful value, or is consistency better?
   - Recommendation: Start with uniform animations (ANIM-01, ANIM-02 requirements don't specify expression variation). Add expression-based timing in future phase if user feedback requests it. YAGNI applies here.

2. **How should blink animation interact with expression layer?**
   - What we know: PetSVG has separate ExpressionLayer component rendering eyes. Blink animation needs to target eyes specifically.
   - What's unclear: Should blink be CSS animation on ExpressionLayer, or should component receive `isBlinking` prop?
   - Recommendation: Pass `isBlinking` prop to ExpressionLayer, render with opacity animation. Keeps animation state in parent, expression layer stays pure (React.memo friendly).

3. **Should animation state persist across mounts?**
   - What we know: User scrolls dashboard, pet unmounts/remounts as it leaves/enters viewport.
   - What's unclear: Should animation continue from same phase, or restart from beginning?
   - Recommendation: Let CSS handle naturally. Negative animation-delay based on pet ID creates consistent phase. When component remounts, animation restarts at same phase offset. No explicit state persistence needed.

4. **Do we need animation for pattern/accessory layers?**
   - What we know: Requirements specify body breathing (ANIM-01), blinking (ANIM-02), and body-size-specific movement (ANIM-03). Don't mention pattern or accessory animation.
   - What's unclear: Should accessories (wings, crown) animate independently (flutter, shimmer)?
   - Recommendation: Not in Phase 3 scope. YAGNI - implement only what requirements specify. If users request "wings should flap," add in future enhancement phase.

## Sources

### Primary (HIGH confidence)
- [MDN: prefers-reduced-motion Media Query](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) - Official documentation, accessibility standard
- [MDN: Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) - Official browser API documentation
- [Prisma: Working with JSON Fields](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields) - Official Prisma documentation
- [Smashing Magazine: GPU Animation Guide](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/) - Authoritative CSS animation performance guide
- [web.dev: High-Performance CSS Animations](https://web.dev/articles/animations-guide) - Google's official animation best practices

### Secondary (MEDIUM confidence)
- [Josh W. Comeau: CSS Variables for React Devs](https://www.joshwcomeau.com/css/css-variables-for-react-devs/) - Industry expert, verified techniques
- [Josh W. Comeau: Keyframe Animations Guide](https://www.joshwcomeau.com/animation/keyframe-animations/) - Comprehensive animation tutorial
- [CSS-Tricks: Different Approaches for Staggered Animation](https://css-tricks.com/different-approaches-for-creating-a-staggered-animation/) - Multiple verified techniques
- [Medium: useDocumentVisibility Hook](https://medium.com/@josephat94/exploring-document-visibility-in-react-with-the-usedocumentvisibility-hook-9ecdd134d401) - Custom hook pattern, matches official API usage
- [LogRocket: When and How to Use CSS will-change](https://blog.logrocket.com/when-how-use-css-will-change/) - Modern best practices, cross-referenced with MDN
- [React & Next.js Best Practices 2026](https://fabwebstudio.com/blog/react-nextjs-best-practices-2026-performance-scale) - Current performance patterns
- [Schema Versioning Strategies](https://www.jusdb.com/blog/schema-versioning-and-migration-strategies-for-scalable-databases) - Application-level versioning patterns
- [Prisma Migration Strategies](https://www.prisma.io/dataguide/types/relational/migration-strategies) - Official migration guidance

### Tertiary (LOW confidence - marked for validation)
- [WebPeak: CSS/JS Animation Trends 2026](https://webpeak.org/blog/css-js-animation-trends/) - Future-dated content, trends not yet verified
- [SVG vs Canvas Animation 2026](https://www.augustinfotech.com/blogs/svg-vs-canvas-animation-what-modern-frontends-should-use-in-2026/) - Future projections, treat as hypothesis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, native browser APIs widely supported since 2015-2020
- Architecture: HIGH - Patterns verified from official docs (MDN, Prisma), expert sources (Josh Comeau), and existing codebase structure
- Pitfalls: HIGH - Common issues documented across multiple authoritative sources (web.dev, MDN, Smashing Magazine)

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days - stable domain, browser APIs rarely change)

**Key assumptions:**
- Project uses Next.js 16+ with React 19 (confirmed in package.json)
- Prisma 7.3.0 with SQLite database (confirmed in schema)
- seedrandom 3.0.5 already in dependencies (confirmed, used in Phase 1)
- PetSVG component uses React.memo with custom comparison (confirmed in codebase)
- Pet traits stored in `traits` JSON field with `traitVersion: 1` (confirmed in schema and types)

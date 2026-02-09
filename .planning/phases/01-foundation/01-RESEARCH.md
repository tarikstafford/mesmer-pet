# Phase 1: Foundation - Research

**Researched:** 2026-02-09
**Domain:** Procedural trait generation and SVG rendering
**Confidence:** HIGH

## Summary

Phase 1 requires building a procedural pet trait generation system with deterministic cross-platform rendering. The core technical challenge is replacing the existing relational trait database with a procedural generation approach that creates 48,000+ unique visual combinations using seeded PRNG, stores traits as JSON in the Pet table, and renders pets as layered SVGs instead of solely Three.js 3D models.

**Key technical domains:** Seeded PRNG (seedrandom), SVG composition in React/Next.js, HSL color harmony validation, trait rarity probability distribution, and JSON schema validation with Zod.

**Primary recommendation:** Use `seedrandom` (v3.0.5) for deterministic trait generation, render SVG layers using inline JSX composition (avoid SVGR for procedural content), store trait data as typed JSON with Prisma JSON generator + Zod validation, and implement HSL color constraints (S: 50-90%, L: 25-75%) to prevent muddy combinations.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| seedrandom | 3.0.5 | Seeded PRNG for deterministic trait generation | Industry standard for cross-platform determinism; same seed produces identical output across all JS engines |
| @types/seedrandom | 3.0.8 | TypeScript definitions for seedrandom | Official DefinitelyTyped package with 112+ dependents |
| zod | 4.3.6 | Runtime validation for trait JSON | Already in project; essential for validating JSON trait data at runtime |
| prisma-json-types-generator | 3.x | Type-safe JSON fields in Prisma | Recommended approach for maintaining type safety with Prisma JSON columns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @svgr/webpack | Latest | Convert static SVG files to React components | Only for static SVG assets (icons, backgrounds), NOT for procedural generation |
| react (built-in) | 19.2.4 | JSX for inline SVG composition | Always - use inline `<svg>` elements for procedural rendering |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| seedrandom | crypto.getRandomValues() | crypto is cryptographically secure but NOT seedable - can't reproduce same pet |
| seedrandom | alea / random-seed | Less adoption (alea: unmaintained, random-seed: 50K downloads vs seedrandom's 2M+) |
| Inline SVG | Canvas API | Canvas better for 1000+ elements but loses accessibility, harder to debug, can't use CSS |
| JSON storage | Separate PetVisualTrait table | More queries, harder to version, slower to fetch - JSON is correct for flat trait lists |
| HSL color space | RGB | RGB produces more muddy combinations; HSL allows intuitive saturation/lightness constraints |

**Installation:**
```bash
npm install seedrandom
npm install --save-dev @types/seedrandom prisma-json-types-generator
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── traits/
│   │   ├── generation.ts          # Core trait generation logic with seedrandom
│   │   ├── validation.ts          # Zod schemas for trait data
│   │   ├── colorHarmony.ts        # HSL color validation and constraints
│   │   └── rarityDistribution.ts  # Probability distribution for trait rarity
│   └── rendering/
│       ├── PetSVG.tsx              # Main SVG composition component
│       ├── layers/
│       │   ├── BodyLayer.tsx       # Body shape and color
│       │   ├── PatternLayer.tsx    # Patterns (stripes, spots)
│       │   ├── AccessoryLayer.tsx  # Accessories (horns, wings)
│       │   └── ExpressionLayer.tsx # Eyes, mouth, expressions
│       └── utils.ts                # SVG helper functions (viewBox, transforms)
├── types/
│   └── petTraits.ts                # TypeScript interfaces for trait data
```

### Pattern 1: Deterministic Trait Generation with Seeded PRNG
**What:** Use pet ID as seed to generate consistent traits across all platforms
**When to use:** At pet creation time, or when rendering pets from database
**Example:**
```typescript
// Source: https://github.com/davidbau/seedrandom + project requirements
import seedrandom from 'seedrandom';

interface PetTraits {
  bodyColor: { h: number; s: number; l: number };
  patternType: 'none' | 'striped' | 'spotted' | 'gradient';
  patternColor?: { h: number; s: number; l: number };
  accessory: 'none' | 'horns' | 'wings' | 'crown';
  bodySize: 'small' | 'medium' | 'large';
  expression: 'happy' | 'neutral' | 'curious' | 'mischievous';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export function generatePetTraits(petId: string): PetTraits {
  // Create seeded RNG - same petId always produces same traits
  const rng = seedrandom(petId);

  // Generate rarity first (affects other trait probabilities)
  const rarity = getRarityTier(rng);

  // Generate color with HSL constraints
  const bodyColor = generateHarmonizedColor(rng, {
    hueRange: [0, 360],
    satRange: [50, 90], // Avoid muddy colors
    lightRange: [25, 75] // Avoid pure black/white
  });

  // Pattern influenced by rarity
  const patternType = weightedChoice(rng, {
    'none': rarity === 'common' ? 0.5 : 0.1,
    'striped': 0.25,
    'spotted': 0.15,
    'gradient': rarity === 'legendary' ? 0.4 : 0.1
  });

  // Generate pattern color ensuring harmony with body
  const patternColor = patternType !== 'none'
    ? generateComplementaryColor(bodyColor, rng)
    : undefined;

  return {
    bodyColor,
    patternType,
    patternColor,
    accessory: weightedChoice(rng, ACCESSORY_WEIGHTS[rarity]),
    bodySize: weightedChoice(rng, SIZE_WEIGHTS),
    expression: weightedChoice(rng, EXPRESSION_WEIGHTS),
    rarity
  };
}

function getRarityTier(rng: () => number): PetTraits['rarity'] {
  const roll = rng();
  if (roll < 0.70) return 'common';      // 70%
  if (roll < 0.90) return 'uncommon';    // 20%
  if (roll < 0.98) return 'rare';        // 8%
  return 'legendary';                    // 2%
}
```

### Pattern 2: HSL Color Harmony Constraints
**What:** Validate color combinations to prevent clashing/muddy colors
**When to use:** During trait generation and color selection
**Example:**
```typescript
// Source: Research from https://zachmoore.dev/blog/procedural-color-schemes-the-easy-way-with-hsl/
interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export function generateHarmonizedColor(
  rng: () => number,
  constraints: {
    hueRange: [number, number];
    satRange: [number, number];
    lightRange: [number, number];
  }
): HSLColor {
  const [hMin, hMax] = constraints.hueRange;
  const [sMin, sMax] = constraints.satRange;
  const [lMin, lMax] = constraints.lightRange;

  return {
    h: hMin + rng() * (hMax - hMin),
    s: sMin + rng() * (sMax - sMin),
    l: lMin + rng() * (lMax - lMin)
  };
}

export function generateComplementaryColor(
  baseColor: HSLColor,
  rng: () => number
): HSLColor {
  // Complementary: rotate hue by ~180° with variance
  const hueVariance = (rng() - 0.5) * 30; // ±15° variance

  return {
    h: (baseColor.h + 180 + hueVariance) % 360,
    s: Math.max(50, Math.min(90, baseColor.s + (rng() - 0.5) * 20)),
    l: Math.max(25, Math.min(75, baseColor.l + (rng() - 0.5) * 20))
  };
}

export function hslToString(color: HSLColor): string {
  return `hsl(${Math.round(color.h)}, ${Math.round(color.s)}%, ${Math.round(color.l)}%)`;
}

export function validateColorHarmony(colors: HSLColor[]): boolean {
  // Check for muddy colors (low saturation + mid lightness)
  const hasMuddy = colors.some(c => c.s < 30 && c.l > 40 && c.l < 60);
  if (hasMuddy) return false;

  // Check for excessive contrast (very dark + very light)
  const lights = colors.filter(c => c.l > 75);
  const darks = colors.filter(c => c.l < 25);
  if (lights.length > 0 && darks.length > 0) return false;

  return true;
}
```

### Pattern 3: Layered SVG Composition
**What:** Build pet visual as stacked SVG layers rendered in document order (z-index)
**When to use:** Always for trait-based pet rendering
**Example:**
```typescript
// Source: https://blog.logrocket.com/animation-tricks-svg-z-index/ + React patterns
import React from 'react';

interface PetSVGProps {
  traits: PetTraits;
  size: 'small' | 'medium' | 'large';
  className?: string;
}

export const PetSVG: React.FC<PetSVGProps> = ({ traits, size, className }) => {
  const dimensions = {
    small: { width: 120, height: 120 },
    medium: { width: 240, height: 240 },
    large: { width: 480, height: 480 }
  };

  const { width, height } = dimensions[size];

  // Convert HSL to CSS string
  const bodyColor = hslToString(traits.bodyColor);
  const patternColor = traits.patternColor ? hslToString(traits.patternColor) : undefined;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`Pet with ${traits.bodyColor.h}° hue and ${traits.expression} expression`}
    >
      {/* Layer 1: Body (bottom) */}
      <BodyLayer color={bodyColor} size={traits.bodySize} />

      {/* Layer 2: Pattern (middle) */}
      {traits.patternType !== 'none' && patternColor && (
        <PatternLayer
          type={traits.patternType}
          color={patternColor}
          size={traits.bodySize}
        />
      )}

      {/* Layer 3: Accessory (top-middle) */}
      {traits.accessory !== 'none' && (
        <AccessoryLayer type={traits.accessory} size={traits.bodySize} />
      )}

      {/* Layer 4: Expression (top) */}
      <ExpressionLayer type={traits.expression} size={traits.bodySize} />
    </svg>
  );
};

// Example layer component
const BodyLayer: React.FC<{ color: string; size: string }> = ({ color, size }) => {
  const scale = size === 'small' ? 0.8 : size === 'large' ? 1.2 : 1.0;

  return (
    <g transform={`translate(50, 50) scale(${scale})`}>
      {/* SVG CRITICAL: Elements later in DOM have higher z-index */}
      <ellipse cx="0" cy="0" rx="30" ry="40" fill={color} />
      <circle cx="0" cy="-10" r="20" fill={color} /> {/* Head */}
    </g>
  );
};
```

### Pattern 4: Type-Safe JSON Trait Storage
**What:** Store procedurally generated traits as JSON with runtime validation
**When to use:** Saving/loading pet traits from database
**Example:**
```typescript
// Source: https://dev.to/zenstack/typing-prisma-json-fields-yes-you-can-2in4
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

generator json {
  provider = "prisma-json-types-generator"
}

model Pet {
  id        String   @id @default(uuid())
  name      String
  userId    String

  // Procedurally generated traits stored as JSON
  /// @zod.custom(imports.PetTraitsSchema)
  visualTraits Json

  // Existing fields...
  health    Int      @default(100)
  createdAt DateTime @default(now())
}

// src/lib/traits/validation.ts
import { z } from 'zod';

const HSLColorSchema = z.object({
  h: z.number().min(0).max(360),
  s: z.number().min(0).max(100),
  l: z.number().min(0).max(100)
});

export const PetTraitsSchema = z.object({
  bodyColor: HSLColorSchema,
  patternType: z.enum(['none', 'striped', 'spotted', 'gradient']),
  patternColor: HSLColorSchema.optional(),
  accessory: z.enum(['none', 'horns', 'wings', 'crown']),
  bodySize: z.enum(['small', 'medium', 'large']),
  expression: z.enum(['happy', 'neutral', 'curious', 'mischievous']),
  rarity: z.enum(['common', 'uncommon', 'rare', 'legendary'])
});

export type PetTraits = z.infer<typeof PetTraitsSchema>;

// Usage in API route
export async function createPet(userId: string, petName: string) {
  const pet = await prisma.pet.create({
    data: {
      name: petName,
      userId,
      // Generate traits at creation time
      visualTraits: generatePetTraits(crypto.randomUUID()) as any // Prisma types as JsonValue
    }
  });

  return pet;
}

// Usage when loading
export async function loadPet(petId: string) {
  const pet = await prisma.pet.findUnique({ where: { id: petId } });
  if (!pet) throw new Error('Pet not found');

  // Validate and parse JSON traits at runtime
  const traits = PetTraitsSchema.parse(pet.visualTraits);

  return { ...pet, visualTraits: traits };
}
```

### Anti-Patterns to Avoid

- **Using Math.random() without seed:** Produces different traits on iOS vs Android vs web for same pet ID. ALWAYS use seedrandom with pet ID as seed.

- **Storing SVG as string in database:** Inefficient and breaks searchability. Store trait parameters as JSON, generate SVG on render.

- **Using z-index in SVG:** SVG doesn't support z-index CSS property. Layer order = DOM order, so render layers bottom-to-top.

- **Raw probability without cumulative distribution:** `if (rng() < 0.7) return 'common'` is correct. `if (rng() === 0.7)` will never match.

- **Generating colors in RGB space:** Produces muddy, clashing combinations. Use HSL with saturation/lightness constraints.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Seeded PRNG | Custom LCG or Xorshift implementation | seedrandom (3.0.5) | Cross-browser consistency is hard - seedrandom handles floating-point precision differences across JS engines |
| Color harmony validation | Manual RGB/HSV conversion and clash detection | HSL constraints + complementary formulas | Color theory is complex - even 5-10% of random RGB combinations clash; HSL with ranges prevents this |
| Weighted random selection | Loop with cumulative probability | Helper function (see example) | Easy to introduce off-by-one errors; cumulative distribution is proven pattern |
| SVG optimization | Manual SVGO integration and minification | Static assets only - procedural SVG should stay readable | Procedurally generated SVG needs to be debuggable; optimize only static assets |
| JSON validation at runtime | Manual type checking with typeof | Zod schemas | Runtime types diverge from compile-time - Zod keeps them in sync and provides useful error messages |

**Key insight:** Procedural generation seems simple ("just random numbers") but determinism across platforms is hard. Small differences in floating-point precision, PRNG algorithms, or rounding can cause the same pet to look different on different devices. seedrandom solves this; custom implementations require extensive cross-platform testing.

## Common Pitfalls

### Pitfall 1: Seed Collision and Poor Seed Diversity
**What goes wrong:** Using sequential IDs (1, 2, 3) or short seeds produces similar-looking pets
**Why it happens:** Seeds with small numeric differences produce correlated RNG outputs in first few calls
**How to avoid:** Use UUIDs (128-bit random) as pet IDs and seeds - provides sufficient entropy
**Warning signs:** First few pets created all have similar colors or patterns

### Pitfall 2: HSL Muddy Color Band
**What goes wrong:** 5-10% of randomly generated colors look muddy (grayish, unsaturated)
**Why it happens:** Mid-range lightness (40-60%) + low saturation (0-30%) creates dull, brownish tones regardless of hue
**How to avoid:** Constrain saturation to 50-90% and lightness to 25-75% during generation
**Warning signs:** User feedback about "ugly brown/gray pets", visual testing shows dull colors

### Pitfall 3: Non-Deterministic Trait Generation Side Effects
**What goes wrong:** Traits change when re-rendering same pet from database
**Why it happens:** Using Date.now(), Math.random(), or external API calls during trait generation
**How to avoid:** Ensure generatePetTraits() is pure function - only depends on petId seed, no external state
**Warning signs:** Same pet looks different after page refresh, or differs between mobile and web

### Pitfall 4: SVG Layer Ordering Confusion
**What goes wrong:** Accessories render behind body, or patterns appear on top of eyes
**Why it happens:** SVG uses document order for z-index - last element in DOM is on top
**How to avoid:** Render layers bottom-to-top: Body → Pattern → Accessory → Expression
**Warning signs:** Visual elements appearing in wrong stacking order, accessories invisible

### Pitfall 5: Prisma JSON Type Safety Loss
**What goes wrong:** TypeScript shows Pet.visualTraits as `JsonValue` (any), losing trait type information
**Why it happens:** Prisma doesn't natively support typed JSON columns
**How to avoid:** Use prisma-json-types-generator + Zod for compile-time types and runtime validation
**Warning signs:** No autocomplete for trait properties, runtime errors from wrong trait structure

### Pitfall 6: Rarity Distribution Drift
**What goes wrong:** Legendary pets appear more than 2% of the time
**Why it happens:** Incorrect cumulative probability logic in rarity selection
**How to avoid:** Test with large samples (10,000+ pets), verify distribution matches expected percentages
**Warning signs:** User reports "everyone has legendary pets", statistical tests show 5%+ legendary instead of 2%

### Pitfall 7: Performance Degradation with Complex SVG
**What goes wrong:** Pet cards lag when scrolling or rendering many pets
**Why it happens:** SVG with 100+ elements per pet, or CSS animations on every element
**How to avoid:** Keep SVG simple (20-40 elements max per pet), use CSS transforms on wrapper div for animations
**Warning signs:** Janky scrolling, React profiler shows PetSVG taking >16ms to render

## Code Examples

Verified patterns from official sources and research:

### Weighted Random Selection Helper
```typescript
// Source: Standard probability distribution pattern
export function weightedChoice<T extends string>(
  rng: () => number,
  weights: Record<T, number>
): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [_, weight]) => sum + weight, 0);

  let roll = rng() * total;

  for (const [choice, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return choice;
  }

  // Fallback to first choice (handles floating point errors)
  return entries[0][0];
}
```

### Testing Trait Determinism
```typescript
// Source: Testing best practices for seeded generation
import { describe, it, expect } from 'vitest';
import { generatePetTraits } from '@/lib/traits/generation';

describe('Trait Determinism', () => {
  it('generates identical traits for same pet ID', () => {
    const petId = 'test-pet-123';

    const traits1 = generatePetTraits(petId);
    const traits2 = generatePetTraits(petId);

    expect(traits1).toEqual(traits2);
    expect(traits1.bodyColor.h).toBe(traits2.bodyColor.h);
    expect(traits1.patternType).toBe(traits2.patternType);
  });

  it('generates different traits for different pet IDs', () => {
    const traits1 = generatePetTraits('pet-1');
    const traits2 = generatePetTraits('pet-2');

    expect(traits1).not.toEqual(traits2);
  });

  it('matches expected rarity distribution over 10,000 samples', () => {
    const counts = { common: 0, uncommon: 0, rare: 0, legendary: 0 };

    for (let i = 0; i < 10000; i++) {
      const traits = generatePetTraits(`pet-${i}`);
      counts[traits.rarity]++;
    }

    // Allow 5% margin of error
    expect(counts.common).toBeGreaterThan(6500);  // 70% ± 5%
    expect(counts.common).toBeLessThan(7500);
    expect(counts.uncommon).toBeGreaterThan(1500); // 20% ± 5%
    expect(counts.uncommon).toBeLessThan(2500);
    expect(counts.rare).toBeGreaterThan(300);      // 8% ± 5%
    expect(counts.rare).toBeLessThan(1300);
    expect(counts.legendary).toBeGreaterThan(0);   // 2% ± 5%
    expect(counts.legendary).toBeLessThan(700);
  });
});
```

### SVG Performance Optimization
```typescript
// Source: https://css-tricks.com/high-performance-svgs/
import React, { memo } from 'react';

// Memoize layers to prevent unnecessary re-renders
export const BodyLayer = memo<{ color: string; size: string }>(({ color, size }) => {
  // Component implementation
});

export const PatternLayer = memo<{ type: string; color: string; size: string }>(
  ({ type, color, size }) => {
    // Only re-render if props actually change
  }
);

// Memoize entire PetSVG component
export const PetSVG = memo<PetSVGProps>(({ traits, size, className }) => {
  // SVG composition
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if traits or size changed
  return (
    prevProps.size === nextProps.size &&
    JSON.stringify(prevProps.traits) === JSON.stringify(nextProps.traits)
  );
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Relational trait database with Trait/PetTrait tables | Procedural generation with JSON storage | Phase 1 requirement | Reduces DB queries, enables 48K+ combinations without seeding database |
| Three.js 3D models only | Three.js + SVG hybrid | Phase 1 requirement | SVG for trait visualization, Three.js for AR/immersive view |
| Math.random() for genetics | seedrandom for determinism | Phase 1 requirement | Same pet looks identical on all platforms |
| HSL() CSS in JS | HSL object with validation | Phase 1 requirement | Prevents muddy colors, enables programmatic harmony checks |

**Deprecated/outdated:**
- **Using Trait/PetTrait relational tables for visual traits:** Phase 1 requirement is to store traits as JSON. The existing database structure should remain for personality/skill traits but visual traits move to procedural generation.
- **SVGR for procedural SVG:** SVGR is for static SVG → React component conversion. Procedural SVG should be inline JSX composition.
- **Alea PRNG library:** Unmaintained since 2015, use seedrandom instead.

## Open Questions

1. **Migration strategy for existing pets with relational traits**
   - What we know: Current system uses Trait/PetTrait tables; Phase 1 requires JSON storage
   - What's unclear: Should existing pets be migrated to procedural traits, or dual system?
   - Recommendation: Create migration script that converts existing PetTrait records to JSON visualTraits, or mark old pets as "legacy" and only apply new system to new pets

2. **Trait generation at creation vs on-demand**
   - What we know: Requirements say "trait generation at pet creation, not on-demand"
   - What's unclear: Does this mean traits stored in DB, or regenerated from seed on load?
   - Recommendation: Generate and store traits as JSON at creation time - this allows future trait customization or evolution without changing pet ID

3. **Three.js coexistence with SVG system**
   - What we know: Existing PetModel3D component uses Three.js, requirement says "coexists without conflicts"
   - What's unclear: Should both render simultaneously, or context-dependent (SVG for cards, 3D for detail)?
   - Recommendation: Use SVG for card/list views (performance), Three.js for detail/AR views. Same trait data drives both renderers.

4. **Color harmony validation threshold**
   - What we know: 5-10% of random combinations clash
   - What's unclear: Should system reject and regenerate bad combinations, or use constraints to prevent?
   - Recommendation: Use HSL constraints (S: 50-90%, L: 25-75%) during generation to prevent bad combinations - rejection/regeneration adds complexity

5. **Trait versioning and evolution**
   - What we know: Traits stored as JSON enable schema changes
   - What's unclear: How to handle schema version mismatches (old pets with old trait structure)?
   - Recommendation: Add `traitVersion: 1` to JSON schema, write migration functions for each version bump

## Sources

### Primary (HIGH confidence)
- [seedrandom GitHub repository](https://github.com/davidbau/seedrandom) - Official documentation, version 3.0.5, determinism guarantees
- [@types/seedrandom npm package](https://www.npmjs.com/package/@types/seedrandom) - Official TypeScript definitions, version 3.0.8
- [Procedural Color Schemes with HSL](https://zachmoore.dev/blog/procedural-color-schemes-the-easy-way-with-hsl/) - HSL harmony techniques
- [SVG z-index and layering in React](https://blog.logrocket.com/animation-tricks-svg-z-index/) - SVG DOM ordering for z-index
- [Typing Prisma JSON Fields](https://dev.to/zenstack/typing-prisma-json-fields-yes-you-can-2in4) - Type-safe JSON with Prisma

### Secondary (MEDIUM confidence)
- [Loot Systems and Rarity Distribution](https://www.numberanalytics.com/blog/ultimate-guide-loot-systems-game-design) - Game design rarity patterns
- [OpenRarity Methodology](https://openrarity.gitbook.io/developers/fundamentals/methodology) - Trait rarity scoring approaches
- [High Performance SVGs](https://css-tricks.com/high-performance-svgs/) - SVG optimization best practices
- [Generating SVG with React - Smashing Magazine](https://www.smashingmagazine.com/2015/12/generating-svg-with-react/) - React SVG composition patterns
- [Procedurally Generated SVG Landscapes](https://kwa.ng/procedurally-generated-svg-landscapes/) - Procedural SVG techniques

### Secondary (LOW confidence - verify during implementation)
- [Math.random() pitfalls](https://medium.com/@EsteveSegura/rolling-the-dice-on-security-the-pitfalls-of-using-math-random-in-javascript-3e891d8e4ef6) - PRNG security concerns
- [Making JS Deterministic](https://developers.rune.ai/blog/making-js-deterministic-for-fun-and-glory) - Determinism challenges in JS
- [Working with JSON fields in Prisma](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields) - Prisma JSON documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - seedrandom is industry standard (2M+ downloads/week), well-documented, proven cross-platform determinism
- Architecture: HIGH - Patterns verified from official sources (Smashing Magazine, LogRocket, CSS-Tricks) and match existing Next.js/React setup
- Pitfalls: MEDIUM - Based on general game development patterns and color theory research, not Mesmer-specific testing
- Color harmony: MEDIUM - HSL constraints are proven approach, but specific S/L ranges (50-90%, 25-75%) need validation with project aesthetic

**Research date:** 2026-02-09
**Valid until:** 30 days (stable domain - PRNG and SVG rendering are mature technologies)

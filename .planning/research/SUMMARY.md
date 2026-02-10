# Project Research Summary

**Project:** Mesmer - Pet Appearance Enhancement
**Domain:** 2D procedural avatar rendering with trait-based generation for virtual pets
**Researched:** 2026-02-09
**Confidence:** HIGH

## Executive Summary

Mesmer is enhancing its virtual pet platform by adding distinctive visual appearances through procedural trait generation. Research confirms the recommended approach is **hybrid SVG rendering** (primary) with Canvas fallback for high-density views, combined with CSS `steps()` for idle animations and React Spring for physics-based interactions. This strategy aligns with Mesmer's architecture (existing Three.js for 3D/AR, SVG for 2D contexts) and delivers scalable, resolution-independent pet appearances across all display contexts (cards, marketplace, feed, AR viewer).

The critical insight from cross-domain research: visual distinctiveness is table stakes for virtual pet platforms, but the path to differentiation lies in **animated aliveness** combined with **procedural rarity systems**. Competitors (CryptoKitties, Axie Infinity, Neopets) rely on static images or simple genetic systems. Mesmer's advantage is combining procedural trait variety (48,000+ combinations) with state-based animations that make pets feel genuinely alive. However, this introduces seven critical pitfalls—particularly cross-device non-determinism, color clashing at scale, and performance collapse with multiple animated pets—that must be addressed from Phase 1.

The recommended phased approach prioritizes foundation (deterministic trait generation + SVG rendering), then migration (assign traits to existing pets), then enhancement (multi-state animations + expressions), and finally optimization (performance + polish). Early phases need standard implementation patterns; later phases (animations, AR optimization) will benefit from targeted research.

## Key Findings

### Recommended Stack

**Rendering Technology:** SVG is the clear choice for primary 2D pet rendering. Research shows SVG outperforms Canvas for Mesmer's use case (1-10 simultaneous pets) with 300% better developer experience, instant scalability across contexts, and layer-based trait composition. Canvas would only be needed for marketplace views with 50+ pets simultaneously visible—a rare scenario. Three.js remains for 3D/AR contexts, creating clean separation between 2D (SVG) and 3D (Three.js) rendering pipelines.

**Core technologies:**
- **SVG + SVGR (8.1.0)**: Primary 2D rendering format with React component conversion — enables scalable trait composition, CSS styling, and DOM manipulation for dynamic trait layers
- **CSS `steps()` + React Spring (9.7.5+)**: Animation stack — CSS handles sprite-based idle loops (zero bundle cost, hardware-accelerated), React Spring handles physics-based interactions (feeding, petting)
- **Custom TypeScript trait system**: Procedural generation extending existing `getPetModelConfig()` pattern — layer-based SVG composition with genetics integration, rarity-weighted trait selection
- **Next.js 16 + React 19**: Already in stack — View Transitions API for smooth pet navigation, React Compiler for auto-memoization, streaming SSR for pet data

**Critical Decision:** Use deterministic PRNG (seedrandom library) instead of Math.random() for trait generation. Cross-platform determinism is non-negotiable—pets must look identical on Chrome/Safari/iOS/Android. Math.random() implementations vary across JavaScript engines, causing appearance drift.

### Expected Features

Research across virtual pet platforms (CryptoKitties, Axie Infinity, Neopets, Moy, Bubbu) reveals clear feature expectations:

**Must have (table stakes):**
- **Visual Distinctiveness**: Pets must look different from each other at a glance (currently white polygons)
- **Color Variety**: 10-12 base colors minimum (expanding from current 5)
- **Pattern/Marking System**: 6-8 body patterns minimum (expanding from current 3: striped, spotted, gradient)
- **Stable Visual Identity**: Once generated, appearance stays consistent across sessions/platforms
- **Basic Idle Animation**: 2-4 second breathing loop minimum (static pets feel dead in 2026)
- **Trait Inheritance Visibility**: If breeding exists, parents' visual traits must visibly pass to offspring

**Should have (competitive advantage):**
- **Procedural Rarity System**: Auto-generate trait combinations with weighted rarity (common/uncommon/rare/legendary) — creates collecting incentive without manual design
- **Multiple Idle Animation States**: 3-5 different idle animations (look around, stretch, yawn, tail wag) that randomly trigger — dramatically increases "aliveness" perception
- **Expressive Facial Features**: Eyes/mouth expressions that change with mood/stats (happy when well-fed, droopy when hungry) — emotional feedback through visuals
- **Rare Visual Effects**: Shimmer/glow/particle effects for legendary pets — status symbol, collecting incentive (already flagged in petModelConfig: `hasRainbowShimmer`, `hasGalaxyPattern`)

**Defer (v2+):**
- **Accessory System**: Hats, collars, glasses as layered items — requires economy/monetization strategy
- **Manual Customization (Paint Shop)**: User control over every detail — destroys procedural uniqueness, moves away from "unique companion" toward "dress-up game"
- **Trait Marketplace**: Buy/sell/trade specific traits — requires economy, trading system, moderation
- **Seasonal/Event Traits**: Limited-time special traits — requires live ops calendar, content pipeline

**Key Anti-Feature:** Real-time trait rerolling ("I don't like this trait, let me reroll") undermines attachment to pet's unique identity. Research shows procedural uniqueness + breeding for new combinations works better than allowing users to reroll until "perfect."

### Architecture Approach

The recommended architecture extends Mesmer's existing patterns without introducing new complexity. Procedural trait generation at the data layer feeds through a trait-to-visual mapper (config layer) to SVG rendering components at the presentation layer.

**Major components:**

1. **TraitToVisualMapper** (`lib/petModelConfig.ts` — already exists, needs enhancement) — Pure function translating trait name arrays to PetModelConfig objects with hierarchical fallbacks, enabling flexible trait-to-visual mapping without coupling database to rendering
2. **ProceduralMeshGenerator** (`components/PetModel3D.tsx` — already exists for Three.js) — Composition-based geometry generation using primitives instead of loading external assets, infinite variations without asset storage
3. **TraitService** (database operations layer) — Prisma ORM queries with JOIN operations for trait assignment/retrieval, weighted random selection with rarity constraints, duplication prevention during assignment
4. **MaterialGenerator** (rendering layer) — useMemo-wrapped material instances (critical: Three.js materials are expensive to create), state-based adjustments (health drives visual feedback)

**Architecture Pattern:** Trait-to-Visual Mapping with Hierarchical Fallbacks enables extensibility. New traits can be added to catalog without rewriting render logic. Visual definitions are separated from rendering code. Config structure uses sensible defaults, so missing traits don't break rendering.

**Data Flow:** Database trait master table → Random selection by rarity → PetTrait join table → Pet creation response → Client state → `getPetModelConfig()` mapper → SVG/material generation → Rendered appearance. Health state flows separately through useMemo dependencies to adjust materials (gray/red tint for sick/critical).

**Critical Pattern from Research:** Use expand-and-contract migration pattern for adding traits to existing pets. Add traits as nullable → backfill in batches → require traits. This prevents database locking and handles pets created mid-migration gracefully.

### Critical Pitfalls

Research identified seven critical pitfalls with verified prevention strategies:

1. **Cross-Device Non-Deterministic Trait Generation** — Pet appearance differs between devices/browsers even with the same seed. JavaScript's Math.random() varies across engines. **Prevention:** Use deterministic PRNG (seedrandom library), store exact random seed with each pet, use integer-based operations. **Address in Phase 1** (must be correct from start, migration requires regenerating all pets).

2. **Color Clashing at Scale** — With 48,000+ combinations, many pets end up with unviewable color combinations (neon green on bright yellow, red on orange). Uniform random selection without harmony rules produces 5-10% offensive combinations. **Prevention:** Generate colors in HSL space with constrained ranges, implement color harmony rules (analogous, complementary), test generation with 1000+ samples. **Address in Phase 1** (color algorithm shapes all future pets).

3. **Migration Data Loss or Corruption** — During migration to add traits to existing pets, pets lose identity or migration fails partway leaving inconsistent state. **Prevention:** Use expand-and-contract pattern, batch processing with idempotent script, test with production-scale data (10k+ pets), include rollback strategy. **Address in Phase 2** (one-way operation, must be correct).

4. **Performance Collapse with Multiple Animated Pets** — Single pet animates at 60fps, but marketplace grid with 20 pets drops to 15fps. Each pet renders in separate draw call without batching. **Prevention:** Use InstancedMesh/BatchedMesh for multiple pets, implement viewport culling (only animate visible pets), set `scene.autoUpdate=false` for static pets. **Address in Phase 3** (before marketplace integration).

5. **AR Context Performance Degradation** — Enhanced pets render beautifully in 2D but AR mode is unusable (20fps, stuttering, overheating). AR requires rendering camera feed + 3D scene simultaneously, splitting GPU budget. **Prevention:** Implement LOD (level of detail) system for AR mode (simpler geometry/materials), budget 8-10ms per frame for rendering, disable expensive effects (glow, shimmer) in AR. **Address in Phase 3** (AR is core differentiator, must validate before launch).

6. **Trait-Genetics Mismatch** — Pet has "Ice Affinity" genetic trait but appears with fire colors. Visual traits and genetic traits are separate systems with no validation bridge. **Prevention:** Seed visual trait generator from genetic trait hash, create trait affinity mappings (Ice Affinity → cool colors), validate that visual traits don't contradict genetics. **Address in Phase 1** (visual system must respect existing genetics from day one).

7. **"Looks Done But Isn't" — Missing Edge Cases** — Pet renders perfectly in detail view but breaks in marketplace thumbnail, breed selection modal, chat sidebar, email notifications. Components built for single happy path. **Prevention:** Create comprehensive component showcase testing all contexts, use relative units (%) for all positioning, visual regression tests for every display context. **Address in Phase 4** (before replacing white polygons in all contexts).

## Implications for Roadmap

Based on combined research findings, suggested phase structure with clear dependencies:

### Phase 1: Foundation (Trait Generation + SVG Rendering)
**Rationale:** Nothing else works until traits generate deterministically and render correctly. Trait generation algorithm shapes all future pets—must be correct from start. SVG rendering system is foundation for all visual features. Dependencies from ARCHITECTURE.md show TraitToVisualMapper is prerequisite for all downstream features.

**Delivers:**
- Deterministic trait generation with seeded PRNG
- Expanded trait catalog (12 colors, 8 patterns, special features)
- Enhanced `getPetModelConfig()` with hierarchical fallbacks
- SVG trait composition system with layer-based rendering
- Color harmony validation (test with 1000+ samples)
- Trait-genetics integration (visual traits respect genetic context)

**Addresses features:**
- Visual Distinctiveness (table stakes)
- Color Variety (table stakes)
- Pattern/Marking System (table stakes)
- Procedural Rarity System (differentiator)

**Avoids pitfalls:**
- Cross-device non-determinism (critical)
- Color clashing at scale (critical)
- Trait-genetics mismatch (critical)

**Research flags:** Standard implementation patterns. No deep research needed—trait generation and SVG rendering have well-documented approaches.

### Phase 2: Migration (Assign Traits to Existing Pets)
**Rationale:** Can't leave existing pets as white polygons. Migration is one-way operation requiring production-scale testing. Must happen before breeding system updates (offspring need to inherit from parent visual traits). PITFALLS.md research shows expand-and-contract pattern is critical for zero-downtime migration.

**Delivers:**
- Expand-and-contract migration script with batching
- Idempotent trait assignment for existing pets
- Rollback strategy and validation queries
- Migration monitoring and progress tracking
- Null trait handling during transition period

**Addresses features:**
- Stable Visual Identity (table stakes) for existing pets
- Breeding visual inheritance foundation (must have traits before breeding)

**Avoids pitfalls:**
- Migration data loss or corruption (critical)

**Research flags:** Standard migration patterns. No deep research needed—database migration strategies are well-established.

### Phase 3: Animation Enhancement (Idle States + Expressions)
**Rationale:** Static breathing is table stakes (Phase 1), but multi-state animations are competitive differentiator. FEATURES.md research shows animated aliveness is underexploited in virtual pets—clear opportunity. Depends on Phase 1 (trait rendering) being complete. STACK.md identifies CSS `steps()` + React Spring as proven animation stack.

**Delivers:**
- 4-5 random fidget animations (look around, stretch, yawn, tail wag, ear twitch)
- State-based animation switching (idle, happy, hungry)
- Expression system mapping stats to facial features
- React Spring integration for physics-based interactions
- Sprite sheet system with CSS `steps()` for simple cycles

**Addresses features:**
- Basic Idle Animation (table stakes) — upgrade from breathing to multi-state
- Multiple Idle Animation States (differentiator)
- Expressive Facial Features (differentiator)

**Uses stack elements:**
- CSS `steps()` for sprite-based idle loops
- React Spring (9.7.5+) for physics-based motion
- Animation state machine pattern from ARCHITECTURE.md

**Research flags:** May benefit from targeted research if animation complexity grows. Three.js animation mixer patterns are documented, but state-based expression system mapping stats→visuals is domain-specific. Consider `/gsd:research-phase` if expression system needs deeper investigation.

### Phase 4: Optimization (Performance + Polish)
**Rationale:** Multi-pet rendering and AR contexts introduce performance challenges. PITFALLS.md research shows performance collapse happens at 20+ pets on screen and AR mode has strict mobile GPU constraints. Must validate before marketplace integration and AR feature rollout. Depends on Phases 1-3 rendering being complete.

**Delivers:**
- Viewport culling with Intersection Observer (only animate visible pets)
- InstancedMesh/BatchedMesh for multi-pet contexts (marketplace grid)
- LOD (level of detail) system for AR mode (simplified geometry/materials)
- Canvas fallback for high-density views (50+ pets)
- SVGO optimization pass on all SVG assets
- Dynamic imports for rare traits
- Performance validation (60fps with 10 pets, AR mode on target devices)

**Addresses features:**
- (Performance foundation for all features across contexts)

**Implements architecture:**
- Material caching with useMemo (already exists, audit for completeness)
- Scaling considerations from ARCHITECTURE.md (100-1k users tier)

**Avoids pitfalls:**
- Performance collapse with multiple animated pets (critical)
- AR context performance degradation (critical)
- Missing display contexts (critical)

**Research flags:** May benefit from targeted research for AR optimization. WebXR performance profiling on mobile devices has device-specific quirks. Consider `/gsd:research-phase` for AR-specific performance if issues arise during validation.

### Phase 5: Enhancement (Rare Effects + Size Variation)
**Rationale:** Polish features that increase perceived value without adding complexity. FEATURES.md research shows rare visual effects create collecting incentive (proven in CryptoKitties, Axie Infinity). Depends on performance optimization (Phase 4) being complete—particle effects are expensive. Low implementation cost for high user value.

**Delivers:**
- Particle effects for legendary traits (shimmer, glow, sparkles)
- Size variation (small/medium/large size classes with breeding inheritance)
- Rare trait visual indicators during creation/breeding
- Mutation visual effects highlighting mutated traits

**Addresses features:**
- Rare Visual Effects (differentiator)
- Size Variation (differentiator)

**Uses stack elements:**
- Three.js particle systems (already in stack)
- Existing `hasRainbowShimmer`, `hasGalaxyPattern` flags in petModelConfig

**Research flags:** Standard patterns. Three.js particle effects are well-documented. No deep research needed unless custom shader effects are desired.

### Phase Ordering Rationale

**Why Foundation → Migration → Enhancement → Optimization:**
1. **Trait generation must be correct from start**: Changing algorithm later requires regenerating all pets. Color harmony and determinism are non-negotiable (PITFALLS.md: cross-device non-determinism, color clashing).
2. **Migration is one-way**: Can't iterate on migration strategy after running on production data. Must test at scale before executing (PITFALLS.md: migration data loss).
3. **Animations depend on trait rendering**: Can't animate pets that don't render correctly. Multi-state animations are differentiator but not foundation (FEATURES.md: table stakes vs. competitive advantage).
4. **Optimization depends on having content to optimize**: Can't profile performance of animations that don't exist yet. Viewport culling and batching only matter when multi-pet contexts are built.
5. **Rare effects are polish**: Particle effects increase collecting value but aren't core functionality. Can be added incrementally after performance is validated.

**Dependency chain from ARCHITECTURE.md:**
```
Visual Trait Database → Trait Rendering System → Deterministic Appearance Generation → Cross-Platform Consistency
                                ↓
                        Idle Animation System (parallel, independent)
                                ↓
                        Expression System (depends on stats integration)
                                ↓
                        Performance Optimization (depends on all rendering features complete)
```

**How this avoids pitfalls from PITFALLS.md:**
- Phase 1 addresses all "must be correct from start" pitfalls (determinism, color harmony, trait-genetics match)
- Phase 2 uses expand-and-contract pattern to avoid migration corruption
- Phase 3 builds animations on stable foundation, preventing rework
- Phase 4 validates performance before features that depend on it (marketplace, AR)
- Phase 5 adds expensive features (particles) only after optimization complete

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 3 (Animation Enhancement)**: Expression system mapping stats→visuals is domain-specific. If mapping happiness/hunger/health to facial expressions requires complex morph targets or texture swapping, consider `/gsd:research-phase` for animation system deep-dive.
- **Phase 4 (Optimization — AR component)**: WebXR performance profiling on mobile devices has device-specific constraints. If AR frame rate issues arise, consider `/gsd:research-phase` for WebXR optimization strategies and device-specific LOD tuning.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation)**: Trait generation and SVG rendering have well-documented patterns. STACK.md research is sufficient.
- **Phase 2 (Migration)**: Database migration strategies are established. ARCHITECTURE.md expand-and-contract pattern is proven approach.
- **Phase 5 (Enhancement)**: Three.js particle effects are documented. Rare visual effects can use existing examples.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | STACK.md research based on official documentation (React Spring, SVGR, Three.js), 2025-2026 benchmarks, and existing Mesmer architecture analysis. SVG vs Canvas decision backed by performance research. Animation stack (CSS steps + React Spring) verified through professional animation resources. |
| Features | **MEDIUM-HIGH** | FEATURES.md research covers multiple virtual pet platforms (CryptoKitties, Axie Infinity, Neopets) with official sources. Table stakes vs. differentiators validated across domain. Some implementation specifics (48,000 combinations target, expression system value) are estimated best practices rather than Mesmer-specific user research. |
| Architecture | **HIGH** | ARCHITECTURE.md patterns based on existing Mesmer codebase analysis plus established patterns (ECS, trait-to-visual mapping, material caching). Data flow verified through Prisma schema. Migration strategy (expand-and-contract) from official Prisma documentation. |
| Pitfalls | **HIGH** | PITFALLS.md critical pitfalls backed by verified sources (Gaffer on Games for determinism, Three.js best practices for performance, official WebXR docs for AR). Prevention strategies are industry best practices with specific implementation guidance. Recovery strategies are realistic based on migration patterns. |

**Overall confidence:** **HIGH**

Research draws primarily from official documentation, professional animation resources, established game development patterns, and verified performance benchmarks. Where confidence is MEDIUM (feature prioritization, specific thresholds like "20+ pets for Canvas fallback"), it's flagged as estimation requiring validation during implementation.

### Gaps to Address

**Color harmony validation implementation:** Research identifies HSL-based color harmony as critical (PITFALLS.md), but specific harmony rules (analogous vs. complementary vs. split-complementary) need design decision. **Handle during Phase 1 planning** by prototyping color combinations and testing with 1000+ generated samples.

**Expression system implementation approach:** Research confirms morph targets and texture swapping are technically viable (ARCHITECTURE.md), but optimal implementation (which facial features map to which stats) is unspecified. **Handle during Phase 3 planning** by reviewing animation best practices and considering user testing for expression clarity.

**AR performance thresholds:** Research identifies 8-10ms frame budget for AR rendering (PITFALLS.md), but device-specific optimization strategies need validation on target devices (iPhone SE, mid-range Android). **Handle during Phase 4 execution** by profiling on real hardware and adjusting LOD system accordingly.

**Trait combination testing scale:** Research recommends testing with 1000+ trait combinations to catch color clashing (PITFALLS.md), but exact testing methodology (automated contrast checks vs. manual review) is unspecified. **Handle during Phase 1 planning** by building trait preview tool and defining acceptance criteria for color combinations.

**Migration batch size:** Research recommends batched migration (ARCHITECTURE.md), but optimal batch size for Mesmer's production database is unknown. **Handle during Phase 2 planning** by testing migration script on production-scale data copy and measuring memory/timeout constraints.

## Sources

### Primary Sources (HIGH confidence)

**Official Documentation:**
- [React Spring Official Docs](https://react-spring.dev/) — Animation library features, React 19 compatibility, performance characteristics
- [SVGR Official Site](https://react-svgr.com/) — SVG-to-React conversion, Next.js integration
- [DiceBear Documentation](https://www.dicebear.com/) — Procedural avatar generation architecture reference
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16) — View Transitions API, React Compiler features
- [Prisma Migrate Documentation](https://www.prisma.io/docs/orm/prisma-migrate) — Database migration best practices
- [WebXR Device API](https://immersiveweb.dev/) — AR rendering specifications
- [Three.js Animation System Manual](https://threejs.org/manual/en/animation-system.html) — Official animation patterns

**Verified Research & Benchmarks:**
- [SVG vs Canvas vs WebGL Performance 2025](https://www.svggenie.com/blog/svg-vs-canvas-vs-webgl-performance-2025) — Rendering technology benchmarks showing SVG performance for 1-50 instances
- [100 Three.js Best Practices (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips) — Performance optimization patterns, draw call targets, batching strategies
- [Floating Point Determinism | Gaffer On Games](https://gafferongames.com/post/floating_point_determinism/) — Cross-platform determinism requirements
- [Breathing Life into Idle Animations (AnimSchool)](https://blog.animschool.edu/2024/06/14/breathing-life-into-idle-animations/) — Professional animation best practices for breathing loops
- [Building a 60FPS WebGL Game on Mobile](https://www.airtightinteractive.com/2015/01/building-a-60fps-webgl-game-on-mobile/) — Mobile performance constraints

**Competitor Analysis:**
- [Axie Infinity Breeding Guide (Official)](https://support.axieinfinity.com/hc/en-us/articles/7225771030555-Axie-Breeding-Guide) — Genetic inheritance probabilities
- [Axie Infinity Whitepaper](https://whitepaper.axieinfinity.com/gameplay/breeding) — Trait system architecture
- [Blockchain Cats Game Guide](https://magicsquare.io/blog/what-is-blockchain-cats-a-beginners-guide-to-crypto-kitty-gaming) — NFT pet trait patterns
- [Neopets Styling Studio](https://neopetsapp.com/neopets-styling-studio-pet-styles-learn-how-it-all-works/) — Hybrid customization approach

### Secondary Sources (MEDIUM confidence)

**Industry Best Practices:**
- [Framer Motion 12 vs React Spring 10 (2025)](https://hookedonui.com/animating-react-uis-in-2025-framer-motion-12-vs-react-spring-10/) — Animation library comparison (community research)
- [Procedural Color Algorithm](https://shahriyarshahrabi.medium.com/procedural-color-algorithm-a37739f6dc1) — HSL-based color harmony patterns
- [Procedural Color Schemes with HSL](https://zachmoore.dev/blog/procedural-color-schemes-the-easy-way-with-hsl/) — Color theory for procedural generation
- [How to Choose Colours Procedurally](http://devmag.org.za/2012/07/29/how-to-choose-colours-procedurally-algorithms/) — Harmony algorithms
- [Strategies for Reliable Schema Migrations | Atlas](https://atlasgo.io/blog/2024/10/09/strategies-for-reliable-migrations) — Migration patterns beyond Prisma docs
- [How to Migrate Database Schema at Scale](https://blog.logrocket.com/how-to-migrate-a-database-schema-at-scale/) — Production migration strategies

**Game Development Patterns:**
- [Procedurally Generating Personalities | Game Developer](https://www.gamedeveloper.com/design/procedurally-generating-personalities) — Trait system approaches
- [Entity Component System Design Pattern](https://www.umlboard.com/design-patterns/entity-component-system.html) — Composition over inheritance principles
- [Virtual Pet Design with Personality Patterns (ACM)](https://dl.acm.org/doi/10.1145/3629606.3629626) — Academic research on trait systems
- [Three.js Instances: Rendering Multiple Objects](https://tympanus.net/codrops/2025/07/10/three-js-instances-rendering-multiple-objects-simultaneously/) — Batching patterns

### Tertiary Sources (LOW confidence - requires validation)

**Estimations & Inferences:**
- 48,000 combinations target: Mathematical calculation (12 colors × 8 patterns × 5 features × 10 variations), but optimal variety vs. paradox of choice is untested for Mesmer
- Canvas threshold (20+ vs 50+ pets): Varies by device performance, needs device-specific validation
- Expression system value: Inferred from animation best practices, not validated through Mesmer user research
- Specific rarity distribution (70/20/8/2): Industry standard pattern, but optimal percentages for Mesmer need tuning based on user engagement

---

*Research completed: 2026-02-09*
*Ready for roadmap: yes*
*Total research files synthesized: 4 (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md)*
*Recommended phases: 5*
*Critical pitfalls identified: 7*

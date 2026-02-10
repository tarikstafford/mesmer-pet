# Pitfalls Research

**Domain:** Pet Appearance Enhancement Systems with Procedural Trait Generation
**Researched:** 2026-02-09
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

### Pitfall 1: Cross-Device Non-Deterministic Trait Generation

**What goes wrong:**
Pet appearance differs between devices/browsers even with the same seed. A pet looks blue with stripes on iOS but pink with spots on Android. User reports "my pet looks different on my phone" destroy trust in the platform.

**Why it happens:**
JavaScript's Math.random() implementation differs across engines (V8, JavaScriptCore, SpiderMonkey). Floating-point operations vary by platform. Developers assume seeding Math.random() guarantees determinism, but it doesn't guarantee identical sequences cross-platform.

**How to avoid:**
Use a deterministic PRNG (pseudorandom number generator) like seedrandom library or implement a counter-based RNG. Avoid Math.random() entirely for trait generation. Store the exact random seed with each pet and use integer-based operations instead of floating-point where possible.

**Warning signs:**
- Visual regression tests show different screenshots on different CI runners
- User support tickets mention appearance inconsistencies
- Pet preview in creation flow looks different than pet detail page
- Database seed value is not stored or used

**Phase to address:**
Phase 1 (Trait Generation System) — Must be correct from the start, migration requires regenerating all pets.

**Sources:**
- [Floating Point Determinism | Gaffer On Games](https://gafferongames.com/post/floating_point_determinism/)
- [Cross platform RTS synchronization and floating point indeterminism](https://www.gamedeveloper.com/programming/cross-platform-rts-synchronization-and-floating-point-indeterminism)
- [Randomness should be consistent across devices · Issue #84234 · pytorch/pytorch](https://github.com/pytorch/pytorch/issues/84234)

---

### Pitfall 2: Color Clashing at Scale

**What goes wrong:**
With 48,000+ combinations, many pets end up with unviewable color combinations: neon green accessories on bright yellow bodies, red patterns on orange fur creating visual noise. Random color selection without harmony rules produces combinations that hurt to look at.

**Why it happens:**
Developers use uniform random selection across RGB/HSL space without color theory constraints. Assumes more variety = better, but ignores perceptual harmony. Testing with small sample sizes (5-10 pets) misses rare but hideous combinations that appear at scale.

**How to avoid:**
Generate colors in HSL space with constrained ranges. Implement color harmony rules (analogous, complementary, split-complementary). Keep saturation and lightness values constant while varying hue angles mathematically. Test generation with 1000+ samples to catch edge cases. Consider minimum color contrast ratios between layers (WCAG AA: 4.5:1, AAA: 7:1).

**Warning signs:**
- User complaints about "ugly" pets
- Low engagement with specific trait combinations
- Marketplace listings with certain color combos don't sell
- Visual test snapshots show jarring color combinations

**Phase to address:**
Phase 1 (Trait Generation System) — Color algorithm shapes all future pets. Fixing later requires full regeneration.

**Sources:**
- [Procedural Color Algorithm | by Shahriar Shahrabi | Medium](https://shahriyarshahrabi.medium.com/procedural-color-algorithm-a37739f6dc1)
- [Procedural Color Schemes The Easy Way With HSL — Zach Moore](https://zachmoore.dev/blog/procedural-color-schemes-the-easy-way-with-hsl/)
- [How to Choose Colours Procedurally (Algorithms) – Dev.Mag](http://devmag.org.za/2012/07/29/how-to-choose-colours-procedurally-algorithms/)

---

### Pitfall 3: Migration Data Loss or Corruption

**What goes wrong:**
During migration to add traits to existing pets, pets lose their identity, traits don't match their genetic background, or migration fails partway leaving database in inconsistent state. Users log in to find pets have completely different appearances.

**Why it happens:**
Migration runs without transaction guarantees, uses production seeds during testing (non-deterministic), or doesn't preserve pet-to-trait relationships. Developers test migration on small datasets (10 pets) but production has 10,000 pets causing timeout or memory issues. Backfill script doesn't handle nullable trait fields during transition period.

**How to avoid:**
Use expand-and-contract pattern: add traits column as nullable, backfill in batches with idempotent script, then make non-null. Store migration timestamp per pet to track progress. Test migration with production-scale data (generate 10k+ test pets). Include rollback strategy and validation queries. Run migration during low-traffic window with read-only mode enabled.

**Warning signs:**
- Migration script has no progress logging
- No plan for partial failure recovery
- Migration locks database for extended period
- No validation query to compare pre/post record counts
- Can't answer "how do we roll this back?"

**Phase to address:**
Phase 2 (Database Migration) — Must happen before any trait-based features go live. One-way operation.

**Sources:**
- [Migrations Overview - EF Core | Microsoft Learn](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/)
- [Strategies for Reliable Schema Migrations | Atlas](https://atlasgo.io/blog/2024/10/09/strategies-for-reliable-migrations)
- [How to migrate a database schema at scale - LogRocket Blog](https://blog.logrocket.com/how-to-migrate-a-database-schema-at-scale/)

---

### Pitfall 4: Performance Collapse with Multiple Animated Pets

**What goes wrong:**
Single pet animates at 60fps, but marketplace grid with 20 pets drops to 15fps. Mobile users experience battery drain and thermal throttling. App feels sluggish and animations stutter.

**Why it happens:**
Each pet renders in separate draw call without batching. Three.js scene graph recalculates world matrices for all pets every frame even when not moving. Developers optimize for single-pet view but don't test multi-pet contexts (marketplace, breeding selection, friend pets feed). Animations trigger garbage collection by creating new objects each frame.

**How to avoid:**
Use InstancedMesh or BatchedMesh (Three.js r156+) for multiple pets with same geometry. Set scene.autoUpdate=false and matrixAutoUpdate=false for static pets. Implement viewport culling — only animate pets currently visible. Use CSS animations instead of JavaScript for simple transforms. Write garbage-free animation loops with object pooling. Target <100 draw calls per frame for 60fps on mobile.

**Warning signs:**
- renderer.info.render.calls > 500
- Frame time spikes in Chrome DevTools Performance tab
- Lighthouse performance score below 70
- requestAnimationFrame callbacks taking >16ms
- Garbage collection pauses visible in profiler

**Phase to address:**
Phase 3 (Rendering Optimization) — Before marketplace integration. Multi-pet contexts happen early.

**Sources:**
- [Three.js Instances: Rendering Multiple Objects Simultaneously | Codrops](https://tympanus.net/codrops/2025/07/10/three-js-instances-rendering-multiple-objects-simultaneously/)
- [Building a 60FPS WebGL Game on Mobile — Airtight Interactive](https://www.airtightinteractive.com/2015/01/building-a-60fps-webgl-game-on-mobile/)
- [100 Three.js Best Practices (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [Draw Calls: The Silent Killer | Three.js Roadmap](https://threejsroadmap.com/blog/draw-calls-the-silent-killer)

---

### Pitfall 5: AR Context Performance Degradation

**What goes wrong:**
Enhanced pets render beautifully in 2D contexts but AR mode is unusable: frame rate drops to 20fps, camera feed stutters, device overheats. Users can't show off pets in AR, the feature that makes Mesmer unique.

**Why it happens:**
AR requires rendering both camera feed and 3D scene simultaneously, splitting GPU budget. Developers optimize for desktop Three.js but AR runs on mobile WebXR with stricter constraints. Complex shader materials that work in 2D context overwhelm mobile GPUs in AR. Background processes (camera processing, plane detection) compete for resources.

**How to avoid:**
Implement LOD (level of detail) system: simpler geometry/materials in AR mode. Profile specifically on target mobile devices with WebXR enabled. Budget 8-10ms per frame for rendering (AR feed needs remaining budget). Use compressed textures (Basis/KTX2). Disable expensive effects (glow, shimmer) in AR. Test with thermal throttling conditions — 10+ minutes of continuous AR use.

**Warning signs:**
- WebXR frame rate metrics show high variance
- Mobile device gets hot during AR sessions
- Users report AR "laggy" or "slow" but 2D view is fine
- Performance budget doesn't account for camera processing overhead
- No device-specific optimization paths

**Phase to address:**
Phase 3 (Rendering Optimization) — Must validate before launch, AR is core differentiator.

**Sources:**
- [WebXR Device API](https://immersiveweb.dev/)
- [Get started with Augmented Reality on the web using Three.js and WebXR | Medium](https://medium.com/sopra-steria-norge/get-started-with-augmented-reality-on-the-web-using-three-js-and-webxr-part-1-8b07757fc23a)
- [Building a 60FPS WebGL Game on Mobile — Airtight Interactive](https://www.airtightinteractive.com/2015/01/building-a-60fps-webgl-game-on-mobile/)

---

### Pitfall 6: Trait-Genetics Mismatch

**What goes wrong:**
Pet has "Ice Affinity" genetic trait but appears with fire colors. Offspring inherits "Spotted Pattern" gene from both parents but renders with stripes. Visual appearance contradicts genetic data, breaking immersion and breeding strategy.

**Why it happens:**
Visual traits and genetic traits are separate systems with no validation bridge. Trait generation algorithm ignores genetic trait context. Developers assume visual variety trumps genetic consistency. Breeding system merges genetic traits but visual regeneration uses fresh random seed instead of deriving from parent visual traits.

**How to avoid:**
Seed visual trait generator from genetic trait hash. Create trait affinity mappings (Ice Affinity → cool colors, Fire Affinity → warm colors). Validate that visual traits don't contradict genetics (genetic trait "Striped Pattern" must result in visual stripes). For breeding, blend parent visual traits weighted by genetic dominance instead of pure random. Document trait-to-visual mapping in schema comments.

**Warning signs:**
- No linkage between genetics system and visual generation
- Visual trait seed is purely random, not derived from genetics
- Breeding offspring look nothing like parents despite genetic inheritance
- User confusion about why pet with fire traits looks icy
- Genetic trait names promise visual features that don't appear

**Phase to address:**
Phase 1 (Trait Generation System) — Visual system must respect existing genetics from day one.

**Sources:**
- Project context: Existing genetic trait system for breeding
- [A Primer on Procedural Character Generation for Games](https://link.springer.com/chapter/10.1007/978-3-319-53088-8_7)

---

### Pitfall 7: "Looks Done But Isn't" — Missing Edge Cases

**What goes wrong:**
Pet renders perfectly in pet detail view but breaks in: marketplace thumbnail, breed selection modal, chat sidebar, friend activity feed, email notifications, social share previews. Each context has different sizing/rendering requirements causing misalignment, clipping, or missing traits.

**Why it happens:**
Developers build for single happy path (pet detail page) and assume component works everywhere. SVG viewBox/preserveAspectRatio configured for one size, breaks at different aspect ratios. Traits positioned with absolute pixels instead of relative units. No rendering test suite covering all display contexts. Animations optimized for full-size but cause layout shifts in thumbnails.

**How to avoid:**
Create comprehensive component showcase during development testing all contexts. Use relative units (%) and viewBox for all SVG positioning. Build responsive trait layering that adapts to container dimensions. Implement visual regression tests for every display context. Document expected dimensions and aspect ratios for each context. Test with real production layouts, not isolated components.

**Warning signs:**
- Component only tested in Storybook/isolation
- Hardcoded pixel dimensions in trait positioning
- Visual regression tests only cover one viewport size
- No test for "what if container is 40x40px?"
- Traits clip or overflow in some contexts

**Phase to address:**
Phase 4 (Integration Testing) — Before replacing white polygons in all contexts.

**Sources:**
- [Building Efficient Three.js Scenes: Optimize Performance While Maintaining Quality | Codrops](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using Math.random() instead of seeded PRNG | Faster to implement, no dependencies | Pets look different across devices, impossible to debug, requires full regeneration to fix | Never — non-determinism is unacceptable for persistent visual identity |
| Skip color harmony validation | 48k combos ship faster | 5-10% of combinations are visually offensive, user complaints, manual curation needed | Never — bad combinations at scale destroy brand |
| Store only trait IDs, regenerate visuals from IDs | Smaller database storage | Trait definition changes retroactively affect all pets, versioning nightmare, can't guarantee consistency | Never — visual identity must be immutable |
| Single material for all pets | Simplest batching approach | Can't vary shaders per-pet (glow, shimmer effects), less visual variety | Acceptable for MVP if rare traits are deferred to Phase 2 |
| Regenerate traits for existing pets without migration strategy | Immediate visual improvement | Destroys pet identity, user backlash, "this isn't my pet anymore" | Never — pets are emotional investments |
| Optimize only single-pet view | Fastest to ship | Marketplace/breeding screens unusable, performance cliff in multi-pet contexts | Acceptable for MVP if multi-pet views are delayed, but must profile before those features launch |

## Integration Gotchas

Common mistakes when connecting to external services or existing systems.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Three.js + Next.js SSR | Rendering Three.js components on server causes "window is not defined" errors | Use dynamic imports with `ssr: false` for all Three.js components. Wrap in `'use client'` directive. |
| Prisma JSON field for traits | Assuming JSON field is automatically typed, treating as `any` | Define TypeScript type for trait structure, use Prisma's `Json` type with type assertion, validate with Zod schema. |
| React Three Fiber in multiple routes | Creating new Three.js renderer per page, memory leaks | Reuse `<Canvas>` context where possible, dispose geometries/materials in cleanup, monitor `renderer.info.memory`. |
| AR viewer + trait renderer | Assuming enhanced renderer works in AR without testing | AR has separate code path, must test WebXR specifically, implement device-specific optimizations. |
| Breeding system + visual traits | Regenerating offspring visuals with pure random seed | Derive offspring seed from parent trait hashes and breeding timestamp for genetic consistency. |
| Migration + existing pets | Running migration without considering pets created mid-migration | Use expand-and-contract: nullable traits → backfill → require traits. Handle null traits gracefully during transition. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Calculating world matrices every frame for all pets | High CPU usage, frame drops even with low poly count | Set `scene.autoUpdate = false`, `matrixAutoUpdate = false` for static pets, only update when pet moves/animates | 20+ pets on screen (marketplace grid) |
| Separate draw call per pet | Draw call count scales linearly with pets, GPU stall | Use InstancedMesh (same geometry) or BatchedMesh (varied geometry) to batch into single draw call | 50+ pets, especially mobile |
| Real-time animation for off-screen pets | Wasted CPU cycles, battery drain | Implement viewport culling with Intersection Observer, pause animations for off-screen pets | Scrollable feed with 100+ pets |
| Creating new objects in animation loop | Garbage collection pauses cause frame stutters | Preallocate objects, reuse with object pooling, write garbage-free animation code | Continuous use >2 minutes |
| Loading all pet textures upfront | Long initial load time, high memory usage | Lazy load textures per pet, use texture atlasing to batch similar traits, implement LRU cache | 1000+ pets in database |
| No LOD (level of detail) system | Mobile devices render full complexity even for tiny thumbnails | Implement LOD: simplified geometry/materials for small viewports and AR contexts | Mobile users, AR mode |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing trait generation algorithm in client code | Users reverse-engineer to predict rare traits, manipulate marketplace | Generate traits server-side only, never expose seed algorithm or rarity weights to client |
| No validation on trait JSON structure | Malicious users inject arbitrary data in traits field causing rendering crashes | Validate trait structure with Zod schema before saving, sanitize on read, never trust client-provided traits |
| Deterministic seed from user-controlled input | Users craft seeds to guarantee rare traits, flooding marketplace with "rare" pets | Use server-generated UUIDs or hashed timestamps + secret salt for seeds, never accept user-provided seeds |
| Client-side trait regeneration | Users manipulate local state to "reroll" traits until rare combination appears | All trait generation happens server-side during pet creation, client only renders provided traits |
| Trait data in URL parameters | Users share URLs with modified traits to show off pets they don't own | Fetch traits from database using pet ID, ignore any trait data from URL/query params |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Trait generation at render time instead of creation | Pet appearance changes on refresh, user sees different pet each time | Generate and store traits permanently at pet creation, render stored traits consistently |
| No preview during pet creation | User commits to pet before seeing appearance, disappointment leads to abandonment | Show live preview during creation flow, let appearance influence name/bonding before commit |
| All traits equally common | No excitement about rare/unique pets, marketplace value is flat | Implement rarity tiers (common/uncommon/rare/legendary), communicate rarity in UI |
| Overwhelming trait variety with no categories | Users can't describe their pet ("it has the blue thing with sparkles") | Group traits into categories (body color, pattern, accessories), use descriptive names |
| Breeding offspring look nothing like parents | Breaks user mental model of genetics, breeding feels random | Visual traits should visibly blend parent features, maintain family resemblance |
| No trait details on hover/inspect | Users can't tell what makes pet special, can't articulate value in marketplace | Show trait breakdown with rarity indicators, let users inspect and appreciate uniqueness |
| Animations too intense/distracting | Causes motion sickness, distracts from chat/interaction | Provide `prefers-reduced-motion` support, make animations subtle (breathing, blinking), disable-able setting |
| Pet appears immediately without load state | Jarring flash when traits load, feels broken on slow connections | Show loading skeleton matching pet silhouette, fade in when ready |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Trait Generation**: Tested with 1000+ samples to catch rare color clashes and unreadable combinations
- [ ] **Determinism**: Same pet looks identical on Chrome/Safari/Firefox/iOS/Android
- [ ] **Performance**: Profiled with 50+ pets on screen simultaneously (marketplace grid scenario)
- [ ] **AR Context**: Enhanced renderer tested specifically in WebXR AR mode on target mobile devices
- [ ] **Migration**: Validated with production-scale data (10k+ pets), includes rollback plan
- [ ] **Breeding Integration**: Offspring visual traits derive from parent traits, not pure random
- [ ] **All Display Contexts**: Tested in pet detail, marketplace thumbnail, chat sidebar, breed selector, friend feed, AR viewer
- [ ] **Mobile Performance**: Tested on lower-end devices (iPhone SE, mid-range Android), thermal throttling scenarios
- [ ] **Accessibility**: Animations respect `prefers-reduced-motion`, trait descriptions for screen readers
- [ ] **Error Recovery**: Graceful handling when trait JSON is corrupted/missing, fallback to safe default
- [ ] **Viewport Responsiveness**: Pet renders correctly at 40x40px thumbnail through 800x800px detail view
- [ ] **Animation Cleanup**: No memory leaks over 10-minute continuous use, geometries/materials disposed properly

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Cross-device non-determinism discovered post-launch | HIGH | 1. Implement deterministic PRNG, 2. Version trait generation algorithm, 3. Regenerate all pets with v2 algorithm, 4. Store algorithm version with pet, 5. Support rendering both v1 (legacy) and v2 (fixed) |
| Color clashing at scale | MEDIUM | 1. Implement color harmony validator, 2. Query pets with offensive combinations, 3. Regenerate traits for affected pets (preserve other attributes), 4. Add validation to prevent future issues |
| Migration data loss | HIGH (if no backups) | 1. Restore from pre-migration database backup, 2. Fix migration script, 3. Re-run with validation, 4. If no backup: apologize publicly, offer compensation to affected users |
| Performance collapse in marketplace | MEDIUM | 1. Implement viewport culling immediately, 2. Add loading state/pagination, 3. Optimize with batching in next release, 4. Document performance targets going forward |
| AR performance degradation | MEDIUM | 1. Add device detection, 2. Serve simplified LOD in AR mode, 3. Disable expensive effects on mobile, 4. Communicate performance requirements to users |
| Trait-genetics mismatch | MEDIUM | 1. Create mapping between genetics and visual traits, 2. Regenerate visual traits seeded from genetics hash, 3. Grandfather existing pets (keep current appearance) vs. regenerate (up to PM) |
| Missing display contexts | LOW | 1. Audit all pet display locations, 2. Add visual regression test for each, 3. Fix rendering issues per context, 4. Add new context checklist to PR template |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Cross-device non-determinism | Phase 1: Trait Generation | Generate 100 pets, render on 3 browsers + 2 mobile devices, compare pixel-perfect screenshots |
| Color clashing at scale | Phase 1: Trait Generation | Generate 1000 pets, manual review + automated contrast ratio checks, reject offensive combos |
| Migration data loss | Phase 2: Database Migration | Test migration on copy of production DB, validate record counts, test rollback procedure |
| Performance collapse (multi-pet) | Phase 3: Rendering Optimization | Profile marketplace with 50 pets, ensure <100 draw calls, maintain 60fps |
| AR performance degradation | Phase 3: Rendering Optimization | Test AR mode on target devices, maintain 60fps for 10+ minutes continuous use |
| Trait-genetics mismatch | Phase 1: Trait Generation | Verify visual traits align with genetic traits for 100 test pets |
| Missing display contexts | Phase 4: Integration Testing | Visual regression suite covering all 7+ display contexts (detail, thumbnail, AR, chat, etc.) |

## Sources

**Procedural Generation & Character Systems:**
- [A Primer on Procedural Character Generation for Games](https://link.springer.com/chapter/10.1007/978-3-319-53088-8_7)
- [Procedurally Generating Personalities](https://www.gamedeveloper.com/design/procedurally-generating-personalities)
- [Runtime Procedural Character Generation - DEV Community](https://dev.to/goals/runtime-procedural-character-generation-161d)

**Color Theory & Harmony:**
- [Procedural Color Algorithm | by Shahriar Shahrabi | Medium](https://shahriyarshahrabi.medium.com/procedural-color-algorithm-a37739f6dc1)
- [Procedural Color Schemes The Easy Way With HSL — Zach Moore](https://zachmoore.dev/blog/procedural-color-schemes-the-easy-way-with-hsl/)
- [How to Choose Colours Procedurally (Algorithms) – Dev.Mag](http://devmag.org.za/2012/07/29/how-to-choose-colours-procedurally-algorithms/)

**Determinism & Cross-Platform Consistency:**
- [Floating Point Determinism | Gaffer On Games](https://gafferongames.com/post/floating_point_determinism/)
- [Cross platform RTS synchronization and floating point indeterminism](https://www.gamedeveloper.com/programming/cross-platform-rts-synchronization-and-floating-point-indeterminism)
- [Randomness should be consistent across devices · Issue #84234 · pytorch/pytorch](https://github.com/pytorch/pytorch/issues/84234)

**Three.js Performance Optimization:**
- [Three.js Instances: Rendering Multiple Objects Simultaneously | Codrops](https://tympanus.net/codrops/2025/07/10/three-js-instances-rendering-multiple-objects-simultaneously/)
- [100 Three.js Best Practices (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [BatchedMesh for High-Performance Rendering in Three.js](https://waelyasmina.net/articles/batchedmesh-for-high-performance-rendering-in-three-js/)
- [Draw Calls: The Silent Killer | Three.js Roadmap](https://threejsroadmap.com/blog/draw-calls-the-silent-killer)
- [Building Efficient Three.js Scenes: Optimize Performance While Maintaining Quality | Codrops](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)

**WebGL & Mobile Performance:**
- [Building a 60FPS WebGL Game on Mobile — Airtight Interactive](https://www.airtightinteractive.com/2015/01/building-a-60fps-webgl-game-on-mobile/)
- [WebGL in Mobile Development: Challenges and Solutions](https://blog.pixelfreestudio.com/webgl-in-mobile-development-challenges-and-solutions/)

**WebXR & AR Performance:**
- [WebXR Device API](https://immersiveweb.dev/)
- [Get started with Augmented Reality on the web using Three.js and WebXR | Medium](https://medium.com/sopra-steria-norge/get-started-with-augmented-reality-on-the-web-using-three-js-and-webxr-part-1-8b07757fc23a)

**Database Migration Strategies:**
- [Migrations Overview - EF Core | Microsoft Learn](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/)
- [Strategies for Reliable Schema Migrations | Atlas](https://atlasgo.io/blog/2024/10/09/strategies-for-reliable-migrations)
- [How to migrate a database schema at scale - LogRocket Blog](https://blog.logrocket.com/how-to-migrate-a-database-schema-at-scale/)

**Game Development Patterns:**
- [Composition over Inheritance - Example in game development](https://www.ckhang.com/blog/2020/composition-over-inheritance/)
- [Game developers: don't use inheritance for your game objects](https://unlikekinds.com/article/game-components)

**Texture & Asset Optimization:**
- [Runtime texture atlas generation | Arkadiusz Marud](https://arekmarud.wordpress.com/2016/05/13/runtime-texture-atlas-generation/)
- [Texture Atlas Optimization in 3D: Improve Render Speed & Efficiency](https://garagefarm.net/blog/texture-atlas-optimizing-textures-in-3d-rendering)

---
*Pitfalls research for: Mesmer Pet Appearance Enhancement System*
*Researched: 2026-02-09*
*Confidence: MEDIUM-HIGH (HIGH for Three.js/performance patterns from official sources, MEDIUM for migration strategies requiring project-specific validation)*

# Roadmap: Mesmer Pet Appearance Enhancement

## Overview

Transform Mesmer's virtual pets from generic white polygons into visually distinctive companions through procedural trait generation, SVG rendering, and idle animations. This roadmap delivers the foundation (trait generation + rendering), migrates existing pets, adds life through animations, rolls out enhanced visuals across all display contexts, and validates performance at scale.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Trait generation system and SVG rendering
- [x] **Phase 2: Database Integration** - Migration and pet creation flow
- [x] **Phase 3: Animation & Persistence** - Idle animations and trait persistence
- [x] **Phase 4: Display Rollout** - Replace white polygons across all contexts
- [ ] **Phase 5: Performance & Quality** - Validation and optimization

## Phase Details

### Phase 1: Foundation
**Goal**: System generates unique, visually distinctive pets with procedural traits rendered via SVG
**Depends on**: Nothing (first phase)
**Requirements**: TRAIT-01, TRAIT-02, TRAIT-03, TRAIT-04, TRAIT-05, TRAIT-06, RENDER-01, RENDER-02, RENDER-03, RENDER-04, RENDER-05, RENDER-06
**Success Criteria** (what must be TRUE):
  1. System generates 48,000+ unique visual combinations from trait categories (body color, pattern, accessory, size, expression)
  2. Same pet renders identically across all devices and browsers (iOS, Android, Chrome, Safari)
  3. Generated pets have aesthetically pleasing color combinations with no clashing (validated with 1000+ samples)
  4. Pet renders as layered SVG at any size (small cards, medium dashboard, large focus) without pixelation
  5. System handles missing or invalid trait data gracefully with fallback defaults
**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md -- Deterministic trait generation system (TDD: types, validation, seeded PRNG, color harmony, rarity) - Completed 2026-02-09
- [x] 01-02-PLAN.md -- SVG rendering system (layer components + PetSVG composer with sizing and fallbacks) - Completed 2026-02-09

### Phase 2: Database Integration
**Goal**: All existing pets receive unique visual traits and new pets generate traits automatically on creation
**Depends on**: Phase 1 (trait generation must work before migration)
**Requirements**: MIGRATE-01, MIGRATE-02, MIGRATE-03, MIGRATE-04, MIGRATE-05, MIGRATE-06, CREATE-01, CREATE-02, CREATE-03
**Success Criteria** (what must be TRUE):
  1. All existing pets in database have unique visual traits assigned (zero pets without traits)
  2. Migration completes without downtime or data loss (existing functionality continues working)
  3. New pet creation automatically generates and saves traits to database
  4. Created pets display with full visual features immediately after creation
**Plans:** 2 plans

Plans:
- [x] 02-01-PLAN.md -- Schema migration and data backfill (add traits column, backfill all existing pets with deterministic traits) - Completed 2026-02-09
- [x] 02-02-PLAN.md -- Pet creation flow update (generate and persist traits on new pet creation, verify API responses) - Completed 2026-02-09

### Phase 3: Animation & Persistence
**Goal**: Pets feel alive through idle animations and maintain visual identity across sessions
**Depends on**: Phase 2 (pets must have traits before animating)
**Requirements**: PERSIST-01, PERSIST-02, PERSIST-03, PERSIST-04, ANIM-01, ANIM-02, ANIM-03, ANIM-04, ANIM-05, ANIM-06, ANIM-07
**Success Criteria** (what must be TRUE):
  1. Pets display smooth idle breathing animation at 60fps
  2. Pets blink randomly at natural intervals (3-5 seconds)
  3. Pets display subtle movement animations appropriate to body type
  4. Animations can be disabled for motion sensitivity (accessibility compliance)
  5. Same pet loads with identical appearance after page reload or across browser sessions
**Plans:** 2 plans

Plans:
- [x] 03-01-PLAN.md -- Trait persistence and version migration (loadTraits utility, backward compat, tests) - Completed 2026-02-09
- [x] 03-02-PLAN.md -- Animation system (breathing, blinking, hooks, CSS keyframes, AnimatedPetSVG wrapper) - Completed 2026-02-09

### Phase 4: Display Rollout
**Goal**: Enhanced pet rendering appears everywhere in the app, replacing all white polygon placeholders
**Depends on**: Phase 3 (animated rendering must work before rollout)
**Requirements**: DISPLAY-01, DISPLAY-02, DISPLAY-03, DISPLAY-04, DISPLAY-05, DISPLAY-06
**Success Criteria** (what must be TRUE):
  1. Dashboard main view shows enhanced pets (no white polygons)
  2. Pet cards and thumbnails display enhanced visuals
  3. Marketplace listings show enhanced pets
  4. Inventory and collection views show enhanced pets
  5. No visual regressions in layout or sizing after enhancement
  6. Zero white polygon pets remain visible in any user-facing context
**Plans:** 2 plans

Plans:
- [x] 04-01-PLAN.md -- Replace PetModel3D with AnimatedPetSVG in dashboard and PetCard (primary display contexts) - Completed 2026-02-10
- [x] 04-02-PLAN.md -- Replace PetModel3D in breed, friends, and marketplace pages (remaining contexts + visual verification) - Completed 2026-02-10

### Phase 5: Performance & Quality
**Goal**: System maintains 60fps with multiple pets and passes quality validation
**Depends on**: Phase 4 (all display contexts must exist before optimizing)
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, QUALITY-01, QUALITY-02
**Success Criteria** (what must be TRUE):
  1. Single pet rendering maintains 60fps (completes in <16ms per frame)
  2. Views with 10 simultaneous pets maintain 60fps
  3. Views with 20+ pets activate viewport culling to maintain performance
  4. Color combinations pass aesthetic validation (no clashing across 1000+ samples)
  5. Users can visually distinguish pets from each other at a glance
**Plans:** 4 plans

Plans:
- [x] 05-01-PLAN.md -- Performance benchmarks and AnimatedPetSVG memoization (PERF-01, PERF-02, PERF-03, PERF-05) - Completed 2026-02-10
- [x] 05-02-PLAN.md -- Quality validation test suites for color harmony and visual distinctiveness (QUALITY-01, QUALITY-02) - Completed 2026-02-10
- [x] 05-03-PLAN.md -- Viewport culling with LazyPetGrid component (PERF-04) - Completed 2026-02-10
- [x] 05-04-PLAN.md -- Gap closure: Integrate LazyPetGrid into marketplace and friends pages (PERF-04 wiring) - Completed 2026-02-10

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-02-09 |
| 2. Database Integration | 2/2 | Complete | 2026-02-09 |
| 3. Animation & Persistence | 2/2 | Complete | 2026-02-09 |
| 4. Display Rollout | 2/2 | Complete | 2026-02-10 |
| 5. Performance & Quality | 4/4 | Complete | 2026-02-10 |

---
*Roadmap created: 2026-02-09*
*Last updated: 2026-02-10 (Phase 5 complete)*

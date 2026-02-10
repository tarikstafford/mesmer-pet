# Mesmer - Virtual Pet Companion Platform

## What This Is

Mesmer is a full-stack virtual pet platform where users create, nurture, and interact with AI-powered companions. Pets have personalities driven by genetic traits, can chat using LLMs, breed to create offspring with inherited characteristics, and develop through engagement systems. The platform includes breeding mechanics, marketplace trading, skill systems, and memory management to create persistent, evolving relationships between users and their virtual pets.

## Core Value

Users form emotional connections with unique, visually distinctive pets that feel alive through personality-driven interactions and visual appeal.

## Requirements

### Validated

<!-- Already implemented in existing codebase -->

- ✓ User authentication with email/password and session management — existing
- ✓ Pet creation with genetic trait inheritance system — existing
- ✓ AI-powered chat using OpenAI with personality-based prompts — existing
- ✓ Pet breeding mechanics with genetics and cooldown system — existing
- ✓ Marketplace for peer-to-peer pet trading with Stripe integration — existing
- ✓ Daily engagement tracking with streaks and challenges — existing
- ✓ Stat degradation system (hunger, happiness, health) — existing
- ✓ Memory management with recent interactions and summarization — existing
- ✓ Skill system (chess, art, sports, education) with proficiency tracking — existing
- ✓ Recovery items to restore pet health and prevent critical states — existing
- ✓ Cross-platform sync for consistent state across devices — existing
- ✓ Admin dashboard for platform management — existing
- ✓ 3D AR pet visualization using Three.js/React Three Fiber — existing
- ✓ Tutorial progression system for new users — existing
- ✓ Error tracking and monitoring with Sentry — existing
- ✓ Comprehensive test coverage (unit, E2E, accessibility, visual regression, performance) — existing

<!-- v1.0 Pet Appearance Enhancement -->

- ✓ Pet visual trait system with 6 trait categories (body color, pattern, accessory, size, expression) — v1.0
- ✓ Deterministic trait generation with weighted rarity and HSL color harmony — v1.0
- ✓ SVG-based modular visual component library (BodyLayer, PatternLayer, AccessoryLayer, ExpressionLayer) — v1.0
- ✓ PetSVG renderer composing traits with proper layering and fallback handling — v1.0
- ✓ GPU-accelerated idle animation system (breathing, blinking) with 60fps performance — v1.0
- ✓ Database schema with traits JSON column and migration to backfill 92 existing pets — v1.0
- ✓ Pet creation flow auto-generates and persists visual traits — v1.0
- ✓ AnimatedPetSVG replaced white polygons across dashboard, marketplace, breed, and friends pages — v1.0
- ✓ Trait persistence with version-aware migration ensuring consistent appearance — v1.0
- ✓ Viewport culling for 20+ pet grids with LazyPetGrid component — v1.0

### Active

<!-- Future milestone work -->

### Out of Scope

<!-- Explicitly deferred or excluded for this milestone -->

- User customization of pet appearance — Phase 2 feature, foundation first
- Trait evolution based on pet stats/progression — Requires baseline visual system
- Breeding system combining parent visual traits — Genetics exists, visual inheritance later
- Marketplace filtering/sorting by rare visual traits — Requires trait system first
- Multiple pet species with different base shapes — Single polygon species for v1
- Advanced animations (walking, jumping, complex interactions) — Idle animations only for v1
- Sound effects for pet actions — Visual enhancement priority
- Trait unlock system or achievement-based traits — All traits available initially
- NFT integration or blockchain-based traits — Not aligned with core value
- Real-time multiplayer pet interactions — Single-player focus

## Context

**Current State (v1.0 Shipped):**
- All pets now render as visually distinctive SVG graphics with unique traits (body color, pattern, accessory, expression)
- 48,000+ unique visual combinations provide sufficient variety to ensure users rarely see duplicate pets
- GPU-accelerated idle animations (breathing, blinking) make pets feel alive at 60fps
- Complete viewport culling system handles 20+ pet grids efficiently
- Zero white polygon placeholders remain in user-facing contexts
- All 92 existing pets migrated to visual trait system with zero downtime

**Technical Environment:**
- Next.js 16 App Router with TypeScript full-stack implementation
- React 19 with SVG-based pet rendering (Three.js coexists for AR features)
- Prisma ORM with SQLite/LibSQL database (Turso) - traits stored as JSON
- Seedrandom for deterministic cross-platform trait generation
- Comprehensive testing infrastructure (Vitest, Playwright, Percy, Lighthouse)
- ~37,500 lines of TypeScript code

**v1.0 Achievement:**
- 66 files modified, 10,505 insertions, 227 deletions
- 5 phases, 12 plans completed in ~19 hours
- Comprehensive quality validation: 1,500+ color harmony samples, 1,000+ uniqueness samples - zero failures
- Performance validated: <16ms single pet render, <100ms for 10 pets

**Strategic Importance:**
- Visual foundation complete - ready for future features: breeding visual traits, customization marketplace, rare trait collections
- Improved user retention and emotional investment through distinctive pet appearances
- Foundation for gamification around unique visual combinations and rarity tiers

## Constraints

- **Tech Stack**: Must use existing React/Three.js rendering pipeline — no new rendering frameworks
- **Timeline**: Critical priority, target 3 weeks for complete implementation and migration — Why: Current appearance hurting user experience
- **Performance**: Animations must maintain 60fps on target devices — Why: Smooth experience essential for "alive" feeling
- **Database**: Traits stored as JSON in existing Pet table — Why: Minimize schema changes, leverage Prisma JSON support
- **Compatibility**: Must work with existing 3D AR viewer and all pet display contexts — Why: Don't break working features
- **Migration**: Zero downtime migration for existing pets — Why: Production users can't lose access
- **Accessibility**: Animations must be disable-able for motion sensitivity — Why: WCAG compliance and user comfort

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SVG-based trait rendering over complex 3D models | Scalable at any size, performant, easier to generate procedurally than modeling | ✓ Good - Zero pixelation at any size, 60fps animations achieved |
| Trait generation at pet creation, not on-demand | Consistent appearance, simpler caching, prevents re-rendering issues | ✓ Good - Same pet renders identically across all contexts |
| 48,000+ unique combinations from trait categories | Sufficient variety to ensure users rarely see duplicates, room for expansion | ✓ Good - 1,000 samples showed zero duplicates |
| Auto-migration of all existing pets | Immediate visual improvement for all users, prevents two-tier experience | ✓ Good - 92 pets migrated with zero downtime |
| GPU-accelerated CSS animations only | Best performance, broad browser support, simpler than WebGL animations | ✓ Good - 60fps maintained, tab pause working |
| Store traits as JSON in Pet table | Flexible schema, easy to extend, leverages existing Prisma setup | ✓ Good - Version-aware migration system future-proof |
| Seedrandom for cross-platform determinism | Industry standard, proven reliability across devices | ✓ Good - Same pet ID produces identical traits on all platforms |
| HSL color space with harmony constraints | Prevents muddy/clashing color combinations | ✓ Good - Zero harmony failures across 1,500+ samples |
| React.memo optimization for AnimatedPetSVG | Prevents unnecessary re-renders in grid contexts | ✓ Good - Significant performance improvement in 20+ pet grids |
| LazyPetGrid viewport culling for large collections | Maintains performance with 20+ simultaneous pets | ✓ Good - 70-80% reduction in active animations

---
*Last updated: 2026-02-10 after v1.0 milestone completion*

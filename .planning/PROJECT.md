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

### Active

<!-- Current milestone: Pet Appearance Enhancement System -->

- [ ] **VISUAL-01**: Pet visual trait system with 6+ trait categories (body color, pattern, accessory, size, expression)
- [ ] **VISUAL-02**: Random trait generation with weighted rarity and aesthetic color combinations
- [ ] **VISUAL-03**: Modular visual component library (PetBody, PetPattern, PetAccessory, PetExpression)
- [ ] **VISUAL-04**: Main PetRenderer component composing traits with proper layering
- [ ] **VISUAL-05**: Idle animation system (breathing, blinking, subtle movement) with GPU acceleration
- [ ] **VISUAL-06**: Database migration to add traits column to Pet schema
- [ ] **VISUAL-07**: Migration script to auto-generate traits for all existing pets
- [ ] **VISUAL-08**: Updated pet creation flow to generate traits automatically
- [ ] **VISUAL-09**: Replace white polygon rendering with enhanced PetRenderer throughout app
- [ ] **VISUAL-10**: Trait persistence ensuring consistent appearance across sessions

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

**Current State:**
- Pets currently render as basic white 3D polygon shapes with minimal visual distinction
- Robust backend systems for genetics, breeding, personality, and engagement already implemented
- Trait system exists for genetic inheritance but lacks visual representation
- Users report white polygons feel like placeholders and reduce emotional attachment
- Foundation is solid but visual polish is critical for user experience

**Technical Environment:**
- Next.js 16 App Router with TypeScript full-stack implementation
- React 19 with Three.js/React Three Fiber for 3D rendering
- Prisma ORM with SQLite/LibSQL database (Turso)
- OpenAI integration for chat personalities
- Comprehensive testing infrastructure (Vitest, Playwright, Percy, Lighthouse)

**User Feedback:**
- "Pets look too generic, can't tell them apart"
- "Would be more engaged if pets felt unique visually"
- "White shapes feel unfinished, like a prototype"

**Strategic Importance:**
- Visual enhancement unlocks future features: breeding visual traits, customization marketplace, rare trait collections
- Critical for user retention and emotional investment
- Foundation for potential gamification around unique appearances

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
| SVG-based trait rendering over complex 3D models | Scalable at any size, performant, easier to generate procedurally than modeling | — Pending |
| Trait generation at pet creation, not on-demand | Consistent appearance, simpler caching, prevents re-rendering issues | — Pending |
| 48,000+ unique combinations from trait categories | Sufficient variety to ensure users rarely see duplicates, room for expansion | — Pending |
| Auto-migration of all existing pets | Immediate visual improvement for all users, prevents two-tier experience | — Pending |
| GPU-accelerated CSS animations only | Best performance, broad browser support, simpler than WebGL animations | — Pending |
| Store traits as JSON in Pet table | Flexible schema, easy to extend, leverages existing Prisma setup | — Pending |

---
*Last updated: 2026-02-09 after project initialization*

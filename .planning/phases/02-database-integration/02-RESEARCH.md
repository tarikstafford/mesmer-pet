# Phase 2: Database Integration - Research

**Researched:** 2026-02-09
**Domain:** Database migrations, JSON column integration, and data backfill patterns
**Confidence:** HIGH

## Summary

Phase 2 requires integrating the Phase 1 trait generation system with the database by adding a JSON column to the Pet table, backfilling 92 existing pets with deterministic traits, and updating pet creation to automatically generate and persist traits. The core technical challenge is executing a zero-downtime migration that adds the `traits` column, validates the trait generation system against all existing pet IDs, and ensures new pets immediately display with full visual features.

**Key technical domains:** Prisma Migrate workflows, SQLite JSON/JSONB storage, expand-and-contract migration pattern, transaction-based data backfill, Zod runtime validation for JSON data, and TypeScript type safety for JSON columns.

**Primary recommendation:** Use Prisma's `migrate dev --create-only` to create a migration file, add custom SQL for the `traits` column (TEXT type for SQLite compatibility), write a separate TypeScript data migration script using Prisma transactions to backfill all existing pets with traits generated from their IDs, validate each trait object with Zod before saving, and update the pet creation flow to generate traits before database insert.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma Migrate | 7.3.0 | Schema versioning and migration execution | Integrated with project's Prisma ORM; declarative schema with migration history tracking |
| Prisma Client | 7.3.0 | Type-safe database queries with JSON support | Already in use; provides `Prisma.JsonValue` type and transaction support |
| Zod | 4.3.6 | Runtime validation for JSON trait data | Already in project; essential for validating traits before database persistence |
| SQLite | 3.51.0+ | Database with JSON/JSONB support | Existing database; modern versions (3.51.0+, Nov 2025) include JSONB performance optimizations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| prisma-json-types-generator | 3.x | Type-safe Prisma JSON fields | For compile-time type safety on `traits` column (optional but recommended) |
| TypeScript | 5.9.3 | Static type checking for migration scripts | Always - ensures trait generation returns correct type before DB insert |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSON column | Separate `PetVisualTrait` table | More queries (1 pet fetch + N trait fetches), harder to version, slower. JSON is correct for flat trait lists that are always fetched together. |
| Custom SQL migration | Only Prisma schema change | Default migration drops/recreates column, losing flexibility to add custom backfill logic. Custom SQL required for data preservation. |
| Inline backfill in migration.sql | Separate TypeScript script | SQL can backfill but loses type safety, can't call trait generation functions. TypeScript script provides validation and error handling. |
| Single transaction for all pets | Batched transactions | Single transaction locks table longer but simpler for 92 pets. Batching needed only for 1000+ records. |

**Installation:**
```bash
# All dependencies already installed
npx prisma migrate dev --create-only
# TypeScript script will use existing @prisma/client and trait generation functions
```

## Architecture Patterns

### Recommended Project Structure
```
prisma/
├── migrations/
│   └── YYYYMMDDHHMMSS_add_pet_traits_column/
│       └── migration.sql              # ALTER TABLE Pet ADD COLUMN traits TEXT
├── scripts/
│   └── backfill-pet-traits.ts         # Data migration script
└── schema.prisma                       # Updated with traits Json field

src/
├── lib/
│   ├── traits/
│   │   ├── generation.ts              # Already exists from Phase 1
│   │   └── validation.ts              # Already exists from Phase 1
│   └── genetics.ts                     # Update createPetWithGenetics
└── app/api/pets/
    └── route.ts                        # Update POST handler to save traits
```

### Pattern 1: Expand-and-Contract Migration with Custom SQL
**What:** Add new column without breaking existing functionality, backfill data, then optionally enforce constraints
**When to use:** Adding columns to tables with existing data in production
**Example:**
```typescript
// Step 1: Update schema.prisma
model Pet {
  id        String   @id @default(uuid())
  name      String
  // ... existing fields ...
  traits    Json?    // Optional first, enforce later if needed
}

// Step 2: Create migration with --create-only
// $ npx prisma migrate dev --create-only --name add_pet_traits_column

// Step 3: Edit migration.sql
// Source: https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations
-- Migration: add_pet_traits_column
-- Add traits column as TEXT (SQLite stores JSON as TEXT)
ALTER TABLE "Pet" ADD COLUMN "traits" TEXT;

// Step 4: Apply migration
// $ npx prisma migrate dev
```

### Pattern 2: Transaction-Based Data Backfill Script
**What:** Use Prisma Client in a transaction to generate and save traits for all existing pets
**When to use:** After schema migration, before deploying code that expects traits
**Example:**
```typescript
// Source: https://www.prisma.io/docs/guides/data-migration
import { PrismaClient } from '@prisma/client';
import { generatePetTraits } from '@/lib/traits/generation';
import { PetTraitsSchema } from '@/lib/traits/validation';

const prisma = new PrismaClient();

async function backfillPetTraits() {
  console.log('Starting pet traits backfill...');

  await prisma.$transaction(async (tx) => {
    const pets = await tx.pet.findMany({
      where: { traits: null }, // Only pets without traits
      select: { id: true, name: true }
    });

    console.log(`Found ${pets.length} pets without traits`);

    for (const pet of pets) {
      // Generate deterministic traits from pet ID
      const traits = generatePetTraits(pet.id);

      // Validate before saving (catches generation errors)
      const validated = PetTraitsSchema.parse(traits);

      // Update pet with traits
      await tx.pet.update({
        where: { id: pet.id },
        data: { traits: validated }
      });

      console.log(`✓ Generated traits for ${pet.name} (${pet.id})`);
    }
  });

  console.log('Backfill complete!');
}

backfillPetTraits()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

### Pattern 3: Pet Creation with Trait Generation
**What:** Update createPetWithGenetics to generate visual traits alongside genetic traits
**When to use:** All new pet creation after migration
**Example:**
```typescript
// Source: Existing src/lib/genetics.ts + Phase 1 trait generation
import { generatePetTraits } from '@/lib/traits/generation';
import { PetTraitsSchema } from '@/lib/traits/validation';

export async function createPetWithGenetics(userId: string, petName: string) {
  const personality = generateRandomPersonality();

  // Create the pet
  const pet = await prisma.pet.create({
    data: {
      name: petName,
      userId,
      generation: 1,
      friendliness: personality.friendliness,
      energyTrait: personality.energyTrait,
      curiosity: personality.curiosity,
      patience: personality.patience,
      playfulness: personality.playfulness,
      // NEW: Generate and validate visual traits before saving
      traits: PetTraitsSchema.parse(generatePetTraits(crypto.randomUUID()))
    }
  });

  // Assign random genetic traits (existing Trait/PetTrait system)
  await assignRandomTraits(pet.id, { visual: 4, personality: 3, skill: 0 });

  return prisma.pet.findUnique({
    where: { id: pet.id },
    include: {
      petTraits: { include: { trait: true } }
    }
  });
}
```

### Pattern 4: Runtime Validation for JSON Data
**What:** Validate JSON trait data on read/write to catch schema mismatches early
**When to use:** Whenever reading traits from database or before saving
**Example:**
```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/type-safety/prisma-validator
import { PetTraitsSchema } from '@/lib/traits/validation';

// On read: validate database data
async function getPetWithValidatedTraits(petId: string) {
  const pet = await prisma.pet.findUnique({
    where: { id: petId }
  });

  if (!pet || !pet.traits) {
    throw new Error('Pet or traits not found');
  }

  // Validate and parse JSON
  const validatedTraits = PetTraitsSchema.parse(pet.traits);

  return { ...pet, traits: validatedTraits };
}

// On write: validate before saving
async function updatePetTraits(petId: string, newTraits: unknown) {
  // Throws ZodError if invalid
  const validated = PetTraitsSchema.parse(newTraits);

  await prisma.pet.update({
    where: { id: petId },
    data: { traits: validated }
  });
}
```

### Anti-Patterns to Avoid
- **Backfilling in migration.sql with hardcoded SQL:** Loses type safety, can't call TypeScript trait generation functions. Use separate TypeScript script.
- **Making traits column required without default:** Prisma generates invalid SQL for JSON columns with defaults in SQLite (known bug). Keep optional or use TypeScript to enforce.
- **Fetching all pets without pagination:** Transaction will lock table. For 92 pets this is fine, but for 1000+ use batched transactions with `take` and `skip`.
- **Skipping validation before save:** JSON columns accept any valid JSON. Without Zod validation, corrupted trait data can enter database.
- **Using Math.random() for trait generation:** Breaks determinism. Pet ID must be the seed for seedrandom to ensure identical traits across all platforms.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Migration versioning | Custom SQL file naming/tracking system | Prisma Migrate | Prisma handles migration history in `_prisma_migrations` table, prevents duplicate runs, tracks applied migrations |
| Transaction management | Manual BEGIN/COMMIT with raw SQL | Prisma `$transaction()` | Automatic rollback on error, type-safe queries, works across all Prisma-supported databases |
| JSON schema validation | Custom validation functions with if/else | Zod schemas from Phase 1 | Zod provides runtime type checking, clear error messages, and can derive TypeScript types |
| Migration rollback | Custom down migration SQL | Prisma `migrate diff` + `db execute` | Official Prisma approach generates rollback SQL from schema diff, safer than hand-written rollbacks |
| Progress logging | console.log in migrations | Structured logging with timestamps and counts | Migration scripts need visibility for debugging; log each pet processed with success/failure status |

**Key insight:** Database migrations are deceptively complex. Edge cases (constraint violations, schema locks, partial failures) are easier to handle with Prisma's declarative approach + TypeScript data scripts than with raw SQL. The combination provides type safety, automatic rollback, and testability.

## Common Pitfalls

### Pitfall 1: SQLite JSON Default Value Bug
**What goes wrong:** Prisma generates invalid SQL when adding JSON column with `@default()` in SQLite
**Why it happens:** Known Prisma bug (prisma/prisma#26571) - SQLite doesn't natively support JSON type, Prisma's SQL generation fails
**How to avoid:** Add JSON column without default value, use TypeScript script to backfill existing rows
**Warning signs:** Migration fails with SQL syntax error mentioning JSON default value

### Pitfall 2: Missing Validation Causes Silent Data Corruption
**What goes wrong:** Trait generation bug saves invalid HSL values (h: 400, s: 150), database accepts it (JSON is just text), rendering breaks later
**Why it happens:** SQLite doesn't validate JSON structure or values, only that it's valid JSON
**How to avoid:** Always validate with `PetTraitsSchema.parse()` before saving to database
**Warning signs:** Pets render with missing colors, console errors about invalid HSL values, traits with out-of-range numbers

### Pitfall 3: Transaction Timeout on Large Datasets
**What goes wrong:** Single transaction backfilling 10,000+ pets times out or locks table for too long
**Why it happens:** SQLite locks entire database during write transactions, long-running transactions block other operations
**How to avoid:** For datasets >1000 records, use batched transactions (process 100 pets per transaction with logging between batches)
**Warning signs:** Migration script hangs, database locked errors from other processes, timeout errors

### Pitfall 4: Non-Deterministic Trait Generation in Migration
**What goes wrong:** Migration generates different traits than pet creation because of different seed logic
**Why it happens:** Backfill script uses Math.random() or Date.now() instead of pet ID as seed
**How to avoid:** Use exact same `generatePetTraits(pet.id)` call in both migration and creation flow
**Warning signs:** Pet traits change after migration re-run, same pet shows different appearance on different devices

### Pitfall 5: Forgetting to Update Pet Creation Flow
**What goes wrong:** Migration backfills existing pets, but newly created pets have `traits: null`
**Why it happens:** Updated schema but forgot to modify `createPetWithGenetics()` and API route
**How to avoid:** Update creation flow in same commit as migration, add validation tests
**Warning signs:** New pets don't display, traits column is null for recently created pets

### Pitfall 6: Migration Runs Twice on Different Environments
**What goes wrong:** Development migration backfills 50 pets, production has 10,000 pets, backfill re-runs unexpectedly
**Why it happens:** Migration history not synced between environments, or manual `prisma migrate reset`
**How to avoid:** Always use `prisma migrate deploy` in production (never `migrate dev`), check `_prisma_migrations` table before running backfill script
**Warning signs:** Backfill script processes already-migrated pets, duplicate trait data, console shows "Found 0 pets without traits" after fresh migration

## Code Examples

Verified patterns from official sources:

### Creating Migration with Custom SQL
```bash
# Source: https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations
# Step 1: Update schema.prisma to add traits field
npx prisma migrate dev --create-only --name add_pet_traits_column

# Step 2: Edit generated SQL file in prisma/migrations/
# Add any custom logic (indexes, constraints, etc.)

# Step 3: Apply migration
npx prisma migrate dev
```

### Validating Migration Before Backfill
```typescript
// Source: Project requirements + Prisma best practices
import { PrismaClient } from '@prisma/client';

async function validateMigration() {
  const prisma = new PrismaClient();

  // Check column exists
  const result = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM pragma_table_info('Pet')
    WHERE name = 'traits'
  `;

  if (result[0].count === 0) {
    throw new Error('Migration failed: traits column does not exist');
  }

  console.log('✓ Migration validated: traits column exists');
  await prisma.$disconnect();
}
```

### Idempotent Backfill Script
```typescript
// Source: https://www.prisma.io/docs/guides/data-migration
// Supports multiple runs without duplicating data
async function backfillPetTraits() {
  const prisma = new PrismaClient();

  try {
    await prisma.$transaction(async (tx) => {
      // Only process pets without traits (idempotent)
      const petsToProcess = await tx.pet.findMany({
        where: { traits: null }
      });

      if (petsToProcess.length === 0) {
        console.log('No pets to backfill - all pets already have traits');
        return;
      }

      console.log(`Processing ${petsToProcess.length} pets...`);

      for (const pet of petsToProcess) {
        const traits = generatePetTraits(pet.id);
        PetTraitsSchema.parse(traits); // Validate

        await tx.pet.update({
          where: { id: pet.id },
          data: { traits }
        });
      }
    });

    console.log('✓ Backfill complete');
  } catch (error) {
    console.error('Backfill failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
```

### Rollback Migration (Down Migration)
```bash
# Source: https://www.prisma.io/docs/orm/prisma-migrate/workflows/generating-down-migrations
# Generate rollback SQL
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma \
  --script > down.sql

# Execute rollback (only in development)
npx prisma db execute --file ./down.sql --schema prisma/schema.prisma
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JSON stored as TEXT | JSONB binary format | SQLite 3.51.0 (Nov 2025) | 5-10% smaller storage, 50%+ faster JSON functions. Prisma maps `Json` type to JSONB automatically. |
| Manual migration SQL | Prisma Migrate declarative schema | Prisma 2.0+ (2020) | Schema as source of truth, automatic migration generation, migration history tracking. |
| Application-level transactions | Database transactions via ORM | Prisma 2.12+ (2021) | Type-safe `$transaction()` API, automatic rollback on errors, cross-database support. |
| Separate migration + backfill tools | Integrated Prisma workflow | Prisma 3.0+ (2022) | Single tool for schema and data migrations, TypeScript data scripts with Prisma Client. |

**Deprecated/outdated:**
- **Prisma's `db push`** for production: Use `migrate deploy` instead. `db push` doesn't track migration history and can cause data loss.
- **Raw SQL for JSON queries in SQLite**: Modern SQLite (3.51.0+) has json_extract, jsonb_each - prefer these over string parsing.
- **Ignoring migration history**: Older Prisma versions allowed skipping migrations. Modern best practice: always sync migration history between environments.

## Open Questions

1. **Should traits column be nullable or required?**
   - What we know: Prisma has bug with JSON default values in SQLite, making column required without default causes migration errors
   - What's unclear: Performance/storage implications of nullable vs required after all pets migrated
   - Recommendation: Keep nullable (`Json?`) for safety, validate at application level with Zod

2. **What's the rollback strategy if trait generation is buggy?**
   - What we know: Can create down migration to remove column, but can't easily regenerate old PetTrait relational data
   - What's unclear: Whether to keep old PetTrait system as fallback during Phase 2
   - Recommendation: Don't remove PetTrait system in Phase 2, validate new traits against old system if possible

3. **How to handle pets created during migration?**
   - What we know: Migration adds column, backfill script runs separately
   - What's unclear: Race condition if pet created between migration and backfill completion
   - Recommendation: Deploy in order: (1) migration, (2) backfill script, (3) code update. Keep creation flow generating traits even if column exists but is null.

## Sources

### Primary (HIGH confidence)
- [Prisma Migrate - Customizing migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations) - Official workflow for custom SQL
- [Prisma Migrate - Data migrations](https://www.prisma.io/docs/guides/data-migration) - Expand-and-contract pattern with TypeScript examples
- [Prisma Migrate - Getting started](https://www.prisma.io/docs/orm/prisma-migrate/getting-started) - Migration basics and CLI commands
- [Prisma SQLite connector](https://www.prisma.io/docs/orm/overview/databases/sqlite) - JSON field mapping (JSON → JSONB in SQLite)
- [SQLite JSON functions](https://www.sqlite.org/json1.html) - Native JSON support in SQLite
- [SQLite JSONB format](https://sqlite.org/jsonb.html) - JSONB performance characteristics (5-10% smaller, 50% faster)

### Secondary (MEDIUM confidence)
- [Prisma GitHub Discussion #10031](https://github.com/prisma/prisma/discussions/10031) - Community patterns for data migrations
- [Prisma Issue #26571](https://github.com/prisma/prisma/issues/26571) - JSON default value bug in SQLite (confirmed bug)
- [Generating down migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/generating-down-migrations) - Rollback strategy
- [Migration error handling - Flyway docs](https://documentation.red-gate.com/fd/migration-error-and-logging-handling-275218520.html) - General migration best practices
- [SQLite ALTER TABLE performance - Turso blog](https://turso.tech/blog/faster-schema-changes-for-sqlite-databases) - Schema change optimization (2025)

### Tertiary (LOW confidence)
- Various blog posts on Prisma migrations (LogRocket, DEV Community) - General concepts only, not used for specific technical decisions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Prisma Migrate is project standard, SQLite JSON support confirmed in v3.51.0+, Zod already in use
- Architecture: HIGH - Expand-and-contract pattern is official Prisma recommendation, transaction-based backfill verified in docs
- Pitfalls: HIGH - JSON default bug confirmed in Prisma issue tracker, transaction timeouts are documented SQLite behavior
- Migration workflow: HIGH - All steps verified in official Prisma documentation with code examples

**Research date:** 2026-02-09
**Valid until:** 2026-04-09 (60 days - Prisma releases monthly but migration patterns are stable)

**Key uncertainties flagged:**
- Nullable vs required for traits column (LOW risk - can migrate to required later)
- Exact rollback procedure for buggy trait generation (MEDIUM risk - expand-and-contract pattern mitigates)
- Handling pets created during migration window (LOW risk - code update enforces traits on creation)

**Migration scale context:**
- Current database: 92 pets, 170 users
- Single transaction is appropriate (no batching needed)
- Migration expected to complete in <1 second
- Zero downtime possible with proper expand-and-contract implementation

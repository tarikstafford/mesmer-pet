import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { generatePetTraits } from '../../src/lib/traits/generation';
import { PetTraitsSchema } from '../../src/lib/traits/validation';

/**
 * Backfill script to add visual traits to all existing pets
 * IDEMPOTENT: Safe to run multiple times - only updates pets with null traits
 * DETERMINISTIC: Same pet ID always generates identical traits
 */

// Create standalone Prisma client (do not import singleton)
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db'
});
const prisma = new PrismaClient({ adapter });

async function backfillPetTraits() {
  try {
    console.log('🔍 Searching for pets without traits...');

    // Find all pets missing traits
    const petsWithoutTraits = await prisma.pet.findMany({
      where: {
        traits: { equals: Prisma.DbNull }
      },
      select: { id: true, name: true }
    });

    // Check if backfill is needed
    if (petsWithoutTraits.length === 0) {
      console.log('✅ All pets already have traits - nothing to backfill');
      return;
    }

    console.log(`📊 Found ${petsWithoutTraits.length} pets without traits`);
    console.log('⚙️  Generating traits...\n');

    // Update all pets in a single transaction for atomicity
    await prisma.$transaction(async (tx) => {
      for (const pet of petsWithoutTraits) {
        // Generate deterministic traits from pet ID
        const generatedTraits = generatePetTraits(pet.id);

        // Validate traits with Zod schema
        const validatedTraits = PetTraitsSchema.parse(generatedTraits);

        // Update pet with validated traits
        await tx.pet.update({
          where: { id: pet.id },
          data: { traits: validatedTraits as any }
        });

        console.log(`✓ Generated traits for ${pet.name} (${pet.id}) - rarity: ${validatedTraits.rarity}`);
      }
    });

    console.log(`\n🎉 Backfill complete: ${petsWithoutTraits.length} pets updated`);
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillPetTraits();

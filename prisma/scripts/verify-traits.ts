import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { generatePetTraits } from '../../src/lib/traits/generation';

const adapter = new PrismaLibSql({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function verifyTraits() {
  try {
    // Get a sample pet
    const pet = await prisma.pet.findFirst({
      select: { id: true, name: true, traits: true }
    });

    if (!pet) {
      console.log('No pets found in database');
      return;
    }

    console.log('Sample pet:', pet.name);
    console.log('Stored traits:', JSON.stringify(pet.traits, null, 2));

    // Regenerate traits from same ID
    const regenerated = generatePetTraits(pet.id);
    console.log('\nRegenerated traits:', JSON.stringify(regenerated, null, 2));

    // Check if they match
    const match = JSON.stringify(pet.traits) === JSON.stringify(regenerated);
    console.log('\nDeterministic match:', match ? '✅ PASS' : '❌ FAIL');

    // Count stats
    const total = await prisma.pet.count();
    const withTraits = await prisma.pet.count({
      where: { traits: { not: { equals: null } } }
    });

    console.log('\nStats:');
    console.log(`Total pets: ${total}`);
    console.log(`Pets with traits: ${withTraits}`);
    console.log(`Coverage: ${((withTraits / total) * 100).toFixed(1)}%`);
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTraits();

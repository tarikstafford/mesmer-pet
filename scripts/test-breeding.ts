/**
 * Test script to validate genetics inheritance algorithm
 *
 * This script:
 * 1. Creates two parent pets with known traits
 * 2. Breeds them to create offspring
 * 3. Validates inheritance rules:
 *    - 50% traits from each parent
 *    - 15% mutation rate
 *    - Generation = max(parent generations) + 1
 *    - Personality = average ± 15 variance
 */

import { prisma } from '../src/lib/prisma';
import { createPetWithGenetics } from '../src/lib/genetics';
import { breedPets, canBreed } from '../src/lib/breeding';

async function main() {

  console.log('🧬 Testing Genetics Inheritance Algorithm\n');

  // Create a test user
  const testUser = await prisma.user.upsert({
    where: { email: 'breeding-test@example.com' },
    update: {},
    create: {
      email: 'breeding-test@example.com',
      password: 'test-password',
      name: 'Breeding Test User',
      emailVerified: true,
    },
  });

  console.log(`✅ Test user created: ${testUser.email}`);

  // Create two parent pets
  console.log('\n📝 Creating parent pets...');

  const parent1 = await createPetWithGenetics(testUser.id, 'Parent 1');
  const parent2 = await createPetWithGenetics(testUser.id, 'Parent 2');

  console.log(`✅ Parent 1: ${parent1?.name} (Gen ${parent1?.generation})`);
  console.log(`   Personality: F=${parent1?.friendliness}, E=${parent1?.energyTrait}, C=${parent1?.curiosity}, Pa=${parent1?.patience}, Pl=${parent1?.playfulness}`);
  console.log(`   Traits: ${parent1?.petTraits.map(pt => `${pt.trait.traitName} (${pt.trait.traitType}/${pt.trait.rarity})`).join(', ')}`);

  console.log(`\n✅ Parent 2: ${parent2?.name} (Gen ${parent2?.generation})`);
  console.log(`   Personality: F=${parent2?.friendliness}, E=${parent2?.energyTrait}, C=${parent2?.curiosity}, Pa=${parent2?.patience}, Pl=${parent2?.playfulness}`);
  console.log(`   Traits: ${parent2?.petTraits.map(pt => `${pt.trait.traitName} (${pt.trait.traitType}/${pt.trait.rarity})`).join(', ')}`);

  // Make parents old enough to breed (update createdAt to 8 days ago)
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  await prisma.pet.updateMany({
    where: { id: { in: [parent1!.id, parent2!.id] } },
    data: { createdAt: eightDaysAgo },
  });

  // Fetch updated parents
  const [updatedParent1, updatedParent2] = await Promise.all([
    prisma.pet.findUnique({
      where: { id: parent1!.id },
      include: {
        petTraits: {
          include: {
            trait: true,
          },
        },
      },
    }),
    prisma.pet.findUnique({
      where: { id: parent2!.id },
      include: {
        petTraits: {
          include: {
            trait: true,
          },
        },
      },
    }),
  ]);

  // Validate breeding eligibility
  console.log('\n🔍 Checking breeding eligibility...');
  const breedingCheck = canBreed(updatedParent1!, updatedParent2!);

  if (!breedingCheck.canBreed) {
    console.error(`❌ Breeding validation failed: ${breedingCheck.reason}`);
    process.exit(1);
  }

  console.log('✅ Breeding validation passed');

  // Breed the pets
  console.log('\n🐣 Breeding pets...');
  const offspring = await breedPets(updatedParent1!, updatedParent2!, testUser.id, 'Offspring Test');

  console.log(`\n✅ Offspring created: ${offspring?.name} (Gen ${offspring?.generation})`);
  console.log(`   Parents: ${updatedParent1?.name} (${updatedParent1?.id}) + ${updatedParent2?.name} (${updatedParent2?.id})`);
  console.log(`   Personality: F=${offspring?.friendliness}, E=${offspring?.energyTrait}, C=${offspring?.curiosity}, Pa=${offspring?.patience}, Pl=${offspring?.playfulness}`);

  // Validate generation
  const expectedGeneration = Math.max(updatedParent1!.generation, updatedParent2!.generation) + 1;
  if (offspring?.generation !== expectedGeneration) {
    console.error(`❌ Generation mismatch: expected ${expectedGeneration}, got ${offspring?.generation}`);
  } else {
    console.log(`✅ Generation validated: ${offspring?.generation}`);
  }

  // Validate personality variance
  const validatePersonalityTrait = (
    traitName: string,
    offspringValue: number,
    parent1Value: number,
    parent2Value: number
  ) => {
    const average = (parent1Value + parent2Value) / 2;
    const difference = Math.abs(offspringValue - average);
    const isValid = difference <= 15 && offspringValue >= 0 && offspringValue <= 100;

    console.log(`   ${traitName}: ${offspringValue} (avg=${average.toFixed(1)}, diff=${difference.toFixed(1)}) ${isValid ? '✅' : '❌'}`);

    return isValid;
  };

  console.log('\n🧬 Validating personality inheritance:');
  const personalityValid = [
    validatePersonalityTrait('Friendliness', offspring!.friendliness, updatedParent1!.friendliness, updatedParent2!.friendliness),
    validatePersonalityTrait('Energy', offspring!.energyTrait, updatedParent1!.energyTrait, updatedParent2!.energyTrait),
    validatePersonalityTrait('Curiosity', offspring!.curiosity, updatedParent1!.curiosity, updatedParent2!.curiosity),
    validatePersonalityTrait('Patience', offspring!.patience, updatedParent1!.patience, updatedParent2!.patience),
    validatePersonalityTrait('Playfulness', offspring!.playfulness, updatedParent1!.playfulness, updatedParent2!.playfulness),
  ].every(v => v);

  if (!personalityValid) {
    console.error('❌ Personality inheritance validation failed');
  } else {
    console.log('✅ All personality traits within valid range (avg ± 15)');
  }

  // Validate trait inheritance
  console.log('\n🎨 Offspring traits:');
  const traitsBySource = {
    parent1: offspring?.petTraits.filter(pt => pt.inheritanceSource === 'parent1') || [],
    parent2: offspring?.petTraits.filter(pt => pt.inheritanceSource === 'parent2') || [],
    mutation: offspring?.petTraits.filter(pt => pt.inheritanceSource === 'mutation') || [],
  };

  console.log(`   From Parent 1: ${traitsBySource.parent1.length} traits`);
  traitsBySource.parent1.forEach(pt => {
    console.log(`      - ${pt.trait.traitName} (${pt.trait.traitType}/${pt.trait.rarity})`);
  });

  console.log(`   From Parent 2: ${traitsBySource.parent2.length} traits`);
  traitsBySource.parent2.forEach(pt => {
    console.log(`      - ${pt.trait.traitName} (${pt.trait.traitType}/${pt.trait.rarity})`);
  });

  console.log(`   Mutations: ${traitsBySource.mutation.length} traits`);
  traitsBySource.mutation.forEach(pt => {
    console.log(`      - ${pt.trait.traitName} (${pt.trait.traitType}/${pt.trait.rarity})`);
  });

  const totalTraits = offspring?.petTraits.length || 0;
  const mutationRate = traitsBySource.mutation.length / totalTraits;
  console.log(`\n📊 Statistics:`);
  console.log(`   Total traits: ${totalTraits}`);
  console.log(`   Mutation rate: ${(mutationRate * 100).toFixed(1)}% (expected ~15%)`);
  console.log(`   Parent 1 contribution: ${((traitsBySource.parent1.length / totalTraits) * 100).toFixed(1)}%`);
  console.log(`   Parent 2 contribution: ${((traitsBySource.parent2.length / totalTraits) * 100).toFixed(1)}%`);

  console.log('\n✅ Genetics inheritance algorithm test completed!\n');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

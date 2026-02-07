// Prisma seed script for predefined traits
// Run with: npx prisma db seed

import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

// Prisma 7 requires adapter for SQLite
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});

const prisma = new PrismaClient({ adapter });

// US-003: Predefined traits with rarity distribution
// 60% common, 25% uncommon, 10% rare, 5% legendary
const predefinedTraits = [
  // Visual Traits (12 traits)
  { traitName: 'Sky Blue', traitType: 'visual', rarity: 'common', description: 'A bright sky blue coloration' },
  { traitName: 'Leaf Green', traitType: 'visual', rarity: 'common', description: 'A natural leaf green color' },
  { traitName: 'Sunset Orange', traitType: 'visual', rarity: 'common', description: 'A warm sunset orange hue' },
  { traitName: 'Bubblegum Pink', traitType: 'visual', rarity: 'common', description: 'A playful bubblegum pink shade' },
  { traitName: 'Lavender Purple', traitType: 'visual', rarity: 'common', description: 'A soft lavender purple tone' },
  { traitName: 'Striped Pattern', traitType: 'visual', rarity: 'uncommon', description: 'Distinctive striped markings' },
  { traitName: 'Spotted Pattern', traitType: 'visual', rarity: 'uncommon', description: 'Spotted coat pattern' },
  { traitName: 'Gradient Fur', traitType: 'visual', rarity: 'uncommon', description: 'Color transitions smoothly across body' },
  { traitName: 'Glowing Eyes', traitType: 'visual', rarity: 'rare', description: 'Eyes that emit a soft glow' },
  { traitName: 'Crystal Horns', traitType: 'visual', rarity: 'rare', description: 'Transparent crystalline horns' },
  { traitName: 'Rainbow Shimmer', traitType: 'visual', rarity: 'legendary', description: 'Fur shimmers with rainbow iridescence' },
  { traitName: 'Galaxy Pattern', traitType: 'visual', rarity: 'legendary', description: 'Coat displays a starfield galaxy pattern' },

  // Personality Traits (10 traits)
  { traitName: 'Cheerful', traitType: 'personality', rarity: 'common', description: 'Always upbeat and positive' },
  { traitName: 'Calm', traitType: 'personality', rarity: 'common', description: 'Relaxed and peaceful demeanor' },
  { traitName: 'Energetic', traitType: 'personality', rarity: 'common', description: 'Always ready for activity and play' },
  { traitName: 'Curious', traitType: 'personality', rarity: 'uncommon', description: 'Loves to explore and ask questions' },
  { traitName: 'Loyal', traitType: 'personality', rarity: 'uncommon', description: 'Deeply attached to owner' },
  { traitName: 'Mischievous', traitType: 'personality', rarity: 'uncommon', description: 'Playfully troublesome nature' },
  { traitName: 'Wise', traitType: 'personality', rarity: 'rare', description: 'Thoughtful and perceptive' },
  { traitName: 'Empathetic', traitType: 'personality', rarity: 'legendary', description: 'Deeply understands emotions' },

  // Skill Traits (10 traits)
  { traitName: 'Quick Learner', traitType: 'skill', rarity: 'common', description: 'Picks up new skills easily' },
  { traitName: 'Athletic', traitType: 'skill', rarity: 'common', description: 'Naturally physically capable' },
  { traitName: 'Artistic', traitType: 'skill', rarity: 'common', description: 'Creative and expressive' },
  { traitName: 'Mathematical Mind', traitType: 'skill', rarity: 'uncommon', description: 'Excels at numbers and logic' },
  { traitName: 'Musical Talent', traitType: 'skill', rarity: 'uncommon', description: 'Natural sense of rhythm and melody' },
  { traitName: 'Problem Solver', traitType: 'skill', rarity: 'uncommon', description: 'Excellent at finding solutions' },
  { traitName: 'Photographic Memory', traitType: 'skill', rarity: 'rare', description: 'Can recall details perfectly' },
  { traitName: 'Linguistic Genius', traitType: 'skill', rarity: 'rare', description: 'Mastery of languages' },
  { traitName: 'Telepathic Bond', traitType: 'skill', rarity: 'legendary', description: 'Can sense owner\'s emotions remotely' },
  { traitName: 'Universal Translator', traitType: 'skill', rarity: 'legendary', description: 'Can understand and speak any language' },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing traits (idempotent seeding)
  await prisma.trait.deleteMany({});
  console.log('🧹 Cleared existing traits');

  // Insert predefined traits
  for (const trait of predefinedTraits) {
    await prisma.trait.create({
      data: trait,
    });
  }

  console.log(`✅ Created ${predefinedTraits.length} traits`);

  // Verify rarity distribution
  const rarityCount = await prisma.trait.groupBy({
    by: ['rarity'],
    _count: true,
  });

  console.log('\n📊 Rarity Distribution:');
  rarityCount.forEach((item) => {
    const percentage = ((item._count / predefinedTraits.length) * 100).toFixed(1);
    console.log(`  ${item.rarity}: ${item._count} (${percentage}%)`);
  });

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

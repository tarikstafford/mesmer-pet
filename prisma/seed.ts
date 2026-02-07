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

// US-008: Recovery Items for pets in Critical state
const recoveryItems = [
  {
    itemName: 'Health Potion',
    description: 'Restores pet from Critical state. Restores health to 50.',
    itemType: 'potion',
    price: 0.99,
    earnable: true, // Can be earned through gameplay
  },
  {
    itemName: 'Super Health Potion',
    description: 'Premium recovery item with additional benefits.',
    itemType: 'potion',
    price: 1.99,
    earnable: false,
  },
  {
    itemName: 'Revival Spell',
    description: 'Magical recovery that restores pet instantly.',
    itemType: 'spell',
    price: 4.99,
    earnable: false,
  },
];

// US-015: Predefined Skills for Marketplace
const predefinedSkills = [
  // Education Skills
  {
    skillName: 'Math Tutor',
    category: 'education',
    description: 'Your pet becomes an expert math tutor, helping you solve problems from basic arithmetic to advanced calculus.',
    price: 1.99,
    featured: true,
  },
  {
    skillName: 'Science Teacher',
    category: 'education',
    description: 'Unlock your pet\'s knowledge of biology, chemistry, and physics. Perfect for homework help and curious minds.',
    price: 1.99,
    featured: false,
  },
  {
    skillName: 'History Buff',
    category: 'education',
    description: 'Your pet can discuss historical events, civilizations, and important figures from all eras.',
    price: 0.99,
    featured: false,
  },
  {
    skillName: 'Language Coach',
    category: 'education',
    description: 'Learn new languages with your pet! Supports Spanish, French, German, Mandarin, and more.',
    price: 1.99,
    featured: false,
  },
  {
    skillName: 'Coding Mentor',
    category: 'education',
    description: 'Your pet can teach programming concepts, debug code, and explain algorithms in simple terms.',
    price: 4.99,
    featured: true,
  },

  // Games Skills
  {
    skillName: 'Chess Master',
    category: 'games',
    description: 'Play chess with your pet! It can teach strategies, explain moves, and play at any skill level.',
    price: 0.99,
    featured: false,
  },
  {
    skillName: 'Trivia Expert',
    category: 'games',
    description: 'Challenge your pet to trivia battles across countless categories. New questions daily!',
    price: 0.99,
    featured: false,
  },
  {
    skillName: 'Story Weaver',
    category: 'games',
    description: 'Create interactive stories together. Your pet will improvise adventures based on your choices.',
    price: 1.99,
    featured: true,
  },
  {
    skillName: 'Riddle Master',
    category: 'games',
    description: 'Your pet will challenge you with clever riddles and brain teasers. Can you solve them all?',
    price: 0.99,
    featured: false,
  },
  {
    skillName: 'Word Games Pro',
    category: 'games',
    description: 'Play word association, rhyme games, and vocabulary challenges with your pet.',
    price: 0.99,
    featured: false,
  },

  // Arts Skills
  {
    skillName: 'Creative Writing Coach',
    category: 'arts',
    description: 'Get feedback on your writing, brainstorm ideas, and learn storytelling techniques from your pet.',
    price: 1.99,
    featured: false,
  },
  {
    skillName: 'Poetry Composer',
    category: 'arts',
    description: 'Your pet can write poems on any topic, explain poetic forms, and help you craft your own verses.',
    price: 0.99,
    featured: false,
  },
  {
    skillName: 'Music Theory Guide',
    category: 'arts',
    description: 'Learn about music theory, chord progressions, and composition from your musically-inclined pet.',
    price: 1.99,
    featured: false,
  },
  {
    skillName: 'Art Critic',
    category: 'arts',
    description: 'Discuss art history, analyze famous works, and get thoughtful feedback on your creative projects.',
    price: 0.99,
    featured: false,
  },
  {
    skillName: 'Drawing Assistant',
    category: 'arts',
    description: 'Get step-by-step drawing tutorials, tips on shading and perspective, and artistic inspiration.',
    price: 1.99,
    featured: true,
  },

  // Sports Skills
  {
    skillName: 'Fitness Coach',
    category: 'sports',
    description: 'Your pet becomes your personal trainer! Get workout plans, motivation, and exercise tips.',
    price: 1.99,
    featured: true,
  },
  {
    skillName: 'Yoga Instructor',
    category: 'sports',
    description: 'Learn yoga poses, breathing techniques, and mindfulness practices from your zen pet.',
    price: 1.99,
    featured: false,
  },
  {
    skillName: 'Sports Analyst',
    category: 'sports',
    description: 'Discuss game strategies, player stats, and sports history across all major sports leagues.',
    price: 0.99,
    featured: false,
  },
  {
    skillName: 'Running Buddy',
    category: 'sports',
    description: 'Track your runs, get pacing advice, and stay motivated with your supportive running companion.',
    price: 0.99,
    featured: false,
  },
  {
    skillName: 'Nutrition Guide',
    category: 'sports',
    description: 'Learn about healthy eating, meal planning, and sports nutrition from your health-conscious pet.',
    price: 1.99,
    featured: false,
  },
];

// US-022: Daily Challenges for engagement system
const dailyChallenges = [
  {
    challengeName: 'Feed Your Pets',
    description: 'Feed your pet 3 times today',
    challengeType: 'feed',
    targetCount: 3,
    reward: 10,
    active: true,
  },
  {
    challengeName: 'Chat Marathon',
    description: 'Have 5 conversations with your pet',
    challengeType: 'chat',
    targetCount: 5,
    reward: 15,
    active: true,
  },
  {
    challengeName: 'Health Checkup',
    description: 'Check the health status of all your pets',
    challengeType: 'health_check',
    targetCount: 1,
    reward: 5,
    active: true,
  },
  {
    challengeName: 'Game Time',
    description: 'Play 2 games with your pet (chess or other activities)',
    challengeType: 'play_game',
    targetCount: 2,
    reward: 20,
    active: true,
  },
  {
    challengeName: 'Social Breeder',
    description: 'Breed a new pet to expand your collection',
    challengeType: 'breed',
    targetCount: 1,
    reward: 25,
    active: true,
  },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing traits (idempotent seeding)
  await prisma.trait.deleteMany({});
  console.log('🧹 Cleared existing traits');

  // US-008: Clear existing recovery items
  await prisma.recoveryItem.deleteMany({});
  console.log('🧹 Cleared existing recovery items');

  // US-015: Clear existing skills
  await prisma.skill.deleteMany({});
  console.log('🧹 Cleared existing skills');

  // US-022: Clear existing daily challenges
  await prisma.dailyChallenge.deleteMany({});
  console.log('🧹 Cleared existing daily challenges');

  // Insert predefined traits
  for (const trait of predefinedTraits) {
    await prisma.trait.create({
      data: trait,
    });
  }

  console.log(`✅ Created ${predefinedTraits.length} traits`);

  // US-008: Insert recovery items
  for (const item of recoveryItems) {
    await prisma.recoveryItem.create({
      data: item,
    });
  }

  console.log(`✅ Created ${recoveryItems.length} recovery items`);

  // US-015: Insert predefined skills
  for (const skill of predefinedSkills) {
    await prisma.skill.create({
      data: skill,
    });
  }

  console.log(`✅ Created ${predefinedSkills.length} skills`);

  // US-022: Insert daily challenges
  for (const challenge of dailyChallenges) {
    await prisma.dailyChallenge.create({
      data: challenge,
    });
  }

  console.log(`✅ Created ${dailyChallenges.length} daily challenges`);

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

  // Verify skill category distribution
  const categoryCount = await prisma.skill.groupBy({
    by: ['category'],
    _count: true,
  });

  console.log('\n📚 Skill Category Distribution:');
  categoryCount.forEach((item) => {
    const percentage = ((item._count / predefinedSkills.length) * 100).toFixed(1);
    console.log(`  ${item.category}: ${item._count} (${percentage}%)`);
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

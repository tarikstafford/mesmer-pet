/**
 * US-015: Skill Marketplace API
 * GET endpoint to fetch skills with filters and search
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.url ? new URL(request.url) : { searchParams: new URLSearchParams() };

    const userId = searchParams.get('userId');
    const skillId = searchParams.get('skillId');
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const featuredOnly = searchParams.get('featured') === 'true';

    // If skillId is provided, fetch single skill
    if (skillId) {
      const skill = await prisma.skill.findUnique({
        where: { id: skillId },
      });

      if (!skill || !skill.active) {
        return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
      }

      // Check if user owns this skill
      let owned = false;
      if (userId) {
        const userSkill = await prisma.userSkill.findUnique({
          where: {
            userId_skillId: {
              userId,
              skillId,
            },
          },
        });
        owned = !!userSkill;
      }

      return NextResponse.json({
        skills: [{ ...skill, owned }],
        total: 1,
      });
    }

    // Build where clause for filtering
    const where: any = {
      active: true, // US-027: Only show active skills in marketplace
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (minPrice !== null || maxPrice !== null) {
      where.price = {};
      if (minPrice !== null) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice !== null) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    if (search) {
      // SQLite doesn't support case-insensitive search with mode, so we use lowercase for both
      const searchLower = search.toLowerCase();
      where.OR = [
        { skillName: { contains: searchLower } },
        { description: { contains: searchLower } },
      ];
    }

    if (featuredOnly) {
      where.featured = true;
    }

    // Fetch skills
    const skills = await prisma.skill.findMany({
      where,
      orderBy: [
        { featured: 'desc' }, // Featured skills first
        { price: 'asc' },     // Then by price
        { skillName: 'asc' }, // Then alphabetically
      ],
    });

    // If userId provided, check which skills are owned
    let ownedSkillIds: string[] = [];
    if (userId) {
      const userSkills = await prisma.userSkill.findMany({
        where: {
          userId,
          active: true,
        },
        select: {
          skillId: true,
        },
      });
      ownedSkillIds = userSkills.map((us) => us.skillId);
    }

    // Add owned flag to each skill
    const skillsWithOwnership = skills.map((skill) => ({
      ...skill,
      owned: ownedSkillIds.includes(skill.id),
    }));

    return NextResponse.json({
      skills: skillsWithOwnership,
      total: skillsWithOwnership.length,
    });
  } catch (error) {
    console.error('Error fetching marketplace skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

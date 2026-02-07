import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdminAuth(request);

    // Get all skills (including inactive ones for admin view)
    const skills = await prisma.skill.findMany({
      orderBy: [
        { featured: 'desc' },
        { active: 'desc' },
        { category: 'asc' },
        { skillName: 'asc' },
      ],
      include: {
        _count: {
          select: {
            userSkills: true,
            petSkills: true,
          },
        },
      },
    });

    return NextResponse.json({ skills });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Admin access required')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes('token') || error.message.includes('authorization')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

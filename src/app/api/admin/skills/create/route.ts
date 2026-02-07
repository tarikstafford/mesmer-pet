import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSkillSchema = z.object({
  skillName: z.string().min(1).max(100),
  category: z.enum(['education', 'games', 'arts', 'sports']),
  description: z.string().min(1).max(500),
  price: z.number().min(0).max(100),
  featured: z.boolean().optional(),
  icon: z.string().optional(),
  active: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdminAuth(request);

    const body = await request.json();
    const validated = createSkillSchema.parse(body);

    // Check if skill name already exists
    const existingSkill = await prisma.skill.findUnique({
      where: { skillName: validated.skillName },
    });

    if (existingSkill) {
      return NextResponse.json(
        { error: 'A skill with this name already exists' },
        { status: 400 }
      );
    }

    // Create the skill
    const skill = await prisma.skill.create({
      data: {
        skillName: validated.skillName,
        category: validated.category,
        description: validated.description,
        price: validated.price,
        featured: validated.featured ?? false,
        icon: validated.icon ?? null,
        active: validated.active ?? true,
      },
    });

    return NextResponse.json({ skill }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Admin access required')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes('token') || error.message.includes('authorization')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSkillSchema = z.object({
  skillId: z.string().uuid(),
  skillName: z.string().min(1).max(100).optional(),
  category: z.enum(['education', 'games', 'arts', 'sports']).optional(),
  description: z.string().min(1).max(500).optional(),
  price: z.number().min(0).max(100).optional(),
  featured: z.boolean().optional(),
  icon: z.string().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdminAuth(request);

    const body = await request.json();
    const validated = updateSkillSchema.parse(body);

    const { skillId, ...updateData } = validated;

    // Check if skill exists
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // If updating skillName, check for duplicates
    if (updateData.skillName && updateData.skillName !== skill.skillName) {
      const existingSkill = await prisma.skill.findUnique({
        where: { skillName: updateData.skillName },
      });

      if (existingSkill) {
        return NextResponse.json(
          { error: 'A skill with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update the skill
    const updatedSkill = await prisma.skill.update({
      where: { id: skillId },
      data: updateData,
    });

    return NextResponse.json({ skill: updatedSkill });
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

    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

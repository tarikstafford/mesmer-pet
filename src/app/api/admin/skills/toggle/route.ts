import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const toggleSkillSchema = z.object({
  skillId: z.string().uuid(),
  active: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdminAuth(request);

    const body = await request.json();
    const validated = toggleSkillSchema.parse(body);

    // Check if skill exists
    const skill = await prisma.skill.findUnique({
      where: { id: validated.skillId },
    });

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Toggle the skill's active status
    const updatedSkill = await prisma.skill.update({
      where: { id: validated.skillId },
      data: { active: validated.active },
    });

    return NextResponse.json({
      skill: updatedSkill,
      message: `Skill ${validated.active ? 'activated' : 'deactivated'} successfully`
    });
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

    return NextResponse.json({ error: 'Failed to toggle skill status' }, { status: 500 });
  }
}

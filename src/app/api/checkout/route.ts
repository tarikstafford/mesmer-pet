/**
 * US-016: Skill Purchase Flow (IAP Integration)
 * Create Stripe checkout session for skill purchases
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skillId, userId } = body;

    if (!skillId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: skillId, userId' },
        { status: 400 }
      );
    }

    // Fetch skill details
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Check if user already owns this skill
    const existingPurchase = await prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You already own this skill' },
        { status: 400 }
      );
    }

    // Get user email for receipt
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create Stripe checkout session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const session = await createCheckoutSession({
      skillId: skill.id,
      skillName: skill.skillName,
      price: skill.price,
      userId,
      userEmail: user.email,
      successUrl: `${baseUrl}/marketplace/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/marketplace?skillId=${skillId}&canceled=true`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

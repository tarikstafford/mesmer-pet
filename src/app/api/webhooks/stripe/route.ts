/**
 * US-016: Skill Purchase Flow (IAP Integration)
 * Stripe webhook handler for payment confirmations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { constructWebhookEvent } from '@/lib/stripe';
import Stripe from 'stripe';

// Disable Next.js body parser for raw body access
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature and construct event
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(session);
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session expired:', session.id);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment by granting skill to user
 */
async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const { skillId, userId } = session.metadata as { skillId: string; userId: string };

  if (!skillId || !userId) {
    console.error('Missing metadata in session:', session.id);
    return;
  }

  try {
    // Check if skill already granted (prevent duplicate processing)
    const existing = await prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
    });

    if (existing) {
      console.log(`Skill ${skillId} already granted to user ${userId}`);
      return;
    }

    // Grant skill to user
    await prisma.userSkill.create({
      data: {
        userId,
        skillId,
        purchaseDate: new Date(),
        active: true,
      },
    });

    console.log(`Successfully granted skill ${skillId} to user ${userId} via Stripe session ${session.id}`);
  } catch (error) {
    console.error('Error granting skill after payment:', error);
    throw error;
  }
}

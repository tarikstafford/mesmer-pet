/**
 * US-016: Skill Purchase Flow (IAP Integration)
 * Stripe payment processing utilities
 */

import Stripe from 'stripe';

// Initialize Stripe with API key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

export { stripe };

/**
 * Create a checkout session for skill purchase
 */
export async function createCheckoutSession(params: {
  skillId: string;
  skillName: string;
  price: number;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: params.skillName,
            description: `Unlock ${params.skillName} for your pet`,
          },
          unit_amount: Math.round(params.price * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.userEmail,
    metadata: {
      skillId: params.skillId,
      userId: params.userId,
    },
  });

  return session;
}

/**
 * Verify webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

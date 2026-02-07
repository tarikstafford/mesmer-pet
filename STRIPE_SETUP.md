# Stripe Integration Setup

This document explains how to set up Stripe for skill purchases in the AR Pet App.

## Prerequisites

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard

## Environment Variables

Add these to your `.env` file:

```env
STRIPE_SECRET_KEY="sk_test_..." # Your Stripe secret key (test or live)
STRIPE_WEBHOOK_SECRET="whsec_..." # Your webhook signing secret
NEXT_PUBLIC_BASE_URL="http://localhost:3000" # Your app URL (use production URL in production)
```

## Getting Your API Keys

1. **Secret Key**:
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy the "Secret key" (starts with `sk_test_` for test mode)
   - Add to `.env` as `STRIPE_SECRET_KEY`

2. **Webhook Secret**:
   - Go to https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - Set endpoint URL to: `https://yourdomain.com/api/webhooks/stripe` (use ngrok for local testing)
   - Select events to listen for:
     - `checkout.session.completed`
     - `checkout.session.expired`
   - Click "Add endpoint"
   - Click to reveal the "Signing secret" (starts with `whsec_`)
   - Add to `.env` as `STRIPE_WEBHOOK_SECRET`

## Local Development with Webhooks

For local development, use Stripe CLI to forward webhooks:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret from the output and add to `.env`

## Testing Payments

Use Stripe test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

## Price Tiers

Skills are priced at:
- **Tier 1**: $0.99 (basic skills)
- **Tier 2**: $1.99 (intermediate skills)
- **Tier 3**: $4.99 (advanced/featured skills)

## Production Deployment

1. Switch to live mode in Stripe Dashboard
2. Get live API keys (start with `sk_live_`)
3. Update environment variables in production
4. Set up production webhook endpoint
5. Test thoroughly before launching

## Mobile IAP Integration (Future)

For mobile apps (iOS/Android), you'll need to integrate:
- **Apple**: StoreKit 2 / In-App Purchase
- **Google**: Google Play Billing Library

This is deferred for post-MVP as it requires:
- App Store Connect setup
- Google Play Console setup
- Platform-specific SDKs
- Receipt validation servers

For now, mobile users can purchase via web interface.

## Troubleshooting

**Webhook not firing?**
- Check Stripe CLI is running
- Verify webhook secret is correct
- Check server logs for errors

**Payment succeeds but skill not granted?**
- Check webhook handler logs
- Verify database connection
- Check `UserSkill` table for entry

**TypeScript errors?**
- Run `npm install stripe` to ensure SDK is installed
- Stripe API version is set to `2025-01-27.acacia`

## Security Notes

- Never commit API keys to git
- Use environment variables for all secrets
- Rotate keys if exposed
- Use test mode keys for development
- Validate webhook signatures to prevent fraud

# Sentry Error Logging and Monitoring Setup

This project uses Sentry for comprehensive error logging, monitoring, and performance tracking.

## Prerequisites

1. Create a free Sentry account at [https://sentry.io](https://sentry.io)
2. Create a new project in Sentry (choose "Next.js" as the platform)
3. Copy your DSN (Data Source Name) from the project settings

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Sentry Configuration (Required for error tracking)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn-key@sentry.io/your-project-id

# Optional: For source map uploads (production only)
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token
```

### Getting Your Sentry Values:

1. **DSN**: Found in Sentry Project Settings → Client Keys (DSN)
2. **Organization Slug**: Your organization name in the Sentry URL (e.g., `https://sentry.io/organizations/YOUR-ORG/`)
3. **Project Name**: Your project slug from the URL
4. **Auth Token**: Create in Sentry → Settings → Account → API → Auth Tokens → Create New Token
   - Scopes needed: `project:read`, `project:releases`, `org:read`

## Features Implemented

### 1. Error Logging

The app logs various types of errors with rich context:

- **LLM API Failures**: OpenAI API errors with prompt length, model, status codes
- **AR Session Crashes**: Device type, session duration, actions performed
- **Payment Failures**: Anonymized payment errors from Stripe
- **General Errors**: All uncaught exceptions with component/action context

### 2. Performance Monitoring

Critical paths are monitored for slow performance:

- **Pet Loading**: Dashboard pet queries (alert if > 1s)
- **Breeding Calculations**: Genetics algorithm (alert if > 2s)
- **LLM Requests**: Chat API responses (alert if > 5s)
- **Stat Degradation**: Background job execution (alert if > 10s)
- **API Endpoints**: All API routes (alert if > 3s)

### 3. User Context

User information is attached to errors for better debugging:

- Set user context on login: `setUserContext(userId, email)`
- Clear on logout: `clearUserContext()`

### 4. Breadcrumbs

User actions are tracked leading up to errors:

- AR interactions (tap, feed, voice chat)
- Payment events (checkout started, completed, failed)
- API calls and navigation

## Configuring Alerts (Error Rate > 5%)

To set up alerts when error rate exceeds 5% of requests:

1. Go to your Sentry project → **Alerts** → **Create Alert**
2. Choose **Issues** alert type
3. Configure the alert:
   - **Conditions**:
     - When error rate for the project is above 5%
     - Over a period of 5 minutes
   - **Filters**: (optional) Filter by environment (production)
   - **Actions**:
     - Send email to your team
     - Post to Slack channel (if integrated)
     - Create PagerDuty incident (if integrated)

### Recommended Alert Rules:

```
Alert Name: High Error Rate
Trigger: Error rate > 5% over 5 minutes
Environment: production
Actions: Email to [your-email@example.com]
```

Additional recommended alerts:

```
Alert Name: Payment Failures
Trigger: Any error with tag component:payments
Actions: Immediate email + Slack notification
```

```
Alert Name: AR Session Crashes
Trigger: More than 3 errors with tag component:ar_viewer in 10 minutes
Actions: Email notification
```

```
Alert Name: Slow LLM Responses
Trigger: Performance issue > 5 seconds for llm.request
Actions: Weekly email digest
```

## Usage in Code

### Logging Errors

```typescript
import { logError, logLLMFailure, logARSessionCrash, logPaymentFailure } from '@/lib/errorLogger';

// General errors
try {
  // ... your code
} catch (error) {
  logError(error as Error, {
    component: 'my_component',
    action: 'my_action',
    userId: 'user-id',
  });
}

// LLM failures
logLLMFailure(error, {
  userId: 'user-id',
  petId: 'pet-id',
  provider: 'openai',
  model: 'gpt-4o-mini',
  promptLength: 500,
  statusCode: 429,
});

// AR crashes
logARSessionCrash(error, {
  userId: 'user-id',
  petId: 'pet-id',
  sessionDuration: 30000,
  deviceType: 'mobile',
  browserAgent: navigator.userAgent,
  sessionActions: ['session_started', 'fed_pet', 'voice_chat'],
});

// Payment failures
logPaymentFailure(error, {
  userId: 'user-id',
  skillId: 'skill-id',
  amount: 4.99,
  currency: 'usd',
  provider: 'stripe',
  errorCode: 'card_declined',
  failureReason: 'Insufficient funds',
});
```

### Performance Monitoring

```typescript
import { monitorPetLoad, monitorBreedingCalculation, monitorLLMRequest } from '@/lib/performanceMonitor';

// Monitor pet loading
const pets = await monitorPetLoad(userId, async () => {
  return await prisma.pet.findMany({ where: { userId } });
});

// Monitor breeding
const offspring = await monitorBreedingCalculation(parent1Id, parent2Id, async () => {
  return await breedPets(parent1, parent2, userId, name);
});

// Monitor LLM requests
const response = await monitorLLMRequest(userId, petId, 'gpt-4o-mini', async () => {
  return await openai.chat.completions.create({ ... });
});
```

### Adding Breadcrumbs

```typescript
import { addBreadcrumb } from '@/lib/errorLogger';

addBreadcrumb('User started checkout', 'payment', { skillId: 'skill-id', amount: 4.99 });
addBreadcrumb('AR session started', 'ar', { petId: 'pet-id' });
addBreadcrumb('Pet fed in AR', 'interaction', { petId: 'pet-id' });
```

## Testing

To test Sentry integration locally:

1. Set `NEXT_PUBLIC_SENTRY_DSN` in your `.env` file
2. Run the app: `npm run dev`
3. Trigger an error (e.g., try to feed a pet that doesn't exist)
4. Check your Sentry dashboard at [https://sentry.io](https://sentry.io)

You should see the error appear within a few seconds with:
- Error message and stack trace
- User context (if authenticated)
- Breadcrumbs showing actions leading to the error
- Device/browser information
- Environment (development/production)

## Production Deployment

### Vercel Deployment:

1. Add environment variables to Vercel project settings:
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
   - `SENTRY_AUTH_TOKEN`

2. Source maps will be automatically uploaded during build
3. Enable Sentry's Vercel integration for enhanced monitoring

### Other Platforms:

Ensure all environment variables are set in your hosting platform's configuration.

## Monitoring Dashboard

Access your Sentry dashboard to:

1. **View Errors**: See all errors grouped by type
2. **Performance**: Monitor transaction speeds and bottlenecks
3. **Releases**: Track errors by deployment version
4. **User Feedback**: Collect crash reports from users
5. **Alerts**: Receive notifications when issues occur

## Privacy and Data

Sentry automatically:
- Hashes user IDs for privacy
- Excludes sensitive fields from error reports
- Anonymizes payment data (no card numbers)
- Removes passwords from logs

All error logging in this app follows GDPR guidelines and does not expose sensitive user data.

## Troubleshooting

**Errors not appearing in Sentry:**
- Verify `NEXT_PUBLIC_SENTRY_DSN` is set correctly
- Check browser console for Sentry initialization errors
- Ensure your DSN is from a valid, active Sentry project

**Source maps not uploading:**
- Verify `SENTRY_AUTH_TOKEN` has correct permissions
- Check build logs for Sentry upload errors
- Ensure `SENTRY_ORG` and `SENTRY_PROJECT` match your Sentry account

**High event volume / quota exceeded:**
- Adjust sample rates in `sentry.*.config.ts`
- Set up alert rules to filter noise
- Use Sentry's "Spike Protection" feature

## Support

For issues with Sentry integration:
- Sentry Documentation: [https://docs.sentry.io/platforms/javascript/guides/nextjs/](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- Sentry Support: [https://sentry.io/support/](https://sentry.io/support/)

## Summary

✅ Error tracking for all critical paths
✅ Performance monitoring with custom thresholds
✅ User context and breadcrumbs
✅ Payment and LLM failure logging
✅ AR session crash tracking
✅ Alert configuration guide (> 5% error rate)
✅ GDPR-compliant anonymization

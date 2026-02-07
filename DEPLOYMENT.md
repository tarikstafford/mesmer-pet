# 🚀 Deploying Mesmer to Vercel

## Prerequisites

- [Vercel Account](https://vercel.com/signup) (free tier works!)
- [Turso Account](https://turso.tech/signup) (free tier: 9GB storage, 1B row reads/month)
- OpenAI API key
- Stripe account (optional for testing)

## Step 1: Set Up Turso Database

```bash
# Install Turso CLI
brew install tursodatabase/tap/turso
# Or on Linux/WSL: curl -sSfL https://get.tur.so/install.sh | bash

# Login to Turso
turso auth login

# Create your database
turso db create mesmer-pet

# Get your database URL
turso db show mesmer-pet --url
# Save this URL - looks like: libsql://mesmer-pet-yourname.turso.io

# Create an auth token
turso db tokens create mesmer-pet
# Save this token - looks like: eyJhbGc...
```

## Step 2: Update Database Configuration

Your app is already configured for Turso! Just update the connection string:

**Update `.env`:**
```env
DATABASE_URL="libsql://mesmer-pet-yourname.turso.io?authToken=eyJhbGc..."
```

The format is: `libsql://[URL]?authToken=[TOKEN]`

## Step 3: Run Migrations on Turso

```bash
# Generate Prisma client
npx prisma generate

# Push schema to Turso
npx prisma db push

# Seed the database
npx prisma db seed
```

**Note:** Turso doesn't support `prisma migrate dev`, use `prisma db push` instead.

## Step 4: Deploy to Vercel

### Option A: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name? mesmer-pet (or your choice)
# - Directory? ./ (press Enter)
# - Override settings? No
```

### Option B: Deploy via GitHub (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository: `tarikstafford/mesmer-pet`
4. Click "Import"
5. Configure your project (see Step 5 below)
6. Click "Deploy"

## Step 5: Configure Environment Variables in Vercel

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

### Required Variables

```env
# Database (from Turso)
DATABASE_URL=libsql://mesmer-pet-yourname.turso.io?authToken=eyJhbGc...

# Encryption (generate with: openssl rand -hex 16)
ENCRYPTION_KEY=your_32_character_hex_key_here

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here

# App URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Optional Variables (for payments)

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Sentry (error tracking)
SENTRY_DSN=https://your-sentry-dsn
```

**Important:** Add these to ALL environments (Production, Preview, Development)

## Step 6: Verify Deployment

1. Wait for Vercel to build (2-5 minutes)
2. Click the deployment URL
3. Test the app:
   - ✅ Registration works
   - ✅ Login works
   - ✅ Create a pet
   - ✅ Feed the pet
   - ✅ Chat with the pet (requires OpenAI key)

## Step 7: Set Up Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `mesmer-pet.com`)
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain

## Common Issues & Solutions

### ❌ Build Fails: "Cannot find module '@prisma/client'"

**Solution:** Vercel needs to generate Prisma client during build.

Add to `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "vercel-build": "prisma generate && next build"
  }
}
```

### ❌ Database Connection Error

**Solution:** Check your DATABASE_URL format:
- Must start with `libsql://`
- Must include `?authToken=` parameter
- No spaces or line breaks

### ❌ "ENCRYPTION_KEY must be set"

**Solution:** Make sure ENCRYPTION_KEY is added in Vercel Environment Variables (32 hex characters).

### ❌ Slow Cold Starts

**Solution:** Upgrade Vercel plan for faster edge functions, or:
- Add `export const runtime = 'edge'` to API routes (where possible)
- Enable Vercel's Edge Middleware

### ❌ Background Jobs Not Running

**Solution:** Vercel serverless functions are stateless. Use Vercel Cron Jobs:

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/pets/update-stats",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/memory/summarize",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Performance Optimization

### 1. Enable Edge Runtime (where possible)

For API routes that don't use Node.js-specific features:

```typescript
// src/app/api/example/route.ts
export const runtime = 'edge';
```

### 2. Add Caching Headers

```typescript
export async function GET() {
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    }
  });
}
```

### 3. Use Vercel Edge Config

For high-frequency reads (traits, skills):
- Store in [Vercel Edge Config](https://vercel.com/docs/storage/edge-config)
- Ultra-low latency (< 10ms)

## Monitoring

### Set Up Vercel Analytics

1. Go to Project Settings → Analytics
2. Enable Web Analytics (free)
3. Monitor: page views, performance, errors

### Set Up Sentry

Already integrated! Just add `SENTRY_DSN` to environment variables.

## Scaling Considerations

### Free Tier Limits
- **Vercel:** 100GB bandwidth, 100 serverless function executions/day
- **Turso:** 9GB storage, 1B row reads/month

### When to Upgrade
- **Vercel Pro ($20/mo):** Unlimited bandwidth, team features
- **Turso Scaler ($29/mo):** 50GB storage, unlimited rows

### Database Scaling
If you outgrow Turso, migrate to:
- **Vercel Postgres** (built-in, $0.10/hr compute)
- **PlanetScale** (MySQL, generous free tier)
- **Supabase** (PostgreSQL, generous free tier)

## Testing Production Deploy Locally

```bash
# Use production environment variables
vercel env pull .env.production

# Run production build locally
npm run build
npm run start
```

## Rollback if Needed

```bash
# List deployments
vercel ls

# Promote a previous deployment to production
vercel promote [deployment-url]
```

## Next Steps After Deployment

1. ✅ Test all features in production
2. ✅ Set up Vercel Cron for background jobs
3. ✅ Enable Vercel Analytics
4. ✅ Add custom domain
5. ✅ Set up staging environment (preview deployments)
6. ✅ Configure CORS for AR app (if separate)
7. ✅ Test payment flows (Stripe test mode)
8. ✅ Monitor error rates in Sentry

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Turso Documentation](https://docs.turso.tech/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

---

**Ready to deploy!** 🚀

Follow these steps and your AR Pet App will be live in ~10 minutes!

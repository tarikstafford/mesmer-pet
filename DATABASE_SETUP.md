# Database Setup Guide

## Development (Local SQLite)

For local development, use SQLite for easier setup and faster iteration:

1. **Update your .env file:**
   ```bash
   DATABASE_URL="file:./prisma/dev.db"
   ```

2. **Push schema to database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Seed the database:**
   ```bash
   npx prisma db seed
   ```

This will create a local SQLite database with:
- 30 genetic traits (visual, personality, skill)
- 20 purchasable skills
- 3 recovery items
- 5 daily challenges

## Production (Turso)

For production deployment using Turso (distributed SQLite):

1. **Create a Turso database:**
   ```bash
   turso db create mesmer-pet
   turso db show mesmer-pet
   ```

2. **Update your production .env:**
   ```bash
   DATABASE_URL="libsql://[your-database-url]?authToken=[your-auth-token]"
   ```

3. **Note:** Schema changes must be applied manually to Turso:
   - Export schema from local: `sqlite3 prisma/dev.db .dump > schema.sql`
   - Apply to Turso using Turso CLI or dashboard
   - Alternatively, use a migration tool that supports Turso

## Switching Between Environments

### Local → Turso
1. Backup your .env: `cp .env .env.local.backup`
2. Update DATABASE_URL to use your Turso credentials
3. Ensure schema is synchronized

### Turso → Local
1. Backup your .env: `cp .env .env.turso.backup`
2. Update DATABASE_URL to `file:./prisma/dev.db`
3. Run `npx prisma db push` and `npx prisma db seed`

## Common Issues

### "no such column" errors
- Schema is out of sync
- Run `npx prisma db push` to sync schema

### "Failed to create pet" (500 error)
- Database not seeded
- Run `npx prisma db seed` to add traits

### Prisma CLI doesn't recognize libsql://
- Expected behavior - Prisma CLI doesn't support LibSQL protocol directly
- Use local SQLite for development
- Apply schema changes to Turso manually for production

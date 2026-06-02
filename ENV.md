# Environment Variables

You (the owner) already created the Google OAuth client and Supabase project.
Wire these into `.env.local` (dev) and Vercel project settings (prod).

```bash
# Supabase Postgres
DATABASE_URL="postgresql://...@db.<ref>.supabase.co:5432/postgres"   # for migrations
# (optional, for connection pooling on Vercel serverless)
DIRECT_URL="postgresql://...@db.<ref>.supabase.co:5432/postgres"

# Auth.js
AUTH_SECRET="<openssl rand -base64 32>"
AUTH_URL="https://<your-domain>"          # http://localhost:3000 in dev

# Google OAuth (already created)
AUTH_GOOGLE_ID="<client id>"
AUTH_GOOGLE_SECRET="<client secret>"
```

## Google OAuth console settings to verify
- **Authorized redirect URI** must include both:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://<your-domain>/api/auth/callback/google`
- The Stanford-only restriction is enforced in code (`AUTH.md`), not the console —
  the `hd` param alone is insufficient.

## Vercel
- Import the GitHub repo → framework auto-detected (Next.js).
- Add all env vars above to the Vercel project (Production + Preview).
- Supabase: use the **pooled** connection string (port 6543, `pgbouncer=true`) for
  `DATABASE_URL` on serverless, and the direct string for `DIRECT_URL` (Prisma migrations).

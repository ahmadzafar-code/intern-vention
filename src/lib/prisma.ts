import { PrismaClient } from "@prisma/client";

// Singleton (serverless-safe): reuse one client across hot reloads / lambda invocations
// so the PgBouncer pool isn't exhausted.
//
// Global `omit` of User.email: email is dedupe-only and must never leave the user's own
// session (anonymity contract). Omitting it by default makes a leak structurally
// impossible — a stray `include: { user: true }` can't serialize it. Read it back only
// where legitimately needed (the user's own /api/me) with `omit: { email: false }`.
const prismaClientSingleton = () => new PrismaClient({ omit: { user: { email: true } } });

// Capture the *specialized* (omit-aware) client type so the singleton var matches it.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof prismaClientSingleton>;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

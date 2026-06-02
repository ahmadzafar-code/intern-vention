import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

// NextAuth v5, JWT strategy (no Prisma adapter — the schema has no Account/Session
// tables by design). The User row is upserted by hand in the jwt callback.
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    // clientId/secret read from AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET automatically.
    // hd is only a UI hint — the real Stanford gate is the signIn callback below.
    Google({
      authorization: { params: { hd: "stanford.edu", prompt: "select_account" } },
    }),
  ],
  callbacks: {
    // HARD GATE: reject any non-@stanford.edu or unverified Google account, server-side.
    async signIn({ profile }) {
      const email = profile?.email ?? "";
      const verified = (profile as { email_verified?: boolean })?.email_verified === true;
      return email.endsWith("@stanford.edu") && verified;
    },

    async jwt({ token, profile }) {
      // First sign-in this session: upsert User (dedupe by email). username stays null
      // until onboarding (P4); profileSet=false routes the user into onboarding.
      if (profile?.email) {
        const user = await prisma.user.upsert({
          where: { email: profile.email },
          update: { realName: profile.name ?? undefined },
          create: { email: profile.email, realName: profile.name ?? null },
          select: { id: true, username: true, profileSet: true },
        });
        token.userId = user.id;
        token.username = user.username;
        token.profileSet = user.profileSet;
      }

      // Recompute on every pass: `unlocked` is a UI hint only (authz always re-counts
      // in the DB via requireUnlocked), and username/profileSet may change at onboarding.
      if (token.userId) {
        const [contributions, fresh] = await Promise.all([
          prisma.contribution.count({ where: { userId: token.userId } }),
          prisma.user.findUnique({
            where: { id: token.userId },
            select: { username: true, profileSet: true },
          }),
        ]);
        token.unlocked = contributions >= 1;
        token.username = fresh?.username ?? token.username ?? null;
        token.profileSet = fresh?.profileSet ?? token.profileSet ?? false;
      }
      return token;
    },

    async session({ session, token }) {
      // Only opaque id + public handle + gating flags cross this boundary.
      session.user.id = token.userId ?? "";
      session.user.username = token.username ?? null;
      session.user.unlocked = token.unlocked ?? false;
      session.user.profileSet = token.profileSet ?? false;
      // NEVER expose email: the JWT strategy would otherwise copy it from the token.
      delete (session.user as { email?: string }).email;
      return session;
    },
  },
});

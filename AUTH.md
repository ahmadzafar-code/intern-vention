# Auth — Stanford-only Google OAuth + anonymity contract

Auth.js (NextAuth v5) Google provider. The owner already created the Google OAuth
client + Supabase. This doc is the **contract**, not setup.

## Hard requirement: reject non-Stanford accounts
The `hd` param is only a UI hint — it does NOT prevent a determined non-Stanford
login. You MUST enforce the domain in the `signIn` callback (server side):

```ts
// auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({ authorization: { params: { hd: "stanford.edu", prompt: "select_account" } } }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email ?? "";
      return email.endsWith("@stanford.edu") && profile?.email_verified === true;
    },
    async jwt({ token, user }) {
      // on first sign-in, upsert the User row (dedupe by email)
      // attach userId + username + unlocked to the token
      return token;
    },
    async session({ session, token }) {
      session.user = { id: token.userId, username: token.username, unlocked: token.unlocked };
      // NOTE: do NOT spread email into anything client-facing beyond this session
      return session;
    },
  },
});
```

## First-time vs returning
- **New email** → create `User` with `profileSet=false`, no username yet.
  Route them through the prototype's two-step onboarding (`src/auth.jsx`):
  1. **Pick a username** (`u/<handle>`, 3–20 chars, `[a-z0-9_]`, unique).
  2. **Profile** — degree level(s) (Bachelor's / Coterm / Master's / PhD), majors
     (full Stanford list in `data.js > STANFORD_MAJORS`), optional 2nd major + minor,
     graduating class (1965–2030), GPA bucket (skipped if already graduated).
- **Returning email** → load existing username + profile, go straight in.

## The anonymity contract
- `email` lives in `User` for **dedupe only**. Never select it into any payload
  except the signed-in user's own `/api/me`.
- All public surfaces join on `userId` → `username`. Comments, posts, contributions,
  Mentorboard rows all render `u/<username>`, never a name — unless the user
  opted in (`showName`) to reveal it on the Mentorboard.
- Aggregates must satisfy n ≥ 5 (see `AGGREGATIONS.md`), so no single contribution
  is re-identifiable.

## Session shape
```ts
session.user = {
  id: string;          // opaque
  username: string;    // u/<username>
  unlocked: boolean;   // signedIn && contributionCount >= 1  (recompute server-side, don't trust client)
}
```

## Profile yearly re-confirmation
`store.jsx > profileStale()`: if the user hasn't confirmed their profile this
calendar year AND hasn't graduated, show the "Still Class of 20XX?" banner
(see `contributions.jsx`). `confirmProfile()` stamps `confirmedYear`.

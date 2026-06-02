import type { DefaultSession } from "next-auth";

// Session/JWT shape for the anonymity contract. `email` is deliberately Omit-ted from
// the session user type, so reading session.user.email is a compile error — the only
// fields exposed are the opaque id, the public handle, and the gating flags.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string | null;
      unlocked: boolean;
      profileSet: boolean;
    } & Omit<DefaultSession["user"], "email">;
  }
}

// Augment the SOURCE module: next-auth/jwt only type-re-exports JWT from @auth/core/jwt,
// so augmenting next-auth/jwt creates a separate, non-merging interface. The jwt callback's
// `token` is typed from @auth/core/jwt, so this is the declaration that actually merges.
declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    username?: string | null;
    unlocked?: boolean;
    profileSet?: boolean;
  }
}

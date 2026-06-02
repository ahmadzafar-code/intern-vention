// Session/JWT shape for the anonymity contract. `email` is intentionally absent from the
// Session user type (only id, public handle, gating flags, and display name/image) — so
// reading session.user.email is a compile error. `export {}` keeps this a module so the
// `declare module` blocks augment (rather than redeclare) the target modules.

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string | null;
      unlocked: boolean;
      profileSet: boolean;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  // next-auth/jwt only type-re-exports JWT from @auth/core/jwt, so this is the
  // declaration the jwt callback's `token` actually merges with.
  interface JWT {
    userId?: string;
    username?: string | null;
    unlocked?: boolean;
    profileSet?: boolean;
  }
}

export {};

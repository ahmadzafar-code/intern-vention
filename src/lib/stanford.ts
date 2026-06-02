// The hard Stanford gate, as a pure function so it's unit-testable independent of NextAuth.
// hd= is only a UI hint; THIS is the real server-side enforcement (auth.ts signIn callback).
export function isStanfordEmail(email: string | null | undefined, emailVerified: boolean | undefined): boolean {
  return !!email && email.endsWith("@stanford.edu") && emailVerified === true;
}

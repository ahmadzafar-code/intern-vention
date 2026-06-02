import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Thrown by guards; mapped to 401/403 at the action/route boundary.
export class UnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}
export class ForbiddenError extends Error {
  constructor() {
    super("FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user?.id ? session.user : null;
}

export async function requireSession() {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

// Give-to-get gate. NEVER trust the token's `unlocked` for authorization — re-count
// contributions in the DB on every gated call (the token hint can be stale).
export async function requireUnlocked() {
  const user = await requireSession();
  const n = await prisma.contribution.count({ where: { userId: user.id } });
  if (n < 1) throw new ForbiddenError();
  return user;
}

export async function requireAdmin() {
  const user = await requireSession();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });
  if (!dbUser?.isAdmin) throw new ForbiddenError();
  return user;
}

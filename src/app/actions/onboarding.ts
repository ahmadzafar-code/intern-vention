"use server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { buildBachelorsProfile, currentYear } from "@/lib/profile";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Step 1 of onboarding: claim a unique handle. The DB unique index is the authority
// (P2002 → 409-equivalent), so concurrent claims of the same handle can't both win.
export async function setUsername(raw: string): Promise<ActionResult> {
  const user = await requireSession();
  const clean = raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (clean.length < 3 || clean.length > 20) {
    return { ok: false, error: "3–20 characters · letters, numbers, underscores" };
  }
  try {
    await prisma.user.update({ where: { id: user.id }, data: { username: clean } });
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "That handle is taken — try another" };
    }
    throw e;
  }
}

// Step 2: Bachelor's profile (slice). Stores the degrees JSON + derived major/gradYear/gpa
// and flips profileSet=true (which closes onboarding). confirmedYear stamps the current year.
export async function setProfile(input: {
  major: string;
  major2?: string;
  minor?: string;
  gradYear: string;
  gpa: string;
}): Promise<ActionResult> {
  const user = await requireSession();
  if (!input.major || !input.gradYear) {
    return { ok: false, error: "Pick your major and graduating class" };
  }
  const { degrees, major, gradYear, gpa } = buildBachelorsProfile(input);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      degrees: degrees as unknown as Prisma.InputJsonValue,
      major,
      gradYear,
      gpa,
      profileSet: true,
      confirmedYear: currentYear(),
    },
  });
  return { ok: true };
}

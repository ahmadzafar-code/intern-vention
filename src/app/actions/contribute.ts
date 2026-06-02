"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { gradToYear } from "@/lib/profile";

export type ContributeInput = {
  slug: string;
  role: string;
  cycle: string;
  platform: string;
  hadReferral: boolean;
  referralSource: string;
  techRounds: number;
  behavioralRounds: number;
  applied: string;
  offerMonth: string;
  comp: string;
  advice: string;
};

export async function contribute(input: ContributeInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireSession();

  // Profile snapshot is taken server-side from the DB (not trusted from the client).
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { profileSet: true, major: true, gradYear: true, gpa: true },
  });
  if (!me?.profileSet) return { ok: false, error: "Finish your profile first" };

  const company = await prisma.company.findUnique({ where: { slug: input.slug }, select: { slug: true } });
  if (!company) return { ok: false, error: "Unknown company" };

  const role = input.role.trim();
  if (!role) return { ok: false, error: "Pick or enter a role" };

  await prisma.contribution.create({
    data: {
      userId: user.id,
      companySlug: input.slug,
      role,
      cycle: input.cycle,
      platform: input.platform,
      hadReferral: input.hadReferral,
      referralSource: input.hadReferral ? input.referralSource || null : null,
      comp: input.comp,
      techRounds: Math.max(0, Math.min(9, Math.trunc(input.techRounds))),
      behavioralRounds: Math.max(0, Math.min(6, Math.trunc(input.behavioralRounds))),
      applied: input.applied,
      offerMonth: input.offerMonth,
      advice: input.advice.trim() || null,
      // denormalized profile snapshot at submit time
      major: me.major,
      classYear: gradToYear(me.gradYear ?? ""),
      gpa: me.gpa,
    },
  });

  // unlock takes effect immediately: requireUnlocked re-counts in the DB. Revalidate the
  // surfaces whose gated content / counts just changed.
  revalidatePath(`/company/${input.slug}`);
  revalidatePath("/");
  revalidatePath("/contribute");
  return { ok: true };
}

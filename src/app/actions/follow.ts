"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function toggleFollow(slug: string): Promise<{ ok: boolean; following: boolean }> {
  const u = await requireSession();
  const where = { userId_companySlug: { userId: u.id, companySlug: slug } };
  const existing = await prisma.follow.findUnique({ where, select: { id: true } });
  if (existing) {
    await prisma.follow.delete({ where });
    revalidatePath(`/company/${slug}`);
    return { ok: true, following: false };
  }
  await prisma.follow.create({ data: { userId: u.id, companySlug: slug } });
  revalidatePath(`/company/${slug}`);
  return { ok: true, following: true };
}

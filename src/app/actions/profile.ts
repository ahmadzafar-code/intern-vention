"use server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { currentYear } from "@/lib/profile";

export async function confirmProfile(): Promise<{ ok: boolean }> {
  const u = await requireSession();
  await prisma.user.update({ where: { id: u.id }, data: { confirmedYear: currentYear() } });
  revalidatePath("/me");
  return { ok: true };
}

export async function setShowName(showName: boolean): Promise<{ ok: boolean }> {
  const u = await requireSession();
  await prisma.user.update({ where: { id: u.id }, data: { showName } });
  revalidatePath("/me");
  return { ok: true };
}

export async function toggleFlair(value: string): Promise<{ ok: boolean }> {
  const u = await requireSession();
  const user = await prisma.user.findUnique({ where: { id: u.id }, select: { flairs: true } });
  const cur = Array.isArray(user?.flairs) ? (user!.flairs as string[]) : [];
  const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
  await prisma.user.update({ where: { id: u.id }, data: { flairs: next as unknown as Prisma.InputJsonValue } });
  revalidatePath("/me");
  return { ok: true };
}

export async function editContribution(id: string, patch: { role?: string; advice?: string }): Promise<{ ok: boolean; error?: string }> {
  const u = await requireSession();
  const c = await prisma.contribution.findUnique({ where: { id }, select: { userId: true, companySlug: true } });
  if (!c || c.userId !== u.id) return { ok: false, error: "Not yours to edit" };
  const data: Prisma.ContributionUpdateInput = {};
  if (patch.role !== undefined && patch.role.trim()) data.role = patch.role.trim();
  if (patch.advice !== undefined) data.advice = patch.advice.trim() || null;
  await prisma.contribution.update({ where: { id }, data });
  revalidatePath("/me");
  revalidatePath(`/company/${c.companySlug}`);
  return { ok: true };
}

export async function removeContribution(id: string): Promise<{ ok: boolean; error?: string }> {
  const u = await requireSession();
  const c = await prisma.contribution.findUnique({ where: { id }, select: { userId: true, companySlug: true } });
  if (!c || c.userId !== u.id) return { ok: false, error: "Not yours to delete" };
  await prisma.contribution.delete({ where: { id } });
  revalidatePath("/me");
  revalidatePath(`/company/${c.companySlug}`);
  revalidatePath("/");
  return { ok: true };
}

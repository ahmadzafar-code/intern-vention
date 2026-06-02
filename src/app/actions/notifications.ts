"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireSession } from "@/lib/session";

export async function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  const user = await requireSession();
  // recipient-scoped: you can only mark your own notifications read
  await prisma.notification.updateMany({ where: { id, recipientId: user.id }, data: { read: true } });
  revalidatePath("/alerts");
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const user = await requireSession();
  await prisma.notification.updateMany({ where: { recipientId: user.id, read: false }, data: { read: true } });
  revalidatePath("/alerts");
  return { ok: true };
}

// For the nav unread badge (client polls on navigation).
export async function getUnreadCount(): Promise<number> {
  const user = await getSessionUser();
  if (!user) return 0;
  return prisma.notification.count({ where: { recipientId: user.id, read: false } });
}

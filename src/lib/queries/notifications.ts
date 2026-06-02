import "server-only";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/labels";

export type AlertGroup = "Today" | "This week" | "Earlier";

export type Alert = {
  id: string;
  type: string;
  actor: string | null;
  title: string;
  body: string | null;
  scope: string | null;
  postId: string | null;
  slug: string | null;
  read: boolean;
  time: string;
  group: AlertGroup;
};

function groupOf(d: Date): AlertGroup {
  const days = (Date.now() - d.getTime()) / 86_400_000;
  if (days < 1) return "Today";
  if (days < 7) return "This week";
  return "Earlier";
}

export async function listNotifications(userId: string): Promise<Alert[]> {
  const rows = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    actor: n.actor,
    title: n.title,
    body: n.body,
    scope: n.scope,
    postId: n.postId,
    slug: n.slug,
    read: n.read,
    time: timeAgo(n.createdAt),
    group: groupOf(n.createdAt),
  }));
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { recipientId: userId, read: false } });
}

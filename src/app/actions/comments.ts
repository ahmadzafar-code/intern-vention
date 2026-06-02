"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUnlocked } from "@/lib/session";
import type { ActionResult } from "./posts";

const threadPath = (scope: string, postId: string) => `/thread/${encodeURIComponent(scope)}/${postId}`;

// Top-level comment (parentId omitted) or a nested reply (parentId set).
export async function addComment(
  scope: string,
  postId: string,
  body: string,
  parentId?: string
): Promise<ActionResult<{ commentId: string }>> {
  const user = await requireUnlocked();
  const text = body.trim();
  if (text.length < 2) return { ok: false, error: "Say a bit more" };
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
  if (!post) return { ok: false, error: "Post not found" };
  let targetUserId = post.userId; // top-level comment → notify the post author
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { postId: true, userId: true } });
    if (!parent || parent.postId !== postId) return { ok: false, error: "Bad reply target" };
    targetUserId = parent.userId; // reply → notify the parent comment author
  }
  const comment = await prisma.comment.create({ data: { postId, parentId: parentId ?? null, userId: user.id, body: text } });
  await prisma.vote.create({ data: { userId: user.id, targetType: "COMMENT", targetId: comment.id, dir: 1 } });
  // reply→notification loop (skip self-replies)
  if (targetUserId && targetUserId !== user.id) {
    await prisma.notification.create({
      data: {
        recipientId: targetUserId,
        type: "reply",
        actor: user.username,
        title: parentId ? "replied to your comment" : "commented on your post",
        body: text.slice(0, 120),
        scope,
        postId,
      },
    });
  }
  revalidatePath(threadPath(scope, postId));
  return { ok: true, commentId: comment.id };
}

async function castVote(userId: string, targetId: string, dir: number) {
  const where = { userId_targetType_targetId: { userId, targetType: "COMMENT" as const, targetId } };
  const existing = await prisma.vote.findUnique({ where });
  if (existing && existing.dir === dir) await prisma.vote.delete({ where });
  else await prisma.vote.upsert({ where, create: { userId, targetType: "COMMENT", targetId, dir }, update: { dir } });
}

export async function voteComment(scope: string, postId: string, commentId: string, dir: 1 | -1): Promise<ActionResult> {
  const user = await requireUnlocked();
  await castVote(user.id, commentId, dir);
  revalidatePath(threadPath(scope, postId));
  return { ok: true };
}

export async function editComment(scope: string, postId: string, commentId: string, body: string): Promise<ActionResult> {
  const user = await requireUnlocked();
  const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { userId: true } });
  if (!c) return { ok: false, error: "Not found" };
  if (c.userId !== user.id) return { ok: false, error: "Not yours to edit" };
  const text = body.trim();
  if (text.length < 2) return { ok: false, error: "Say a bit more" };
  await prisma.comment.update({ where: { id: commentId }, data: { body: text, edited: true } });
  revalidatePath(threadPath(scope, postId));
  return { ok: true };
}

export async function deleteComment(scope: string, postId: string, commentId: string): Promise<ActionResult> {
  const user = await requireUnlocked();
  const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { userId: true } });
  if (!c) return { ok: false, error: "Not found" };
  if (c.userId !== user.id) return { ok: false, error: "Not yours to delete" };
  // gather the reply subtree (BFS) so deleting a comment removes its descendants too
  const all: string[] = [commentId];
  let frontier = [commentId];
  while (frontier.length) {
    const kids = await prisma.comment.findMany({ where: { parentId: { in: frontier } }, select: { id: true } });
    const ids = kids.map((k) => k.id);
    if (!ids.length) break;
    all.push(...ids);
    frontier = ids;
  }
  await prisma.$transaction([
    prisma.vote.deleteMany({ where: { targetType: "COMMENT", targetId: { in: all } } }),
    prisma.comment.deleteMany({ where: { id: { in: all } } }),
  ]);
  revalidatePath(threadPath(scope, postId));
  return { ok: true };
}

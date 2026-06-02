"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUnlocked } from "@/lib/session";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const scopePath = (scope: string) => `/community/${encodeURIComponent(scope)}`;
const threadPath = (scope: string, postId: string) => `/thread/${encodeURIComponent(scope)}/${postId}`;
const companySlugFor = (scope: string) => (scope !== "__main__" && !scope.startsWith("ind:") ? scope : null);

export async function addPost(scope: string, input: { flair: string; title: string; body: string }): Promise<ActionResult<{ postId: string }>> {
  const user = await requireUnlocked();
  const title = input.title.trim();
  if (title.length < 4) return { ok: false, error: "Give it a real title (4+ chars)" };
  const post = await prisma.post.create({
    data: { scope, companySlug: companySlugFor(scope), userId: user.id, flair: input.flair, title, body: input.body.trim() || null },
  });
  // author self-upvote so the score starts at 1 (matches the prototype)
  await prisma.vote.create({ data: { userId: user.id, targetType: "POST", targetId: post.id, dir: 1 } });
  revalidatePath(scopePath(scope));
  return { ok: true, postId: post.id };
}

// Toggle: re-casting the same direction removes the vote; otherwise upsert (one row per
// user/target via the DB unique constraint).
async function castVote(userId: string, targetType: "POST" | "COMMENT", targetId: string, dir: number) {
  const where = { userId_targetType_targetId: { userId, targetType, targetId } };
  const existing = await prisma.vote.findUnique({ where });
  if (existing && existing.dir === dir) await prisma.vote.delete({ where });
  else await prisma.vote.upsert({ where, create: { userId, targetType, targetId, dir }, update: { dir } });
}

export async function votePost(scope: string, postId: string, dir: 1 | -1): Promise<ActionResult> {
  const user = await requireUnlocked();
  await castVote(user.id, "POST", postId, dir);
  revalidatePath(scopePath(scope));
  revalidatePath(threadPath(scope, postId));
  return { ok: true };
}

export async function editPost(scope: string, postId: string, body: string): Promise<ActionResult> {
  const user = await requireUnlocked();
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
  if (!post) return { ok: false, error: "Not found" };
  if (post.userId !== user.id) return { ok: false, error: "Not yours to edit" };
  await prisma.post.update({ where: { id: postId }, data: { body: body.trim() || null, edited: true } });
  revalidatePath(threadPath(scope, postId));
  return { ok: true };
}

export async function deletePost(scope: string, postId: string): Promise<ActionResult> {
  const user = await requireUnlocked();
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
  if (!post) return { ok: false, error: "Not found" };
  if (post.userId !== user.id) return { ok: false, error: "Not yours to delete" };
  const comments = await prisma.comment.findMany({ where: { postId }, select: { id: true } });
  const commentIds = comments.map((c) => c.id);
  await prisma.$transaction([
    prisma.vote.deleteMany({ where: { OR: [{ targetType: "POST", targetId: postId }, { targetType: "COMMENT", targetId: { in: commentIds } }] } }),
    prisma.pollVote.deleteMany({ where: { postId } }),
    prisma.comment.deleteMany({ where: { postId } }),
    prisma.post.delete({ where: { id: postId } }),
  ]);
  revalidatePath(scopePath(scope));
  return { ok: true };
}

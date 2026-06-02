import "server-only";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/labels";

// Post/comment scores are computed from Vote rows (never stored). The VoteWidget shows
// `base + dir`, where base excludes the viewer's own vote and dir is their vote — so we
// return base = totalScore - myVote.
export type FeedPost = {
  id: string;
  author: string | null;
  flair: string;
  title: string;
  body: string | null;
  edited: boolean;
  mine: boolean;
  base: number;
  myVote: number;
  comments: number;
  time: string;
};

export type ThreadComment = {
  id: string;
  author: string | null;
  mine: boolean;
  body: string;
  edited: boolean;
  base: number;
  myVote: number;
  time: string;
  replies: ThreadComment[];
};

async function tallyVotes(targetType: "POST" | "COMMENT", ids: string[], userId: string | null) {
  if (!ids.length) return { score: new Map<string, number>(), mine: new Map<string, number>() };
  const [agg, mine] = await Promise.all([
    prisma.vote.groupBy({ by: ["targetId"], where: { targetType, targetId: { in: ids } }, _sum: { dir: true } }),
    userId
      ? prisma.vote.findMany({ where: { userId, targetType, targetId: { in: ids } }, select: { targetId: true, dir: true } })
      : Promise.resolve([] as { targetId: string; dir: number }[]),
  ]);
  return {
    score: new Map(agg.map((a) => [a.targetId, a._sum.dir ?? 0])),
    mine: new Map(mine.map((m) => [m.targetId, m.dir])),
  };
}

export async function getPosts(scope: string, userId: string | null): Promise<FeedPost[]> {
  const posts = await prisma.post.findMany({
    where: { scope },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, userId: true, flair: true, title: true, body: true, edited: true, createdAt: true,
      user: { select: { username: true } },
      _count: { select: { comments: true } },
    },
  });
  const { score, mine } = await tallyVotes("POST", posts.map((p) => p.id), userId);
  return posts.map((p) => {
    const myVote = mine.get(p.id) ?? 0;
    return {
      id: p.id,
      author: p.user.username,
      flair: p.flair,
      title: p.title,
      body: p.body,
      edited: p.edited,
      mine: !!userId && p.userId === userId,
      base: (score.get(p.id) ?? 0) - myVote,
      myVote,
      comments: p._count.comments,
      time: timeAgo(p.createdAt),
    };
  });
}

export async function getPost(
  postId: string,
  userId: string | null
): Promise<{ post: FeedPost & { scope: string }; comments: ThreadComment[] } | null> {
  const p = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true, scope: true, userId: true, flair: true, title: true, body: true, edited: true, createdAt: true,
      user: { select: { username: true } },
    },
  });
  if (!p) return null;

  const rows = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    select: { id: true, parentId: true, userId: true, body: true, edited: true, createdAt: true, user: { select: { username: true } } },
  });
  const [cv, pv] = await Promise.all([
    tallyVotes("COMMENT", rows.map((c) => c.id), userId),
    tallyVotes("POST", [postId], userId),
  ]);

  const nodes = new Map<string, ThreadComment>();
  for (const c of rows) {
    const myVote = cv.mine.get(c.id) ?? 0;
    nodes.set(c.id, {
      id: c.id,
      author: c.user.username,
      mine: !!userId && c.userId === userId,
      body: c.body,
      edited: c.edited,
      base: (cv.score.get(c.id) ?? 0) - myVote,
      myVote,
      time: timeAgo(c.createdAt),
      replies: [],
    });
  }
  const roots: ThreadComment[] = [];
  for (const c of rows) {
    const node = nodes.get(c.id)!;
    if (c.parentId && nodes.has(c.parentId)) nodes.get(c.parentId)!.replies.push(node);
    else roots.push(node);
  }

  const myPostVote = pv.mine.get(postId) ?? 0;
  return {
    post: {
      id: p.id,
      scope: p.scope,
      author: p.user.username,
      flair: p.flair,
      title: p.title,
      body: p.body,
      edited: p.edited,
      mine: !!userId && p.userId === userId,
      base: (pv.score.get(postId) ?? 0) - myPostVote,
      myVote: myPostVote,
      comments: rows.length,
      time: timeAgo(p.createdAt),
    },
    comments: roots,
  };
}

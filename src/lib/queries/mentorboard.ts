import "server-only";
import { prisma } from "@/lib/prisma";
import { computeKarma, deriveBadges, type KarmaFacts } from "@/lib/karma";
import { MIN } from "@/lib/aggregate";

export type CultureRow = { slug: string; name: string; industry: string; domain: string | null; bg: string | null; reports: number };
export type CohortRow = { label: string; count: number };
export type MentorRow = { username: string; karma: number; badge: string | null };

// Σ over a user's posts of max(0, score − 1) — net upvotes from others (excludes self-upvote).
function upvoteKarma(scoresForPosts: number[]): number {
  return scoresForPosts.reduce((s, score) => s + Math.max(0, score - 1), 0);
}

// Tab 1 — Mentorship cultures: companies ranked by contribution count (>0).
export async function cultures(industry: string): Promise<CultureRow[]> {
  const where = industry && industry !== "all" ? { status: "APPROVED" as const, industry } : { status: "APPROVED" as const };
  const [companies, counts] = await Promise.all([
    prisma.company.findMany({ where, select: { slug: true, name: true, industry: true, domain: true, bg: true } }),
    prisma.contribution.groupBy({ by: ["companySlug"], _count: { _all: true } }),
  ]);
  const m = new Map(counts.map((c) => [c.companySlug, c._count._all]));
  return companies
    .map((c) => ({ ...c, reports: m.get(c.slug) ?? 0 }))
    .filter((c) => c.reports > 0)
    .sort((a, b) => b.reports - a.reports);
}

// Tab 2 — Who gives back: contribution counts by major / class year, n≥5 floor (privacy).
export async function cohortsByMajor(): Promise<CohortRow[]> {
  const agg = await prisma.contribution.groupBy({ by: ["major"], _count: { _all: true } });
  return agg
    .filter((a) => a.major && a._count._all >= MIN)
    .map((a) => ({ label: a.major as string, count: a._count._all }))
    .sort((a, b) => b.count - a.count);
}

export async function cohortsByGradYear(): Promise<CohortRow[]> {
  const agg = await prisma.contribution.groupBy({ by: ["classYear"], _count: { _all: true } });
  return agg
    .filter((a) => a.classYear && a._count._all >= MIN)
    .map((a) => ({ label: a.classYear as string, count: a._count._all }))
    .sort((a, b) => b.count - a.count);
}

// Tab 3 — Top mentors: all named users ranked by computed karma.
export async function topMentors(limit = 12): Promise<MentorRow[]> {
  const [users, contribAgg, postAgg, commentAgg, posts, adviceUsers] = await Promise.all([
    prisma.user.findMany({ where: { username: { not: null } }, select: { id: true, username: true } }),
    prisma.contribution.groupBy({ by: ["userId"], _count: { _all: true } }),
    prisma.post.groupBy({ by: ["userId"], _count: { _all: true } }),
    prisma.comment.groupBy({ by: ["userId"], _count: { _all: true } }),
    prisma.post.findMany({ select: { id: true, userId: true } }),
    prisma.contribution.findMany({ where: { advice: { not: null } }, select: { userId: true }, distinct: ["userId"] }),
  ]);

  const postAuthor = new Map(posts.map((p) => [p.id, p.userId]));
  const voteAgg = posts.length
    ? await prisma.vote.groupBy({ by: ["targetId"], where: { targetType: "POST", targetId: { in: posts.map((p) => p.id) } }, _sum: { dir: true } })
    : [];
  const postScoresByUser = new Map<string, number[]>();
  for (const v of voteAgg) {
    const author = postAuthor.get(v.targetId);
    if (!author) continue;
    const arr = postScoresByUser.get(author) ?? [];
    arr.push(v._sum.dir ?? 0);
    postScoresByUser.set(author, arr);
  }

  const cMap = new Map(contribAgg.map((c) => [c.userId, c._count._all]));
  const pMap = new Map(postAgg.map((p) => [p.userId, p._count._all]));
  const cmMap = new Map(commentAgg.map((c) => [c.userId, c._count._all]));
  const adviceSet = new Set(adviceUsers.map((a) => a.userId));

  const rows = users.map((u) => {
    const facts: KarmaFacts = {
      contributions: cMap.get(u.id) ?? 0,
      posts: pMap.get(u.id) ?? 0,
      postUpvotes: upvoteKarma(postScoresByUser.get(u.id) ?? []),
      comments: cmMap.get(u.id) ?? 0,
      hasAdvice: adviceSet.has(u.id),
    };
    const karma = computeKarma(facts);
    return { username: u.username as string, karma, badge: deriveBadges({ ...facts, karma })[0] ?? null };
  });
  return rows.filter((r) => r.karma > 0).sort((a, b) => b.karma - a.karma).slice(0, limit);
}

// Single-user karma (own KarmaCard / profile).
export async function userKarma(userId: string): Promise<{ karma: number; badges: string[] }> {
  const [contributions, posts, comments, adviceCount, postRows] = await Promise.all([
    prisma.contribution.count({ where: { userId } }),
    prisma.post.count({ where: { userId } }),
    prisma.comment.count({ where: { userId } }),
    prisma.contribution.count({ where: { userId, advice: { not: null } } }),
    prisma.post.findMany({ where: { userId }, select: { id: true } }),
  ]);
  let postUpvotes = 0;
  if (postRows.length) {
    const agg = await prisma.vote.groupBy({ by: ["targetId"], where: { targetType: "POST", targetId: { in: postRows.map((p) => p.id) } }, _sum: { dir: true } });
    postUpvotes = upvoteKarma(agg.map((a) => a._sum.dir ?? 0));
  }
  const facts: KarmaFacts = { contributions, posts, postUpvotes, comments, hasAdvice: adviceCount > 0 };
  const karma = computeKarma(facts);
  return { karma, badges: deriveBadges({ ...facts, karma }) };
}

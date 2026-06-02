import "server-only";
import { prisma } from "@/lib/prisma";
import { INDUSTRIES } from "@/lib/constants";

export type SearchResults = {
  companies: { slug: string; name: string; industry: string; domain: string | null; bg: string | null; reports: number }[];
  forums: { key: string; label: string }[];
  posts: { id: string; scope: string; title: string; scopeKind: string; scopeLabel: string }[];
};

const scopeKindOf = (scope: string) => (scope === "__main__" ? "campus" : scope.startsWith("ind:") ? "industry" : "company");

export async function searchAll(q: string, unlocked: boolean): Promise<SearchResults> {
  const query = q.trim();
  if (!query) return { companies: [], forums: [], posts: [] };

  const companies = await prisma.company.findMany({
    where: { status: "APPROVED", OR: [{ name: { contains: query, mode: "insensitive" } }, { industry: { contains: query, mode: "insensitive" } }] },
    take: 6,
    select: { slug: true, name: true, industry: true, domain: true, bg: true },
  });
  const reports = new Map<string, number>();
  if (companies.length) {
    const agg = await prisma.contribution.groupBy({ by: ["companySlug"], where: { companySlug: { in: companies.map((c) => c.slug) } }, _count: { _all: true } });
    for (const a of agg) reports.set(a.companySlug, a._count._all);
  }

  const forums = INDUSTRIES.filter((i) => i.key !== "all" && i.label.toLowerCase().includes(query.toLowerCase())).map((i) => ({ key: i.key, label: i.label }));

  // Posts are gated content — only surfaced to unlocked users (no leak to locked clients).
  let posts: SearchResults["posts"] = [];
  if (unlocked) {
    const rows = await prisma.post.findMany({
      where: { OR: [{ title: { contains: query, mode: "insensitive" } }, { body: { contains: query, mode: "insensitive" } }] },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, scope: true, title: true, company: { select: { name: true } } },
    });
    posts = rows.map((x) => {
      const kind = scopeKindOf(x.scope);
      const label =
        kind === "campus" ? "All of Stanford" : kind === "industry" ? INDUSTRIES.find((i) => i.key === x.scope.slice(4))?.label ?? x.scope.slice(4) : x.company?.name ?? x.scope;
      return { id: x.id, scope: x.scope, title: x.title, scopeKind: kind, scopeLabel: label };
    });
  }

  return { companies: companies.map((c) => ({ ...c, reports: reports.get(c.slug) ?? 0 })), forums, posts };
}

import "server-only";
import { prisma } from "@/lib/prisma";
import { rolesForIndustry } from "@/lib/constants";

export type CompanyCard = {
  slug: string;
  name: string;
  industry: string;
  domain: string | null;
  bg: string | null;
  reports: number;
};

// Approved companies + their real contribution counts (directory + contribute picker).
export async function listApprovedWithCounts(): Promise<CompanyCard[]> {
  const [companies, counts] = await Promise.all([
    prisma.company.findMany({
      where: { status: "APPROVED" },
      orderBy: { name: "asc" },
      select: { slug: true, name: true, industry: true, domain: true, bg: true },
    }),
    prisma.contribution.groupBy({ by: ["companySlug"], _count: { _all: true } }),
  ]);
  const countMap = new Map(counts.map((c) => [c.companySlug, c._count._all]));
  return companies.map((c) => ({ ...c, reports: countMap.get(c.slug) ?? 0 }));
}

export async function getCompany(slug: string) {
  return prisma.company.findUnique({
    where: { slug },
    select: { slug: true, name: true, industry: true, domain: true, bg: true, status: true },
  });
}

export type PendingRequest = { id: string; name: string; slug: string; industry: string; website: string | null; note: string | null };

// Admin review queue — pending company requests, oldest first.
export async function listPendingRequests(): Promise<PendingRequest[]> {
  return prisma.companyRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true, industry: true, website: true, note: true },
  });
}

// Role options for the contribute form: industry defaults ∪ roles already submitted here.
export async function getCompanyRoles(slug: string, industry: string): Promise<string[]> {
  const rows = await prisma.contribution.findMany({
    where: { companySlug: slug },
    distinct: ["role"],
    select: { role: true },
  });
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of [...rolesForIndustry(industry), ...rows.map((x) => x.role)]) {
    if (!seen.has(r)) {
      seen.add(r);
      out.push(r);
    }
  }
  return out;
}

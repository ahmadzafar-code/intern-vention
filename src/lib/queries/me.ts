import "server-only";
import { prisma } from "@/lib/prisma";
import { userKarma } from "./mentorboard";
import { tierFor } from "@/lib/karma";
import { profileStale } from "@/lib/profile";

export type MyContribution = { id: string; slug: string; companyName: string; domain: string | null; bg: string | null; status: string; role: string; cycle: string; advice: string | null };
export type MyRequest = { id: string; name: string; slug: string; industry: string; status: string; website: string | null };
export type FlairOption = { value: string; label: string; slug?: string; domain?: string | null; bg?: string | null };

export type MyProfile = {
  username: string | null;
  realName: string | null;
  major: string | null;
  gradYear: string | null;
  gpa: string | null;
  showName: boolean;
  flairs: string[];
  stale: boolean;
  karma: number;
  tier: string;
  badges: string[];
  counts: { contributions: number; posts: number; comments: number };
  contributions: MyContribution[];
  requests: MyRequest[];
  flairOptions: { companies: FlairOption[]; majors: FlairOption[]; years: FlairOption[] };
};

export async function getMyProfile(userId: string): Promise<MyProfile> {
  const [user, contributions, postCount, commentCount, requests, karmaInfo] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { username: true, realName: true, major: true, gradYear: true, gpa: true, showName: true, flairs: true, confirmedYear: true } }),
    prisma.contribution.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, companySlug: true, role: true, cycle: true, advice: true, company: { select: { name: true, domain: true, bg: true, status: true } } } }),
    prisma.post.count({ where: { userId } }),
    prisma.comment.count({ where: { userId } }),
    prisma.companyRequest.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, slug: true, industry: true, status: true, website: true } }),
    userKarma(userId),
  ]);

  const flairs = Array.isArray(user?.flairs) ? (user!.flairs as string[]) : [];
  const seen = new Set<string>();
  const companies: FlairOption[] = [];
  for (const c of contributions) {
    if (seen.has(c.companySlug)) continue;
    seen.add(c.companySlug);
    companies.push({ value: "co:" + c.companySlug, label: "ex-" + c.company.name, slug: c.companySlug, domain: c.company.domain, bg: c.company.bg });
  }

  return {
    username: user?.username ?? null,
    realName: user?.realName ?? null,
    major: user?.major ?? null,
    gradYear: user?.gradYear ?? null,
    gpa: user?.gpa ?? null,
    showName: user?.showName ?? false,
    flairs,
    stale: profileStale(user?.confirmedYear, user?.gradYear),
    karma: karmaInfo.karma,
    tier: tierFor(karmaInfo.karma).tier.name,
    badges: karmaInfo.badges,
    counts: { contributions: contributions.length, posts: postCount, comments: commentCount },
    contributions: contributions.map((c) => ({ id: c.id, slug: c.companySlug, companyName: c.company.name, domain: c.company.domain, bg: c.company.bg, status: c.company.status, role: c.role, cycle: c.cycle, advice: c.advice })),
    requests: requests.map((r) => ({ id: r.id, name: r.name, slug: r.slug, industry: r.industry, status: r.status, website: r.website })),
    flairOptions: {
      companies,
      majors: user?.major ? [{ value: "major:" + user.major, label: user.major }] : [],
      years: user?.gradYear && user.gradYear !== "Already graduated" ? [{ value: "year:" + user.gradYear, label: "Class of " + user.gradYear }] : [],
    },
  };
}

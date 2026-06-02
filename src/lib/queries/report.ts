import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { COMP_BUCKETS } from "@/lib/constants";
import { MIN, type Slice, pctGroups, mode, medianByOrder, monthCounts, avg, compShort } from "@/lib/aggregate";

export { MIN };
export type { Slice };

export type ReportFilters = { role?: string; major?: string; year?: string; gpa?: string };

export type CohortReport =
  | { withheld: true; n: number }
  | {
      withheld: false;
      n: number;
      // headline (ungated by login, but still requires n≥5)
      majors: Slice[];
      topChannel: Slice;
      medianGpa: string;
      medianComp: string;
      timing: { applied: number[]; offer: number[] };
      // full report — only populated for unlocked users (never sent to locked clients)
      full: {
        channels: Slice[];
        rounds: { technical: number; behavioral: number };
        advice: { role: string; cycle: string; body: string }[];
      } | null;
    };

export async function cohortReport(slug: string, filters: ReportFilters, unlocked: boolean): Promise<CohortReport> {
  const where: Prisma.ContributionWhereInput = { companySlug: slug };
  if (filters.role && filters.role !== "All roles") where.role = filters.role;
  if (filters.major && filters.major !== "All") where.major = filters.major;
  if (filters.year && filters.year !== "All") where.classYear = filters.year;
  if (filters.gpa && filters.gpa !== "All") where.gpa = filters.gpa;

  const rows = await prisma.contribution.findMany({
    where,
    select: {
      major: true, gpa: true, comp: true, platform: true, hadReferral: true,
      techRounds: true, behavioralRounds: true, applied: true, offerMonth: true,
      advice: true, role: true, cycle: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const n = rows.length;
  // n≥5 over the *filtered* cohort — gates the whole report AND the headline.
  if (n < MIN) return { withheld: true, n };

  const channels = pctGroups(rows.map((r) => (r.hadReferral ? "Referral" : r.platform ?? "Other")), n);
  const gpaVals = rows.map((r) => r.gpa).filter((g): g is string => !!g && g !== "Prefer not to say");
  const compVals = rows.map((r) => r.comp).filter((c): c is string => !!c && c !== "Prefer not to say");

  return {
    withheld: false,
    n,
    majors: pctGroups(rows.map((r) => r.major ?? "Unknown"), n),
    topChannel: channels[0] ?? { label: "—", pct: 0 },
    medianGpa: mode(gpaVals) ?? "—",
    medianComp: compShort(medianByOrder(compVals, COMP_BUCKETS)),
    timing: { applied: monthCounts(rows.map((r) => r.applied)), offer: monthCounts(rows.map((r) => r.offerMonth)) },
    full: unlocked
      ? {
          channels,
          rounds: {
            technical: Math.round(avg(rows.map((r) => r.techRounds))),
            behavioral: Math.round(avg(rows.map((r) => r.behavioralRounds))),
          },
          advice: rows.filter((r) => r.advice).map((r) => ({ role: r.role, cycle: r.cycle, body: r.advice as string })),
        }
      : null,
  };
}

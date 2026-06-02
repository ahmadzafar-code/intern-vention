import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { COMP_BUCKETS, MONTHS } from "@/lib/constants";

// The privacy floor. EVERY aggregate (the filtered cohort overall, AND each named
// breakdown group) must be computed over ≥ MIN contributions or it is withheld.
export const MIN = 5;

export type ReportFilters = { role?: string; major?: string; year?: string; gpa?: string };
export type Slice = { label: string; pct: number };

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

// Group values into %-slices; only groups with ≥ MIN are named, the rest fold into "Other"
// so no single small group (and thus no single contributor) is exposed.
function pctGroups(values: string[], total: number): Slice[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const named: Slice[] = [];
  let other = 0;
  for (const [label, count] of counts) {
    if (count >= MIN) named.push({ label, pct: Math.round((count / total) * 100) });
    else other += count;
  }
  named.sort((a, b) => b.pct - a.pct);
  if (other > 0) named.push({ label: "Other", pct: Math.round((other / total) * 100) });
  return named;
}

function mode(values: string[]): string | null {
  const counts = new Map<string, number>();
  let best: string | null = null;
  let bestN = 0;
  for (const v of values) {
    const c = (counts.get(v) ?? 0) + 1;
    counts.set(v, c);
    if (c > bestN) {
      bestN = c;
      best = v;
    }
  }
  return best;
}

function medianByOrder(values: string[], order: string[]): string | null {
  const sorted = values
    .map((v) => ({ v, i: order.indexOf(v) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i);
  if (!sorted.length) return null;
  return sorted[Math.floor(sorted.length / 2)].v;
}

function monthCounts(values: (string | null)[]): number[] {
  const out = new Array(12).fill(0) as number[];
  for (const v of values) {
    if (!v) continue;
    const tok = v.split(" ")[0] === "Sept" ? "Sep" : v.split(" ")[0];
    const idx = MONTHS.indexOf(tok);
    if (idx >= 0) out[idx]++;
  }
  return out;
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

// "$8–10k/mo · ~$96–120k/yr" → "$8–10k/mo" for the compact headline stat.
function compShort(bucket: string | null): string {
  if (!bucket) return "—";
  return bucket.split("·")[0].trim();
}

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

  const majors = pctGroups(rows.map((r) => r.major ?? "Unknown"), n);
  const channels = pctGroups(rows.map((r) => (r.hadReferral ? "Referral" : r.platform ?? "Other")), n);
  const gpaVals = rows.map((r) => r.gpa).filter((g): g is string => !!g && g !== "Prefer not to say");
  const compVals = rows.map((r) => r.comp).filter((c): c is string => !!c && c !== "Prefer not to say");

  return {
    withheld: false,
    n,
    majors,
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
          advice: rows
            .filter((r) => r.advice)
            .map((r) => ({ role: r.role, cycle: r.cycle, body: r.advice as string })),
        }
      : null,
  };
}

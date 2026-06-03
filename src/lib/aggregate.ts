import { MONTHS } from "@/lib/constants";

// Pure aggregation helpers for the cohort report — no DB, no server-only — so the
// privacy-critical n≥5 grouping logic is unit-testable in isolation.

// Minimum cohort/group size to surface an aggregate. Set to 1 so a report appears from the very
// first contribution. NOTE: this intentionally lifts the original n≥5 anonymity floor — with small
// cohorts an aggregate can reflect (and so reveal) a single contributor.
export const MIN = 1;

export type Slice = { label: string; pct: number };

// Groups with ≥ MIN are named; anything smaller folds into "Other". With MIN=1 every non-empty
// group is named and nothing folds — the per-group fold is effectively off.
export function pctGroups(values: string[], total: number): Slice[] {
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

export function mode(values: string[]): string | null {
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

export function medianByOrder(values: string[], order: string[]): string | null {
  const sorted = values
    .map((v) => ({ v, i: order.indexOf(v) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i);
  if (!sorted.length) return null;
  return sorted[Math.floor(sorted.length / 2)].v;
}

export function monthCounts(values: (string | null)[]): number[] {
  const out = new Array(12).fill(0) as number[];
  for (const v of values) {
    if (!v) continue;
    const first = v.split(" ")[0];
    const tok = first === "Sept" ? "Sep" : first;
    const idx = MONTHS.indexOf(tok);
    if (idx >= 0) out[idx]++;
  }
  return out;
}

export function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

// "$8–10k/mo · ~$96–120k/yr" → "$8–10k/mo" for the compact headline stat.
export function compShort(bucket: string | null): string {
  if (!bucket) return "—";
  return bucket.split("·")[0].trim();
}

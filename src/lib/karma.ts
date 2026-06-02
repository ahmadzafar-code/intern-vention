// Karma / Mentor Points — computed, never stored (AGGREGATIONS.md). Pure + unit-tested.
// points = 120·contributions + 15·posts + Σ(net post upvotes) + 8·(comments+replies)
// (awards deferred). Net post upvotes already excludes the author's own self-upvote.
export type KarmaFacts = {
  contributions: number;
  posts: number;
  postUpvotes: number; // Σ over the user's posts of max(0, score − 1)
  comments: number;
  hasAdvice: boolean;
};

export function computeKarma(f: KarmaFacts): number {
  return 120 * f.contributions + 15 * f.posts + Math.max(0, f.postUpvotes) + 8 * f.comments;
}

export const TIERS = [
  { name: "Lurker", min: 0 },
  { name: "Contributor", min: 120 },
  { name: "Regular", min: 350 },
  { name: "Mentor", min: 800 },
  { name: "Legend", min: 2000 },
] as const;

export function tierFor(k: number): { tier: (typeof TIERS)[number]; next: (typeof TIERS)[number] | null } {
  let tier: (typeof TIERS)[number] = TIERS[0];
  let next: (typeof TIERS)[number] | null = null;
  for (let i = 0; i < TIERS.length; i++) {
    if (k >= TIERS[i].min) {
      tier = TIERS[i];
      next = TIERS[i + 1] ?? null;
    }
  }
  return { tier, next };
}

// Company "mentorship culture" tier from contribution count (AGGREGATIONS.md).
export function mentorshipTier(count: number): { label: string; tone: string; rank: number } {
  if (count >= 30) return { label: "Exceptional", tone: "gold", rank: 4 };
  if (count >= 20) return { label: "Strong", tone: "green", rank: 3 };
  if (count >= 10) return { label: "Growing", tone: "blue", rank: 2 };
  if (count >= 1) return { label: "Emerging", tone: "slate", rank: 1 };
  return { label: "New", tone: "slate", rank: 0 };
}

export const BADGES: Record<string, { label: string; tone: string; icon: string | null; desc: string }> = {
  verified: { label: "Verified", tone: "green", icon: "check-circle", desc: "SUNet-verified Stanford student" },
  mentor: { label: "Mentor", tone: "purple", icon: "star", desc: "Consistently helpful — 200+ karma" },
  storyteller: { label: "Storyteller", tone: "blue", icon: null, desc: "Wrote first-person recruiting advice" },
  starter: { label: "Starter", tone: "purple", icon: null, desc: "Started a discussion in the thread" },
  top: { label: "Top 1%", tone: "cardinal", icon: "fire", desc: "Top 1% of contributors by karma" },
};

// Derived from facts, never stored. Ordered most-prestigious-first (badges[0] = top badge).
export function deriveBadges(f: KarmaFacts & { karma: number }): string[] {
  const b: string[] = [];
  if (f.karma >= 200) b.push("mentor");
  if (f.contributions >= 1) b.push("verified");
  if (f.hasAdvice) b.push("storyteller");
  if (f.posts >= 1) b.push("starter");
  return b;
}

export function fmtK(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return (k >= 10 ? Math.round(k).toString() : k.toFixed(1).replace(/\.0$/, "")) + "k";
  }
  return String(n);
}

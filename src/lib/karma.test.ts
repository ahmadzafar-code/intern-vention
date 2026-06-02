import { describe, it, expect } from "vitest";
import { computeKarma, tierFor, mentorshipTier, deriveBadges, fmtK } from "@/lib/karma";

describe("computeKarma", () => {
  it("scores a single contribution at 120 (Contributor tier)", () => {
    const k = computeKarma({ contributions: 1, posts: 0, postUpvotes: 0, comments: 0, hasAdvice: false });
    expect(k).toBe(120);
    expect(tierFor(k).tier.name).toBe("Contributor");
  });
  it("sums all components", () => {
    // 2*120 + 3*15 + 10 upvotes + 4*8 = 240 + 45 + 10 + 32 = 327
    expect(computeKarma({ contributions: 2, posts: 3, postUpvotes: 10, comments: 4, hasAdvice: true })).toBe(327);
  });
  it("never subtracts for negative net upvotes", () => {
    expect(computeKarma({ contributions: 0, posts: 0, postUpvotes: -5, comments: 0, hasAdvice: false })).toBe(0);
  });
});

describe("tierFor", () => {
  it("Lurker at 0, Mentor at 800, Legend at 2000", () => {
    expect(tierFor(0).tier.name).toBe("Lurker");
    expect(tierFor(800).tier.name).toBe("Mentor");
    expect(tierFor(5000).tier.name).toBe("Legend");
    expect(tierFor(5000).next).toBeNull();
  });
});

describe("mentorshipTier", () => {
  it("maps contribution counts to culture tiers", () => {
    expect(mentorshipTier(0).label).toBe("New");
    expect(mentorshipTier(1).label).toBe("Emerging");
    expect(mentorshipTier(10).label).toBe("Growing");
    expect(mentorshipTier(20).label).toBe("Strong");
    expect(mentorshipTier(30).label).toBe("Exceptional");
  });
});

describe("deriveBadges + fmtK", () => {
  it("derives mentor/verified/storyteller/starter from facts", () => {
    const badges = deriveBadges({ contributions: 2, posts: 1, postUpvotes: 0, comments: 0, hasAdvice: true, karma: 250 });
    expect(badges).toEqual(["mentor", "verified", "storyteller", "starter"]);
  });
  it("a lurker with nothing earns no badges", () => {
    expect(deriveBadges({ contributions: 0, posts: 0, postUpvotes: 0, comments: 0, hasAdvice: false, karma: 0 })).toEqual([]);
  });
  it("fmtK formats thousands", () => {
    expect(fmtK(120)).toBe("120");
    expect(fmtK(1200)).toBe("1.2k");
    expect(fmtK(12000)).toBe("12k");
  });
});

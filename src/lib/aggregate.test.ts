import { describe, it, expect } from "vitest";
import { pctGroups, mode, medianByOrder, monthCounts, compShort, MIN } from "@/lib/aggregate";

describe("pctGroups — names every non-empty group (MIN=1, fold disabled)", () => {
  it("names all groups by descending pct, with no Other fold", () => {
    const vals = [...Array(6).fill("CS"), ...Array(5).fill("SymSys"), ...Array(3).fill("Econ"), "Physics"]; // 15
    const out = pctGroups(vals, vals.length);
    expect(out.map((s) => s.label)).toEqual(["CS", "SymSys", "Econ", "Physics"]);
    expect(out.map((s) => s.label)).not.toContain("Other");
    expect(out.find((s) => s.label === "CS")?.pct).toBe(Math.round((6 / 15) * 100));
    expect(out.find((s) => s.label === "Physics")?.pct).toBe(Math.round((1 / 15) * 100));
  });

  it("keeps even single-member groups (nothing folds)", () => {
    const vals = ["a", "a", "b", "b", "c"];
    expect(
      pctGroups(vals, 5)
        .map((s) => s.label)
        .sort()
    ).toEqual(["a", "b", "c"]);
  });

  it("MIN floor is 1", () => expect(MIN).toBe(1));
});

describe("mode / medianByOrder / compShort / monthCounts", () => {
  it("mode returns the most frequent value", () => expect(mode(["a", "b", "a"])).toBe("a"));
  it("mode is null on empty input", () => expect(mode([])).toBeNull());
  it("medianByOrder picks the middle by the given order", () => expect(medianByOrder(["hi", "lo", "mid"], ["lo", "mid", "hi"])).toBe("mid"));
  it("medianByOrder ignores values not in the order", () => expect(medianByOrder(["x", "y"], ["lo", "hi"])).toBeNull());
  it("compShort takes the monthly part", () => expect(compShort("$8–10k/mo · ~$96–120k/yr")).toBe("$8–10k/mo"));
  it("compShort handles null", () => expect(compShort(null)).toBe("—"));
  it("monthCounts maps Aug→0 and normalizes Sept→Sep, ignoring junk/null", () => {
    const out = monthCounts(["Aug 2025", "Sept 2025", "Sept 2025", null, "Bogus 2025"]);
    expect(out[0]).toBe(1);
    expect(out[1]).toBe(2);
    expect(out.reduce((a, b) => a + b, 0)).toBe(3);
  });
});

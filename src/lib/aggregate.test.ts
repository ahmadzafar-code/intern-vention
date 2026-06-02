import { describe, it, expect } from "vitest";
import { pctGroups, mode, medianByOrder, monthCounts, compShort, MIN } from "@/lib/aggregate";

describe("pctGroups — per-group n≥5 privacy guard", () => {
  it("names groups with ≥5 and folds smaller ones into Other", () => {
    const vals = [...Array(6).fill("CS"), ...Array(5).fill("SymSys"), ...Array(3).fill("Econ"), "Physics"]; // 15
    const out = pctGroups(vals, vals.length);
    const labels = out.map((s) => s.label);
    expect(labels).toContain("CS");
    expect(labels).toContain("SymSys");
    expect(labels).not.toContain("Econ"); // 3 < 5 → folded
    expect(labels).not.toContain("Physics"); // 1 < 5 → folded
    expect(out.find((s) => s.label === "Other")?.pct).toBe(Math.round((4 / 15) * 100));
  });

  it("emits no Other when every group is ≥5", () => {
    const vals = [...Array(5).fill("A"), ...Array(5).fill("B")];
    expect(
      pctGroups(vals, 10)
        .map((s) => s.label)
        .sort()
    ).toEqual(["A", "B"]);
  });

  it("withholds every group when all are below the floor (only Other remains)", () => {
    const vals = ["a", "a", "b", "b", "c"]; // no group ≥5
    const out = pctGroups(vals, 5);
    expect(out.map((s) => s.label)).toEqual(["Other"]);
  });

  it("MIN floor is 5", () => expect(MIN).toBe(5));
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

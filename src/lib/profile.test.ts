import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { hasGraduated, gradToYear, currentYear } from "@/lib/profile";

describe("profile helpers (system time pinned to 2026)", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
  });
  afterAll(() => vi.useRealTimers());

  it("currentYear reads the system year", () => expect(currentYear()).toBe(2026));

  it("hasGraduated: a grad year before the current year means graduated", () => {
    expect(hasGraduated("2025")).toBe(true);
    expect(hasGraduated("2026")).toBe(false);
    expect(hasGraduated("2027")).toBe(false);
  });

  it("gradToYear maps relative to the current year", () => {
    expect(gradToYear("2025")).toBe("Alum");
    expect(gradToYear("2026")).toBe("Senior");
    expect(gradToYear("2027")).toBe("Junior");
    expect(gradToYear("2028")).toBe("Sophomore");
    expect(gradToYear("2029")).toBe("Freshman");
  });
});

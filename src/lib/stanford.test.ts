import { describe, it, expect } from "vitest";
import { isStanfordEmail } from "@/lib/stanford";

describe("isStanfordEmail — the hard Stanford gate", () => {
  it("accepts a verified @stanford.edu address", () => expect(isStanfordEmail("jane@stanford.edu", true)).toBe(true));
  it("rejects non-Stanford domains", () => expect(isStanfordEmail("jane@gmail.com", true)).toBe(false));
  it("rejects unverified Stanford addresses", () => expect(isStanfordEmail("jane@stanford.edu", false)).toBe(false));
  it("rejects when email_verified is undefined", () => expect(isStanfordEmail("jane@stanford.edu", undefined)).toBe(false));
  it("rejects null / empty email", () => {
    expect(isStanfordEmail(null, true)).toBe(false);
    expect(isStanfordEmail("", true)).toBe(false);
  });
  it("rejects look-alike domains that merely contain stanford.edu", () => {
    expect(isStanfordEmail("jane@stanford.edu.evil.com", true)).toBe(false);
    expect(isStanfordEmail("jane@notstanford.edu", true)).toBe(false);
  });
});

// Pure profile helpers (client-safe). Mirrors the prototype's gradudatedYr / gradToYear /
// degrees-JSON logic, but uses the *current* year dynamically (the prototype hardcoded 2026).

export function currentYear(): number {
  return new Date().getFullYear();
}

/** A grad year strictly before the current year means the student has already graduated. */
export function hasGraduated(gradYear: string): boolean {
  const n = parseInt(gradYear, 10);
  return Number.isFinite(n) && n < currentYear();
}

/** Map a graduating class year to the prototype's class-year label (used on contributions). */
export function gradToYear(gradYear: string): string {
  const y = parseInt(gradYear, 10);
  if (!Number.isFinite(y)) return "";
  const cur = currentYear();
  if (y < cur) return "Alum";
  const yearsOut = y - cur; // 0 = graduating this year
  if (yearsOut <= 0) return "Senior";
  if (yearsOut === 1) return "Junior";
  if (yearsOut === 2) return "Sophomore";
  if (yearsOut === 3) return "Freshman";
  return "Coterm";
}

// Shape stored in User.degrees (JSON). Slice ships the Bachelor's block; other degree
// levels (coterm/masters/phd) are added in a widen phase.
export type BachelorsDegree = {
  major: string;
  major2: string;
  minor: string;
  gpa: string;
  gradYear: string;
};

export type DegreesJson = {
  degrees: string[];
  bachelors: BachelorsDegree | null;
  coterm: null;
  masters: null;
  phd: null;
};

export function buildBachelorsProfile(input: {
  major: string;
  major2?: string;
  minor?: string;
  gradYear: string;
  gpa: string;
}): { degrees: DegreesJson; major: string; gradYear: string; gpa: string } {
  const bachelors: BachelorsDegree = {
    major: input.major,
    major2: input.major2 && input.major2 !== "None" ? input.major2 : "",
    minor: input.minor && input.minor !== "None" ? input.minor : "",
    gpa: hasGraduated(input.gradYear) ? "" : input.gpa,
    gradYear: input.gradYear,
  };
  return {
    degrees: { degrees: ["Bachelor's (B.S./B.A.)"], bachelors, coterm: null, masters: null, phd: null },
    major: bachelors.major,
    gradYear: bachelors.gradYear,
    gpa: bachelors.gpa,
  };
}

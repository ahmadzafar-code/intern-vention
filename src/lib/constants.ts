// Pure constants ported verbatim from prototype_src/src/data.js. Client-safe (no DB,
// no server-only imports) so forms/modals can import them directly.

export const DEGREE_LEVELS = [
  "Bachelor's (B.S./B.A.)",
  "Coterm (B.S. + M.S.)",
  "Master's (M.S./M.A.)",
  "PhD",
] as const;

export const DEGREE_FILTERS = ["Bachelor's", "Coterm", "Master's", "PhD"] as const;

export const STANFORD_MAJORS = [
  "Computer Science", "Symbolic Systems", "Mathematical & Computational Science", "Mathematics", "Statistics",
  "Data Science", "Management Science & Engineering", "Economics", "Electrical Engineering", "Mechanical Engineering",
  "Bioengineering", "Chemical Engineering", "Civil & Environmental Engineering", "Materials Science & Engineering",
  "Aeronautics & Astronautics", "Engineering Physics", "Product Design", "Physics", "Chemistry", "Biology",
  "Human Biology", "Biomedical Computation", "Earth Systems", "Geological Sciences", "Geophysics", "Environmental Systems Engineering",
  "Psychology", "Political Science", "International Relations", "Public Policy", "Sociology", "Anthropology",
  "Economics & Mathematics", "History", "Philosophy", "English", "Comparative Literature", "Linguistics",
  "Communication", "Science, Technology & Society", "Urban Studies", "American Studies", "Art History",
  "Art Practice", "Film & Media Studies", "Music", "Theater & Performance Studies", "Classics", "Religious Studies",
  "Archaeology", "Feminist, Gender & Sexuality Studies", "African & African American Studies", "Asian American Studies",
  "Chicana/o–Latina/o Studies", "Comparative Studies in Race & Ethnicity", "East Asian Studies", "French", "German Studies",
  "Iberian & Latin American Cultures", "Italian", "Slavic Languages & Literatures", "Other",
];

export const STANFORD_MINORS = ["None", ...STANFORD_MAJORS.filter((m) => m !== "Other"), "Other"];

export const GRAD_CLASS_YEARS = (() => {
  const a: string[] = [];
  for (let y = 2030; y >= 1965; y--) a.push(String(y));
  return a;
})();

export const GPA_BUCKETS = ["3.9 – 4.0", "3.7 – 3.9", "3.4 – 3.7", "3.0 – 3.4", "Below 3.0", "Prefer not to say"];

// Default role options per industry (prototype roleSets) — seed the contribute form's
// Role select so the first contributor at a company still has sensible options.
export const ROLE_SETS: Record<string, string[]> = {
  tech: ["SWE Intern", "ML Research Intern", "New Grad SWE", "Member of Technical Staff", "Product Manager"],
  finance: ["IB Summer Analyst", "S&T Intern", "Quant Strat Intern", "New Grad Analyst"],
  consulting: ["Summer Associate", "Business Analyst", "Data Science Intern"],
  quant: ["Quant Trading Intern", "Quant Research Intern", "SWE Intern"],
  startups: ["SWE Intern", "Founding Eng (New Grad)", "Product Intern"],
  design: ["Product Design Intern", "Brand Design Intern"],
};

export function rolesForIndustry(industry: string): string[] {
  return ROLE_SETS[industry] ?? ROLE_SETS.tech;
}

// Contribution-form compensation buckets (ordered low→high; used by the form and by the
// report's median-comp calc) and the apply/offer timeline month axis (Aug→Jul).
export const COMP_BUCKETS = [
  "< $5k/mo · < $60k/yr", "$5–7k/mo · ~$60–84k/yr", "$7–8k/mo · ~$84–96k/yr", "$8–10k/mo · ~$96–120k/yr",
  "$10–12k/mo · ~$120–144k/yr", "$12–14k/mo · ~$144–168k/yr", "$14–16k/mo · ~$168–192k/yr",
  "$16k+/mo · $192k+/yr", "Prefer not to say",
];

export const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

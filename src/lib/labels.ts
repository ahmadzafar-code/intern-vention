// Parse a typed flair value ("co:<slug>" | "major:<Major>" | "year:<Year>") to a label.
export function flairLabel(value: string): { label: string; type: string } {
  if (value.startsWith("co:")) return { label: "ex-" + value.slice(3), type: "co" };
  if (value.startsWith("major:")) return { label: value.slice(6), type: "major" };
  if (value.startsWith("year:")) return { label: "Class of " + value.slice(5), type: "year" };
  return { label: value, type: "" };
}

// Relative time for posts/comments. Computed server-side and passed as a string prop so
// there's no client/server hydration mismatch.
export function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h";
  const days = Math.floor(h / 24);
  if (days < 7) return days + "d";
  const w = Math.floor(days / 7);
  if (w < 5) return w + "w";
  const mo = Math.floor(days / 30);
  if (mo < 12) return mo + "mo";
  return Math.floor(days / 365) + "y";
}

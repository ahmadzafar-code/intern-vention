import { Logo, type LogoCompany } from "@/components/primitives/Logo";

// P1 placeholder home — proves fonts, design tokens, and the logo fallback chain
// (logo.dev → Google favicon → colored monogram). The real DirectoryView lands in P6
// once the data layer exists. "jane-street" has no domain → exercises the monogram fallback.
const SAMPLE: (LogoCompany & { slug: string })[] = [
  { slug: "google", name: "Google", domain: "google.com", bg: "#1A1A18" },
  { slug: "openai", name: "OpenAI", domain: "openai.com", bg: "#0E0E0C", logo: "openai" },
  { slug: "jane-street", name: "Jane Street", bg: "#0F3D2E" },
  { slug: "ramp", name: "Ramp", domain: "ramp.com", bg: "#1A1A18" },
  { slug: "stripe", name: "Stripe", domain: "stripe.com", bg: "#635BFF" },
  { slug: "anthropic", name: "Anthropic", domain: "anthropic.com", bg: "#1A1A18" },
];

export default function Home() {
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "var(--page-pad)" }}>
      <h1 style={{ fontFamily: "var(--head-font)", fontSize: 40, letterSpacing: "-0.02em", marginBottom: 8 }}>
        The Stanford recruiting record, <span style={{ color: "var(--accent)" }}>pooled</span>.
      </h1>
      <p style={{ color: "var(--text-2)", fontSize: 16, maxWidth: 640, marginBottom: 28 }}>
        Anonymous, SUNet-verified recruiting intelligence — give one story to unlock everyone&apos;s.{" "}
        <span style={{ color: "var(--text-3)" }}>(P1 shell — the real directory lands with the data layer.)</span>
      </p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {SAMPLE.map((c) => (
          <div key={c.slug} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 92 }}>
            <Logo company={c} size={56} />
            <span style={{ fontSize: 12, color: "var(--text-2)" }}>{c.name}</span>
          </div>
        ))}
      </div>
    </main>
  );
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 20 seed companies from prototype_src/src/data.js (slug/name/industry/domain/bg),
// all APPROVED. Fake reports/logo/trend are stripped — real counts derive from
// Contribution rows. Idempotent (upsert by slug) so it's safe to re-run.
const COMPANIES = [
  { slug: "google", name: "Google", industry: "tech", domain: "google.com", bg: "#1A1A18" },
  { slug: "meta", name: "Meta", industry: "tech", domain: "meta.com", bg: "#1C2B4A" },
  { slug: "openai", name: "OpenAI", industry: "tech", domain: "openai.com", bg: "#0E0E0C" },
  { slug: "apple", name: "Apple", industry: "tech", domain: "apple.com", bg: "#1A1A18" },
  { slug: "goldman-sachs", name: "Goldman Sachs", industry: "finance", domain: "goldmansachs.com", bg: "#26415E" },
  { slug: "mckinsey", name: "McKinsey", industry: "consulting", domain: "mckinsey.com", bg: "#16324F" },
  { slug: "stripe", name: "Stripe", industry: "tech", domain: "stripe.com", bg: "#4B3FA8" },
  { slug: "microsoft", name: "Microsoft", industry: "tech", domain: "microsoft.com", bg: "#1A1A18" },
  { slug: "jp-morgan", name: "JP Morgan", industry: "finance", domain: "jpmorganchase.com", bg: "#3A2E1F" },
  { slug: "bain", name: "Bain & Co.", industry: "consulting", domain: "bain.com", bg: "#7A1F2B" },
  { slug: "nvidia", name: "Nvidia", industry: "tech", domain: "nvidia.com", bg: "#1F4D1F" },
  { slug: "bcg", name: "BCG", industry: "consulting", domain: "bcg.com", bg: "#16453A" },
  { slug: "morgan-stanley", name: "Morgan Stanley", industry: "finance", domain: "morganstanley.com", bg: "#26415E" },
  { slug: "jane-street", name: "Jane Street", industry: "quant", domain: "janestreet.com", bg: "#1A1A18" },
  { slug: "anthropic", name: "Anthropic", industry: "tech", domain: "anthropic.com", bg: "#C2502F" },
  { slug: "citadel", name: "Citadel", industry: "quant", domain: "citadel.com", bg: "#1C3A5E" },
  { slug: "databricks", name: "Databricks", industry: "tech", domain: "databricks.com", bg: "#B5341F" },
  { slug: "two-sigma", name: "Two Sigma", industry: "quant", domain: "twosigma.com", bg: "#1A1A18" },
  { slug: "cursor", name: "Cursor", industry: "startups", domain: "cursor.com", bg: "#1A1A18" },
  { slug: "ramp", name: "Ramp", industry: "startups", domain: "ramp.com", bg: "#1F4D3A" },
] as const;

async function main() {
  for (const c of COMPANIES) {
    await prisma.company.upsert({
      where: { slug: c.slug },
      update: { name: c.name, industry: c.industry, domain: c.domain, bg: c.bg, status: "APPROVED" },
      create: { slug: c.slug, name: c.name, industry: c.industry, domain: c.domain, bg: c.bg, status: "APPROVED" },
    });
  }
  console.log(`Seeded ${COMPANIES.length} companies.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Logo, type LogoCompany } from "@/components/primitives/Logo";
import { Icon } from "@/components/primitives/Icon";
import { INDUSTRIES } from "@/lib/constants";
import { AddCompanyModal } from "./AddCompanyModal";

type DirCompany = LogoCompany & { slug: string; industry: string; reports: number };

// Directory / home. Slice scope: hero + free-text search + industry filter + clickable
// company grid + cycle-pass banner. Advanced filters (track/major/degree/grad/comp),
// the "top mentorship cultures" section, add-company modal, and the community sidebar
// come in widen phases.
export function DirectoryView({ companies }: { companies: DirCompany[] }) {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("all");
  const [adding, setAdding] = useState(false);
  const q = query.trim().toLowerCase();
  const filtered = companies.filter((c) => {
    if (industry !== "all" && c.industry !== industry) return false;
    if (q && !`${c.name} ${c.industry}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const hasSearch = !!q || industry !== "all";

  return (
    <main className="page" style={{ maxWidth: 960, margin: "0 auto" }}>
      <section className="hero">
        <div className="hero-eyebrow">Intern<span className="dot">·</span>vention</div>
        <h1>
          Where &amp; how Stanford <span className="accent">recruited</span> this cycle.
        </h1>
        <p className="hero-sub">
          Anonymized recruiting accounts from Stanford undergrads, grads, and coterms. Research where you&apos;re headed
          next — see what actually worked.
        </p>
        <div className="hero-search-wrap">
          <span className="hero-search-icon">
            <Icon name="search" size={18} />
          </span>
          <input
            className="hero-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contributions by company, role, or industry"
          />
          {query && (
            <button className="hero-search-clear" onClick={() => setQuery("")}>
              <Icon name="x" size={15} />
            </button>
          )}
        </div>
        <div className="filter-row">
          <FilterDropdown
            label="Industry"
            value={industry}
            onChange={setIndustry}
            options={INDUSTRIES.map((i) => [i.key, i.key === "all" ? "Any industry" : i.label])}
          />
          {hasSearch && (
            <button className="filter-clear" onClick={() => { setQuery(""); setIndustry("all"); }}>
              Clear all
            </button>
          )}
        </div>
      </section>

      <CyclePassBanner />

      <div className="section-head browse-head">
        <h2>Browse companies</h2>
        <span className="meta">find where you&apos;re targeting next</span>
      </div>
      <div className="controls-row">
        <div className="controls-meta">
          {hasSearch ? `${filtered.length} ${filtered.length === 1 ? "company" : "companies"} match` : `${companies.length} companies`}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-note big">
          No companies match those filters.{" "}
          <button className="inline-link" onClick={() => setAdding(true)}>Request a company →</button>
        </p>
      ) : (
        <section className="company-grid">
          {filtered.map((c) => (
            <Link key={c.slug} className="tile" href={`/company/${c.slug}`}>
              <Logo company={c} size={46} radius={10} />
              <div className="tile-info">
                <div className="tile-name">{c.name}</div>
                <div className="tile-meta">
                  <span className="ind">{c.industry}</span>
                  <span className="sep">·</span>
                  {c.reports === 0 ? (
                    <span className="num-new">No reports yet</span>
                  ) : (
                    <>
                      <span className="num">{c.reports}</span> reports
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
          <button className="tile add-tile" onClick={() => setAdding(true)}>
            <span className="add-tile-plus"><Icon name="plus" size={20} /></span>
            <div className="tile-info">
              <div className="tile-name">Request a company</div>
              <div className="tile-meta">missing one? we&apos;ll verify &amp; add it</div>
            </div>
          </button>
        </section>
      )}

      <footer className="footer-meta">
        <span className="brand-mini">Intern·vention</span> · built for Stanford · anonymized recruiting data
      </footer>
      {adding && <AddCompanyModal onClose={() => setAdding(false)} />}
    </main>
  );
}

function CyclePassBanner() {
  const { status, data } = useSession();
  const router = useRouter();
  if (status === "authenticated" && data?.user?.unlocked) {
    return (
      <div className="pass-banner unlocked">
        <div className="pass-icon ok">
          <Icon name="check-circle" size={20} />
        </div>
        <div className="pass-text">
          <strong>You&apos;re in.</strong> Your contribution is on record — every cohort report and Community forum is
          unlocked for the cycle.
        </div>
        <button className="pass-cta ghost" onClick={() => router.push("/contribute")}>
          Contribute another →
        </button>
      </div>
    );
  }
  if (status === "authenticated") {
    return (
      <div className="pass-banner verified">
        <div className="pass-icon">
          <Icon name="lock" size={18} />
        </div>
        <div className="pass-text">
          <strong>One step from full access.</strong> Add <strong>one</strong> recruiting story — a past internship or
          offer — to unlock everything for the cycle.
        </div>
        <button className="pass-cta" onClick={() => router.push("/contribute")}>
          Contribute →
        </button>
      </div>
    );
  }
  return (
    <div className="pass-banner">
      <div className="pass-icon">
        <Icon name="lock" size={18} />
      </div>
      <div className="pass-text">
        <strong>Unlock the cycle.</strong> Share <strong>one</strong> recruiting story — a past internship or offer —
        and you unlock every cohort report and the full community. Anonymous, SUNet-verified.
      </div>
      <button className="pass-cta" onClick={() => router.push("/contribute")}>
        Contribute to unlock →
      </button>
    </div>
  );
}

function FilterDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const cur = options.find(([k]) => k === value) || options[0];
  const active = value && value !== "all";
  return (
    <div className="filter-dd" ref={ref}>
      <button className={"filter-chip" + (active ? " active" : "")} onClick={() => setOpen(!open)}>
        <span className="fc-label">{label}:</span> {cur[1]}
        <Icon name="chevron-down" size={11} stroke={2.5} />
      </button>
      {open && (
        <div className="filter-menu">
          {options.map(([k, l]) => (
            <button key={k} className={"filter-opt" + (k === value ? " sel" : "")} onClick={() => { onChange(k); setOpen(false); }}>
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

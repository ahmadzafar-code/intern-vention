"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo, type LogoCompany } from "@/components/primitives/Logo";
import { Icon } from "@/components/primitives/Icon";

type PickerCompany = LogoCompany & { slug: string; industry: string; reports: number };

export function ContributePicker({ companies }: { companies: PickerCompany[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const list = companies.filter((c) => !q || `${c.name} ${c.industry}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <main className="contribute">
      <button className="back-link" onClick={() => router.push("/")}>
        <Icon name="arrow-left" size={13} /> Back
      </button>
      <header className="picker-header">
        <div className="picker-step">Step 1 of 2 · Choose a company</div>
        <h1>Which company is this about?</h1>
        <p className="lede">
          Pick where you recruited. Your story unlocks that company&apos;s cohort report and Community forum — and helps
          the next class.
        </p>
      </header>
      <div className="picker-search-wrap">
        <span className="hero-search-icon">
          <Icon name="search" size={16} />
        </span>
        <input
          className="picker-search"
          value={q}
          autoFocus
          placeholder="Search companies by name or industry…"
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {list.length === 0 ? (
        <div className="picker-empty">
          <p>No company matches &quot;{q}&quot;.</p>
        </div>
      ) : (
        <section className="picker-grid">
          {list.map((c) => (
            <button key={c.slug} className="picker-tile" onClick={() => router.push(`/contribute/${c.slug}`)}>
              <Logo company={c} size={40} radius={9} />
              <div className="pt-info">
                <div className="pt-name">{c.name}</div>
                <div className="pt-meta">
                  {c.industry} · {c.reports} report{c.reports === 1 ? "" : "s"}
                </div>
              </div>
              <Icon name="chevron-right" size={15} className="pt-go" />
            </button>
          ))}
        </section>
      )}
    </main>
  );
}

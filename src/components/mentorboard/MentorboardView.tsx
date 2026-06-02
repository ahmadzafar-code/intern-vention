"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CultureRow, CohortRow, MentorRow } from "@/lib/queries/mentorboard";
import { Logo } from "@/components/primitives/Logo";
import { Icon } from "@/components/primitives/Icon";
import { BadgePill } from "@/components/karma/BadgePill";
import { INDUSTRIES } from "@/lib/constants";
import { mentorshipTier, fmtK } from "@/lib/karma";

const MEDAL = ["#E0A800", "#A8A29E", "#C2702F"];
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function CultureChip({ count, size }: { count: number; size?: "sm" }) {
  const t = mentorshipTier(count);
  return (
    <span className={"culture-chip tone-" + t.tone + (size === "sm" ? " sm" : "")} title={`${count} contributions — ${t.label.toLowerCase()} mentorship culture`}>
      <Icon name="sparkle" size={size === "sm" ? 9 : 11} /> {t.label}
    </span>
  );
}

export function MentorboardView({
  cultures,
  cohortsMajor,
  cohortsYear,
  mentors,
  currentUsername,
}: {
  cultures: CultureRow[];
  cohortsMajor: CohortRow[];
  cohortsYear: CohortRow[];
  mentors: MentorRow[];
  currentUsername: string | null;
}) {
  const [tab, setTab] = useState<"companies" | "cohorts" | "people">("companies");
  return (
    <main className="mentorboard">
      <header className="mb-header">
        <div className="mb-eyebrow">The Mentorboard</div>
        <h1>The more you give, the higher you climb.</h1>
        <p className="mb-lede">
          Every report, reply, and piece of advice is an act of mentorship. We rank the people — and the companies —
          who give back most to the next class of Stanford students.
        </p>
      </header>

      <div className="mb-tabs">
        <button className={tab === "companies" ? "on" : ""} onClick={() => setTab("companies")}><Icon name="sparkle" size={14} /> Mentorship cultures</button>
        <button className={tab === "cohorts" ? "on" : ""} onClick={() => setTab("cohorts")}><Icon name="trend-up" size={14} /> Who gives back</button>
        <button className={tab === "people" ? "on" : ""} onClick={() => setTab("people")}><Icon name="star" size={14} /> Top mentors</button>
      </div>

      {tab === "companies" && <CompaniesBoard cultures={cultures} />}
      {tab === "cohorts" && <CohortBoard byMajor={cohortsMajor} byYear={cohortsYear} />}
      {tab === "people" && <MentorsBoard mentors={mentors} currentUsername={currentUsername} />}
    </main>
  );
}

function CompaniesBoard({ cultures }: { cultures: CultureRow[] }) {
  const router = useRouter();
  const [industry, setIndustry] = useState("all");
  const rows = industry === "all" ? cultures : cultures.filter((c) => c.industry === industry);
  const max = rows.length ? rows[0].reports : 1;
  return (
    <div className="companies-board">
      <div className="board-controls">
        <nav className="board-industry">
          {INDUSTRIES.map((i) => (
            <button key={i.key} className={industry === i.key ? "on" : ""} onClick={() => setIndustry(i.key)}>{i.label}</button>
          ))}
        </nav>
      </div>
      <div className="board-caption">Companies whose Stanford alumni give back the most — a proxy for mentorship culture.</div>
      {rows.length === 0 ? (
        <p className="empty-note">No contributions yet for this filter — the board fills in as the community grows.</p>
      ) : (
        <div className="cboard-list">
          {rows.map((c, i) => {
            const tier = mentorshipTier(c.reports);
            return (
              <button className="cboard-row" key={c.slug} onClick={() => router.push(`/company/${c.slug}`)}>
                <span className="cboard-rank">{i + 1}</span>
                <Logo company={c} size={34} radius={8} />
                <span className="cboard-id">
                  <span className="cboard-name">{c.name} <CultureChip count={c.reports} size="sm" /></span>
                  <span className="cboard-sub">{cap(c.industry)}</span>
                </span>
                <span className="cboard-bar">
                  <span className="cboard-fill" style={{ width: Math.round((c.reports / max) * 100) + "%", background: tier.tone === "gold" ? "#C99A2E" : tier.tone === "green" ? "var(--green)" : tier.tone === "blue" ? "#2A6FDB" : "#8A8780" }} />
                </span>
                <span className="cboard-score">{c.reports}<span className="cboard-score-l">reports</span></span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CohortBoard({ byMajor, byYear }: { byMajor: CohortRow[]; byYear: CohortRow[] }) {
  const [dim, setDim] = useState<"major" | "year">("major");
  const rows = dim === "major" ? byMajor : byYear;
  const max = rows.length ? rows[0].count : 1;
  return (
    <div className="cohort-board">
      <div className="board-controls">
        <div className="board-lens">
          <span className="bl-label">Break down by</span>
          <div className="seg">
            <button className={dim === "major" ? "on" : ""} onClick={() => setDim("major")}>Major</button>
            <button className={dim === "year" ? "on" : ""} onClick={() => setDim("year")}>Graduating year</button>
          </div>
        </div>
      </div>
      <div className="board-caption">
        {dim === "major"
          ? "Which Stanford majors have given back the most recruiting stories (groups of 5+ shown, for anonymity)."
          : "Which graduating class has contributed the most (groups of 5+ shown, for anonymity)."}
      </div>
      {rows.length === 0 ? (
        <p className="empty-note">Not enough contributions in any single group yet — this fills in as the community grows.</p>
      ) : (
        <div className="cohort-list">
          {rows.map((r, i) => (
            <div className="cohort-row" key={r.label}>
              <span className="cohort-rank" style={i < 3 ? { color: MEDAL[i], fontWeight: 800 } : undefined}>{i + 1}</span>
              <span className="cohort-label">{r.label}</span>
              <span className="cohort-bar"><span className="cohort-fill" style={{ width: Math.round((r.count / max) * 100) + "%" }} /></span>
              <span className="cohort-count">{r.count}<span className="cohort-count-l">contribs</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MentorsBoard({ mentors, currentUsername }: { mentors: MentorRow[]; currentUsername: string | null }) {
  if (mentors.length === 0) {
    return <p className="empty-note">No mentors ranked yet — contribute and reply to start climbing.</p>;
  }
  return (
    <div className="mentor-list">
      {mentors.map((r, i) => {
        const mine = !!currentUsername && r.username === currentUsername;
        return (
          <div className={"mentor-row" + (mine ? " mine" : "")} key={r.username}>
            <span className="mentor-rank" style={i < 3 ? { color: MEDAL[i], fontWeight: 800 } : undefined}>{i + 1}</span>
            <span className="mentor-av" style={{ background: mine ? "var(--accent)" : "#2A2A26" }}>{r.username.slice(0, 2).toUpperCase()}</span>
            <span className="mentor-id">
              <span className="mentor-name">
                u/{r.username}
                {mine && <span className="you-tag">you</span>}
                {r.badge && <BadgePill id={r.badge} size="sm" />}
              </span>
              <span className="mentor-sub"><span className="anon-flair">anonymous mentor</span></span>
            </span>
            <span className="mentor-pts">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.8.7-5 4.6 1.4 6.7L12 17.8 5.9 20.3 7.3 13.6l-5-4.6 6.8-.7z" /></svg>
              {fmtK(r.karma)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

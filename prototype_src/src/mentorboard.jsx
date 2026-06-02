/* =========================================================================
   Intern·vention — Mentorboard
   Reframes the leaderboard around GIVING BACK. Two lenses:
   • People  — top mentors by Mentor Points (opt-in name/company identity)
   • Companies — ranked by contributions = "mentorship culture", sliceable
                 by industry / major / graduating year.
   ========================================================================= */

const CULTURE_TONE = { gold: "gold", green: "green", blue: "blue", slate: "slate" };

function CultureChip({ count, size }) {
  const t = IV.mentorshipTier(count);
  return <span className={"culture-chip tone-" + t.tone + (size === "sm" ? " sm" : "")} title={`${count} contributions — ${t.label.toLowerCase()} mentorship culture`}>
    <Icon name="sparkle" size={size === "sm" ? 9 : 11} /> {t.label}
  </span>;
}

/* ---------------- People (top mentors) ---------------- */
const MENTOR_HANDLES = [
  "finally_lol", "intern_24", "behavioral_tips", "cold_email_god",
  "superday_survivor", "case_in_point", "mental_math_demon", "startup_dreams",
  "referral_pilled", "networking_machine", "oa_szn_done", "poll_master",
];
// a few mentors have chosen to show identity (opt-in) — adds aspirational status
const MENTOR_IDENTITY = {
  finally_lol: { name: "Priya N.", company: "OpenAI" },
  behavioral_tips: { name: "Marcus L.", company: "Anthropic" },
  superday_survivor: { name: "Dana K.", company: "Goldman Sachs" },
  case_in_point: { name: "Theo R.", company: "McKinsey" },
};

function MentorsBoard() {
  const store = useStore();
  const me = store.signedIn() ? store.myMentorCompany() : null;
  const rows = useMemo(() => {
    const arr = MENTOR_HANDLES.map((h) => {
      const m = IV.authorMeta(h);
      const id = MENTOR_IDENTITY[h];
      return { handle: h, points: m.karma, badge: m.badges[0], year: m.year, id, mine: false };
    });
    if (store.unlocked()) {
      const vis = store.visibility;
      const flairs = store.flairs || [];
      arr.push({
        handle: store.username(), points: store.mentorPoints(), badge: store.myBadges()[0],
        year: "Senior", mine: true,
        id: vis.name ? { name: store.state.auth.name } : null,
        flairs,
      });
    }
    return arr.sort((a, b) => b.points - a.points);
  }, [store.state]);
  const medal = ["#E0A800", "#A8A29E", "#C2702F"];

  return (
    <div className="mentor-list">
      {rows.map((r, i) => (
        <div className={"mentor-row" + (r.mine ? " mine" : "")} key={r.handle}>
          <span className="mentor-rank" style={i < 3 ? { color: medal[i], fontWeight: 800 } : null}>{i + 1}</span>
          <span className="mentor-av" style={{ background: r.mine ? "var(--accent)" : "#2A2A26" }}>
            {(r.id && r.id.name) ? r.id.name.split(" ").map((w) => w[0]).join("") : r.handle.slice(0, 2).toUpperCase()}
          </span>
          <span className="mentor-id">
            <span className="mentor-name">
              {(r.id && r.id.name) ? r.id.name : "u/" + r.handle}
              {r.mine && <span className="you-tag">you</span>}
              {r.badge && <BadgePill id={r.badge} size="sm" />}
            </span>
            <span className="mentor-sub">
              {r.flairs && r.flairs.length
                ? r.flairs.map((f) => { const fl = IV.flairLabel(f); return <span key={f} className={"ex-flair flair-" + fl.type}>{fl.label}</span>; })
                : (r.id && r.id.company) ? <span className="ex-flair">ex-{r.id.company}</span>
                : <span className="anon-flair">anonymous mentor</span>}
              <span className="dotsep">·</span>{r.year}
            </span>
          </span>
          <span className="mentor-pts"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.8.7-5 4.6 1.4 6.7L12 17.8 5.9 20.3 7.3 13.6l-5-4.6 6.8-.7z" /></svg>{IV.fmtK(r.points)}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Companies (mentorship culture) ---------------- */
function CompaniesBoard() {
  const nav = useNav();
  const [industry, setIndustry] = useState("all");
  const [perCapita, setPerCapita] = useState(false);

  const board = IV.mentorshipBoard({ industry, lens: "overall", perCapita });
  const max = board.length ? board[0].score : 1;
  const inds = IV.industries;

  return (
    <div className="companies-board">
      <div className="board-controls">
        <nav className="board-industry">
          {inds.map((i) => (
            <button key={i.key} className={industry === i.key ? "on" : ""} onClick={() => setIndustry(i.key)}>{i.label}</button>
          ))}
        </nav>
        <label className="percap-toggle">
          <button className={"vis-toggle" + (perCapita ? " on" : "")} onClick={() => setPerCapita(!perCapita)} role="switch" aria-checked={perCapita}><span className="vt-knob" /></button>
          <span className="percap-text"><strong>Per-capita give-back rate</strong><span>level the field — contributions per 100 Stanford alumni, so small firms can rank</span></span>
        </label>
      </div>

      <div className="board-caption">
        {perCapita
          ? "Ranked by give-back rate — what share of each company's Stanford alumni actually contribute. Tight-knit teams can out-give the giants."
          : "Companies whose Stanford alumni give back the most — a proxy for mentorship culture."}
      </div>

      <div className="cboard-list">
        {board.map((row, i) => {
          const c = row.company;
          const tier = IV.mentorshipTier(c.reports);
          return (
            <button className="cboard-row" key={c.slug} onClick={() => nav.go({ name: "company", slug: c.slug })}>
              <span className="cboard-rank">{i + 1}</span>
              <Logo company={c} size={34} radius={8} />
              <span className="cboard-id">
                <span className="cboard-name">{c.name} <CultureChip count={c.reports} size="sm" /></span>
                <span className="cboard-sub">{perCapita ? `${row.raw} of ~${row.base} Stanford alumni` : cap(c.industry)}</span>
              </span>
              <span className="cboard-bar"><span className="cboard-fill" style={{ width: Math.round(row.score / max * 100) + "%", background: tier.tone === "gold" ? "#C99A2E" : tier.tone === "green" ? "var(--green)" : tier.tone === "blue" ? "#2A6FDB" : "#8A8780" }} /></span>
              <span className="cboard-score">{perCapita ? row.score + "%" : row.score}<span className="cboard-score-l">{perCapita ? "give-back" : "reports"}</span></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MentorboardView() {
  const [tab, setTab] = useState("companies");
  const store = useStore();
  return (
    <main className="mentorboard">
      <header className="mb-header">
        <div className="mb-eyebrow">The Mentorboard</div>
        <h1>The more you give, the higher you climb.</h1>
        <p className="mb-lede">Every report, reply, and piece of advice is an act of mentorship. We rank the people — and the companies — who give back most to the next class of Stanford students.</p>
      </header>

      <div className="mb-tabs">
        <button className={tab === "companies" ? "on" : ""} onClick={() => setTab("companies")}><Icon name="sparkle" size={14} /> Mentorship cultures</button>
        <button className={tab === "cohorts" ? "on" : ""} onClick={() => setTab("cohorts")}><Icon name="trend-up" size={14} /> Who gives back</button>
        <button className={tab === "people" ? "on" : ""} onClick={() => setTab("people")}><Icon name="star" size={14} /> Top mentors</button>
      </div>

      {tab === "companies" && <CompaniesBoard />}
      {tab === "cohorts" && <CohortBoard />}
      {tab === "people" && (
        <React.Fragment>
          {store.unlocked() && <VisibilityNudge />}
          <MentorsBoard />
        </React.Fragment>
      )}
    </main>
  );
}

/* ---------------- Cohorts: which majors / grad years give back ---------------- */
function CohortBoard() {
  const [dim, setDim] = useState("major"); // major | year
  const rows = dim === "major" ? IV.contributionsByMajor() : IV.contributionsByGradYear();
  const max = rows.length ? rows[0].count : 1;
  const medal = ["#E0A800", "#A8A29E", "#C2702F"];
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
          ? "Which Stanford majors have given back the most recruiting stories this cycle."
          : "Which graduating class has contributed the most — seniors and juniors lead as they finish recruiting."}
      </div>
      {rows.length === 0 ? (
        <p className="empty-note">No contributions yet — this fills in as the community grows.</p>
      ) : (
        <div className="cohort-list">
          {rows.map((r, i) => (
            <div className="cohort-row" key={r.label}>
              <span className="cohort-rank" style={i < 3 ? { color: medal[i], fontWeight: 800 } : null}>{i + 1}</span>
              <span className="cohort-label">{r.label}</span>
              <span className="cohort-bar"><span className="cohort-fill" style={{ width: Math.round(r.count / max * 100) + "%" }} /></span>
              <span className="cohort-count">{r.count}<span className="cohort-count-l">contribs</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VisibilityNudge() {
  const store = useStore();
  const nav = useNav();
  const vis = store.visibility;
  if (vis.name || vis.company) return null;
  return (
    <div className="vis-nudge">
      <div className="vis-nudge-icon"><Icon name="user" size={16} /></div>
      <div className="vis-nudge-text"><strong>You're an anonymous mentor.</strong> Want recognition? You can show your name or an “ex-company” flair on the board.</div>
      <button className="vis-nudge-btn" onClick={() => nav.go({ name: "contributions" })}>Manage visibility →</button>
    </div>
  );
}

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

Object.assign(window, { MentorboardView, MentorsBoard, CompaniesBoard, CohortBoard, CultureChip, VisibilityNudge });

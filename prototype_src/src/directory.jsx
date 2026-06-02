/* =========================================================================
   Intern·vention — Directory / home
   ========================================================================= */

function MultiFilterDropdown({ label, value, onToggle, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const active = value.length > 0;
  const summary = value.length === 0 ? "Any" : value.length <= 2 ? value.join(", ") : value.length + " years";
  return (
    <div className="filter-dd" ref={ref}>
      <button className={"filter-chip" + (active ? " active" : "")} onClick={() => setOpen(!open)}>
        <span className="fc-label">{label}:</span> {summary}
        <Icon name="chevron-down" size={11} stroke={2.5} />
      </button>
      {open && (
        <div className="filter-menu">
          {options.map((o) => {
            const on = value.includes(o);
            return (
              <button key={o} className={"filter-opt multi" + (on ? " sel" : "")} onClick={() => onToggle(o)}>
                <span className="fo-box">{on && <Icon name="check" size={11} />}</span>{o}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterDropdown({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const cur = options.find(([k]) => k === value) || options[0];
  const active = value && value !== "all" && value !== "" && value !== "2024–25";
  return (
    <div className="filter-dd" ref={ref}>
      <button className={"filter-chip" + (active ? " active" : "")} onClick={() => setOpen(!open)}>
        <span className="fc-label">{label}:</span> {cur[1]}
        <Icon name="chevron-down" size={11} stroke={2.5} />
      </button>
      {open && (
        <div className="filter-menu">
          {options.map(([k, l]) => (
            <button key={k} className={"filter-opt" + (k === value ? " sel" : "")} onClick={() => { onChange(k); setOpen(false); }}>{l}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyTile({ company, trending }) {
  const nav = useNav();
  const reports = IV.companyReports(company);
  return (
    <button className={"tile" + (trending ? " tile-trending" : "")} onClick={() => nav.go({ name: "company", slug: company.slug })}>
      <Logo company={company} size={46} radius={10} />
      <div className="tile-info">
        <div className="tile-name">{company.name}</div>
        <div className="tile-meta">
          <span className="ind">{company.industry}</span>
          {!trending && <React.Fragment><span className="sep">·</span>{reports === 0 ? <span className="num-new">No reports yet</span> : <React.Fragment><span className="num">{reports}</span> reports</React.Fragment>}</React.Fragment>}
        </div>
      </div>
      {trending && <span className="badge-trend">+{company.trend} ↑</span>}
      {company.userAdded && !trending && <span className="badge-new">NEW</span>}
    </button>
  );
}

/* ---------------------------------------------------------- Request company modal */
function slugify(s) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
const TILE_BGS = ["#1A1A18", "#26415E", "#7A1F2B", "#1F4D3A", "#4B3FA8", "#B5341F", "#16453A", "#3A2E1F"];

function AddCompanyModal({ onClose }) {
  const store = useStore();
  const nav = useNav();
  const toast = useToast();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("startups");
  const [note, setNote] = useState("");
  const inds = IV.industries.filter((i) => i.key !== "all");

  const slug = slugify(name);
  const dupe = name.trim().length >= 2 && IV.companies.find((c) => c.slug === slug || c.name.toLowerCase() === name.trim().toLowerCase());
  const pendingDupe = store.companyRequests().find((r) => r.status === "pending" && r.slug === slug);
  const matches = name.trim().length >= 2
    ? IV.companies.filter((c) => c.name.toLowerCase().includes(name.toLowerCase())).slice(0, 3)
    : [];
  const canSubmit = name.trim().length >= 2 && !dupe && !pendingDupe;

  const submit = () => {
    if (!canSubmit) return;
    store.requestCompany({
      name: name.trim(), slug, industry,
      website: website.trim(), note: note.trim(),
      bg: TILE_BGS[slug.length % TILE_BGS.length],
      domain: website.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || slug + ".com",
    });
    toast("Company details saved — now add your story", { icon: "check", tone: "good" });
    onClose();
    nav.go({ name: "contribute", slug });
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="composer" onClick={(e) => e.stopPropagation()}>
        <div className="composer-head">
          <h3>Request a new company · Step 1 of 2</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="composer-body">
          <div className="req-banner"><Icon name="lock" size={13} /> New companies are <strong>reviewed by our team</strong> before going live. Next you'll add your recruiting story — it ships with the request and goes live when approved.</div>

          <label className="composer-label">Company name</label>
          <input className="composer-input" value={name} maxLength={40} autoFocus placeholder="e.g. Mercor, Sierra, Cognition…" onChange={(e) => setName(e.target.value)} />
          {dupe && (
            <div className="add-co-warn dupe">
              <Icon name="check-circle" size={13} /> <strong>{dupe.name}</strong> already exists.
              <button className="link-btn" onClick={() => { onClose(); nav.go({ name: "company", slug: dupe.slug }); }}>Open it →</button>
            </div>
          )}
          {pendingDupe && <div className="add-co-warn">A request for this company is already pending review.</div>}
          {!dupe && matches.length > 0 && (
            <div className="add-co-matches">
              <div className="acm-label">Did you mean one of these?</div>
              {matches.map((c) => (
                <button key={c.slug} className="add-co-match" onClick={() => { onClose(); nav.go({ name: "company", slug: c.slug }); }}>
                  <Logo company={c} size={26} radius={6} />
                  <span>{c.name}</span>
                  <span className="acm-go">Open →</span>
                </button>
              ))}
            </div>
          )}

          <label className="composer-label">Website <span className="opt">helps us verify</span></label>
          <input className="composer-input" value={website} maxLength={60} placeholder="company.com" onChange={(e) => setWebsite(e.target.value)} />

          <label className="composer-label">Industry</label>
          <div className="flair-picker">
            {inds.map((i) => (
              <button key={i.key} className={"radio-chip" + (industry === i.key ? " selected" : "")} onClick={() => setIndustry(i.key)}>{i.label}</button>
            ))}
          </div>

          <label className="composer-label">Anything we should know? <span className="opt">optional</span></label>
          <textarea className="composer-textarea" value={note} maxLength={200} placeholder="e.g. seed-stage AI startup, ~20 people, hires Stanford interns…" onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="composer-foot">
          <span className="composer-note">Reviewed to prevent duplicates · usually &lt; 48h</span>
          <button className={"primary-btn" + (canSubmit ? "" : " disabled")} onClick={submit}>Continue to your story →</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Cycle pass banner */
function CyclePassBanner() {
  const store = useStore();
  const nav = useNav();
  if (store.unlocked()) {
    const n = store.state.contributions.length;
    return (
      <div className="pass-banner unlocked">
        <div className="pass-icon ok"><Icon name="check-circle" size={20} /></div>
        <div className="pass-text">
          <strong>You're in for cycle 2024–25.</strong> {n} contribution{n === 1 ? "" : "s"} on record · {IV.fmtK(store.myKarma())} karma. The full cohort report and every Community forum are unlocked.
        </div>
        <button className="pass-cta ghost" onClick={() => nav.go({ name: "community", scope: "__main__" })}>Open Community →</button>
      </div>
    );
  }
  if (store.signedIn()) {
    return (
      <div className="pass-banner verified">
        <div className="pass-icon"><Icon name="lock" size={18} /></div>
        <div className="pass-text">
          <strong>One step from full access.</strong> Verified as {store.state.auth.email}. Add <strong>one</strong> recruiting story — a past internship or offer — to unlock everything for cycle 2024–25.
        </div>
        <button className="pass-cta" onClick={() => nav.go({ name: "contribute" })}>Contribute →</button>
      </div>
    );
  }
  return (
    <div className="pass-banner">
      <div className="pass-icon"><Icon name="lock" size={18} /></div>
      <div className="pass-text">
        <strong>Unlock cycle 2024–25.</strong> Share <strong>one</strong> recruiting story — a past internship or offer — and you unlock every cohort report and the full community for the whole year. Anonymous, SUNet-verified.
      </div>
      <button className="pass-cta" onClick={() => nav.go({ name: "contribute" })}>Contribute to unlock →</button>
    </div>
  );
}

function DirectoryView() {
  const nav = useNav();
  const store = useStore();
  const [track, setTrack] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [query, setQuery] = useState("");
  const [majorSel, setMajorSel] = useState("");
  const [degSel, setDegSel] = useState("");
  const [gradSel, setGradSel] = useState([]);
  const [compSel, setCompSel] = useState("");
  const [cycle, setCycle] = useState("2024–25");
  const [adding, setAdding] = useState(false);

  const COMP_TIERS = ["$5–7k / mo", "$7–8k / mo", "$8–10k / mo", "$10k+ / mo", "$11k+ / mo"];
  const compRank = (s) => { const m = String(s || "").match(/\$(\d+)/); return m ? parseInt(m[1], 10) : 0; };
  const roleTrack = (name) => /intern/i.test(name) ? "intern" : /(new grad|grad)/i.test(name) ? "newgrad" : "fulltime";
  const GRAD_FILTER_YEARS = IV.GRAD_CLASS_YEARS;
  // a company's contributor cohort: deterministic (degree, gradYear) pairs, so the
  // Degree and Grad-year filters describe the SAME people and combine coherently.
  const companyCohorts = (slug) => {
    let h = 0; for (let j = 0; j < slug.length; j++) h = (h * 31 + slug.charCodeAt(j)) >>> 0;
    const out = [];
    IV.DEGREE_FILTERS.forEach((deg, di) => {
      // bachelor's almost always present; advanced degrees vary by company
      if (di !== 0 && (h + di * 13) % 4 === 0) return;
      GRAD_FILTER_YEARS.forEach((yr, yi) => {
        if ((h + di * 7 + yi * 11) % 3 !== 0) out.push({ deg, yr });
      });
    });
    if (!out.length) out.push({ deg: "Bachelor's", yr: "2026" });
    return out;
  };
  const companyDegrees = (slug) => [...new Set(companyCohorts(slug).map((c) => c.deg))];
  const companyGradYears = (slug) => [...new Set(companyCohorts(slug).map((c) => c.yr))];
  const cohortMatch = (slug) => companyCohorts(slug).some((c) =>
    (!degSel || degSel === c.deg) && (!gradSel.length || gradSel.includes(c.yr)));
  const q = query.trim().toLowerCase();
  const hasSearch = q || majorSel || degSel || gradSel.length || compSel || track !== "all" || industry !== "all";
  const filtered = IV.companies.filter((c) => {
    const d = IV.getDetail(c.slug);
    if (industry !== "all" && c.industry !== industry) return false;
    if (track !== "all" && !d.roles.some((r) => roleTrack(r.name) === track)) return false;
    if (majorSel && !(d.majors || []).some((m) => m.label === majorSel)) return false;
    if ((degSel || gradSel.length) && !cohortMatch(c.slug)) return false;
    if (compSel && compRank(d.kpis.comp) < compRank(compSel)) return false;
    if (q) {
      const indLabel = (IV.industries.find((i) => i.key === c.industry) || {}).label || "";
      const hit = c.name.toLowerCase().includes(q) || indLabel.toLowerCase().includes(q) || d.roles.some((r) => r.name.toLowerCase().includes(q));
      if (!hit) return false;
    }
    return true;
  });
  const trending = [...IV.companies].filter((c) => c.trend > 0).sort((a, b) => b.trend - a.trend).slice(0, 4);

  return (
    <div className="layout">
      <CommunityThread
        scope="__main__"
        nameStrong="Main Community Thread"
        meta={IV.isLaunch() ? "be the first to post" : "all of Stanford recruiting · 312 posts this cycle"}
        lockHeading="Contribute to unlock"
        lockBody="Add your recruiting story in 90 seconds. Your data unlocks the full Community Thread — and helps the next class."
      />

      <main className="page">
        <section className="hero">
          <div className="hero-eyebrow">Intern<span className="dot">·</span>vention</div>
          <h1>Where &amp; how Stanford <span className="accent">recruited</span> this cycle.</h1>
          <p className="hero-sub">Anonymized recruiting accounts from Stanford undergrads, grads, and coterms. Research where you're headed next — see what actually worked.</p>
          <div className="hero-search-wrap">
            <span className="hero-search-icon"><Icon name="search" size={18} /></span>
            <input className="hero-search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contributions by company, role, or industry" />
            {query && <button className="hero-search-clear" onClick={() => setQuery("")}><Icon name="x" size={15} /></button>}
          </div>
          <div className="filter-row">
            <FilterDropdown label="Track" value={track} onChange={setTrack}
              options={[["all", "Any track"], ["intern", "Internship"], ["newgrad", "New grad"], ["fulltime", "Full-time"]]} />
            <FilterDropdown label="Industry" value={industry} onChange={setIndustry}
              options={IV.industries.map((i) => [i.key, i.key === "all" ? "Any industry" : i.label])} />
            <FilterDropdown label="Cycle" value={cycle} onChange={setCycle}
              options={[["2024–25", "2024–25"], ["2023–24", "2023–24"], ["2022–23", "2022–23"]]} />
            <FilterDropdown label="Major" value={majorSel} onChange={setMajorSel}
              options={[["", "Any major"], ...IV.STANFORD_MAJORS.map((m) => [m, m])]} />
            <FilterDropdown label="Degree" value={degSel} onChange={setDegSel}
              options={[["", "Any degree"], ...IV.DEGREE_FILTERS.map((dg) => [dg, dg])]} />
            <MultiFilterDropdown label="Grad year" value={gradSel} options={GRAD_FILTER_YEARS}
              onToggle={(y) => setGradSel((g) => g.includes(y) ? g.filter((x) => x !== y) : [...g, y])} />
            <FilterDropdown label="Min. comp" value={compSel} onChange={setCompSel}
              options={[["", "Any comp"], ...COMP_TIERS.map((c) => [c, c + "+"])]} />
            {hasSearch && <button className="filter-clear" onClick={() => { setQuery(""); setTrack("all"); setIndustry("all"); setMajorSel(""); setDegSel(""); setGradSel([]); setCompSel(""); }}>Clear all</button>}
          </div>
        </section>

        <CyclePassBanner />

        {!hasSearch && IV.isLaunch() && (
          <section className="launch-callout">
            <div className="launch-callout-icon"><Icon name="sparkle" size={20} /></div>
            <div className="launch-callout-text">
              <strong>Fresh launch.</strong> No contributions yet — the directory is live but every cohort report and forum starts empty. Be the first to contribute and the data fills in.
            </div>
          </section>
        )}

        <div className="section-head browse-head">
          <h2>Browse companies</h2>
          <span className="meta">find where you're targeting next</span>
        </div>

        <div className="controls-row">
          <div className="controls-meta">{hasSearch ? `${filtered.length} ${filtered.length === 1 ? "company" : "companies"} match` : (IV.isLaunch() ? "Be the first to contribute" : `${IV.fmtK(IV.totalReports)}+ contributions · cycle ${cycle}`)}</div>
        </div>

        {filtered.length === 0 ? (
          <p className="empty-note big">No companies match those filters. <a className="inline-link" onClick={() => setAdding(true)}>Request a company →</a></p>
        ) : (
          <section className="company-grid">
            {filtered.map((c) => <CompanyTile key={c.slug} company={c} />)}
            <button className="tile add-tile" onClick={() => setAdding(true)}>
              <span className="add-tile-plus"><Icon name="plus" size={20} /></span>
              <div className="tile-info">
                <div className="tile-name">Request a company</div>
                <div className="tile-meta">missing one? we'll verify &amp; add it</div>
              </div>
            </button>
          </section>
        )}

        {!hasSearch && !IV.isLaunch() && (
          <React.Fragment>
            <div className="section-head trending-head">
              <h2>Top mentorship cultures</h2>
              <span className="meta">companies whose Stanford alumni give back most · <a className="inline-link" onClick={() => nav.go({ name: "mentorboard" })}>full Mentorboard →</a></span>
            </div>
            <section className="trending-grid">
              {IV.mentorshipBoard({ lens: "overall" }).slice(0, 4).map(({ company }) => (
                <button key={company.slug} className="tile mentor-tile" onClick={() => nav.go({ name: "company", slug: company.slug })}>
                  <Logo company={company} size={46} radius={10} />
                  <div className="tile-info">
                    <div className="tile-name">{company.name}</div>
                    <div className="tile-meta"><CultureChip count={company.reports} size="sm" /></div>
                  </div>
                  <span className="mentor-tile-count">{company.reports}</span>
                </button>
              ))}
            </section>
          </React.Fragment>
        )}

        <footer className="footer-meta">
          <span className="brand-mini">Intern·vention</span> · built for Stanford · anonymized recruiting data · cycle 2024–25
        </footer>
      </main>
      {adding && <AddCompanyModal onClose={() => setAdding(false)} />}
    </div>
  );
}

Object.assign(window, { CompanyTile, AddCompanyModal, CyclePassBanner, DirectoryView, slugify });

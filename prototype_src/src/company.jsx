/* =========================================================================
   Intern·vention — Company detail (stats dashboard + gated advice)
   ========================================================================= */

/* ---------------------------------------------------------- Role selector */
function RoleSelect({ roles, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const cur = roles.find((r) => r.name === value) || roles[0];
  return (
    <div className="role-select" ref={ref}>
      <button className={"role-trigger" + (open ? " open" : "")} onClick={() => setOpen(!open)}>
        <span className="rt-col">
          <span className="label">Role</span>
          <span className="value">{cur.name}</span>
        </span>
        <span className="count">{cur.count}</span>
        <Icon name="chevron-down" size={14} className="chev" />
      </button>
      {open && (
        <div className="role-menu open">
          {roles.map((r) => (
            <button key={r.name} className={"role-option" + (r.name === value ? " selected" : "")}
              onClick={() => { onChange(r.name); setOpen(false); }}>
              {r.name}<span className="c">{r.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- Filter chip */
function FilterChip({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const active = value && value !== "All";
  return (
    <div className="filter-chip-wrap" ref={ref}>
      <button className={"chip" + (active ? " active" : "")} onClick={() => setOpen(!open)}>
        {active ? value : label}
        <Icon name="chevron-down" size={10} stroke={2.5} />
      </button>
      {open && (
        <div className="chip-menu">
          {options.map((o) => (
            <button key={o} className={"chip-opt" + (o === value ? " sel" : "")}
              onClick={() => { onChange(o); setOpen(false); }}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- KPI strip */
function KpiStrip({ kpis }) {
  const items = [
    ["Median GPA", kpis.gpa],
    ["Median rounds", kpis.rounds],
    ["Apply → offer", kpis.applyToOffer],
    ["Most common year", kpis.commonYear],
  ];
  return (
    <div className="kpi-strip">
      {items.map(([l, v]) => (
        <div className="kpi" key={l}><div className="label">{l}</div><div className="value">{v}</div></div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- Timing chart (apply vs offer) */
function TimingChart({ applied, offer, n }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);
  const data = applied || [];
  const off = offer || data.map(() => 0);
  const max = Math.max(...data, ...off, 1);
  const W = 1180, H = 210, x0 = 40, top = 20, bottom = 170;
  const span = W - x0 - 10;
  const step = span / data.length;
  const ticks = [0, Math.ceil(max / 2), max];
  return (
    <svg className="timing-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <line x1={x0} y1={top} x2={x0} y2={bottom} stroke="#E7E5E0" strokeWidth="1" />
      <line x1={x0} y1={bottom} x2={W - 10} y2={bottom} stroke="#D4D2CC" strokeWidth="1" />
      {ticks.map((t, i) => {
        const y = bottom - (t / max) * (bottom - top);
        return <g key={i}>
          {i > 0 && <line x1={x0} y1={y} x2={W - 10} y2={y} stroke="#F4F4F2" strokeWidth="1" strokeDasharray="2,3" />}
          <text x={x0 - 8} y={y + 3} textAnchor="end" fontSize="10.5" fill="#908C82">{t}</text>
        </g>;
      })}
      {data.map((v, i) => {
        const groupW = step * 0.56;
        const bw = groupW / 2 - 1;
        const gx = x0 + i * step + (step - groupW) / 2;
        const aH = mounted ? (v / max) * (bottom - top) : 0;
        const oH = mounted ? (off[i] / max) * (bottom - top) : 0;
        return <g key={i}>
          <rect x={gx} y={bottom - aH} width={bw} height={aH} rx="2" fill="var(--accent)"
            style={{ transition: "y .6s cubic-bezier(.2,.8,.2,1), height .6s cubic-bezier(.2,.8,.2,1)", transitionDelay: (i * 30) + "ms", opacity: v === 0 ? 0.18 : 1 }} />
          <rect x={gx + bw + 2} y={bottom - oH} width={bw} height={oH} rx="2" fill="#1A1A18"
            style={{ transition: "y .6s cubic-bezier(.2,.8,.2,1), height .6s cubic-bezier(.2,.8,.2,1)", transitionDelay: (i * 30 + 90) + "ms", opacity: off[i] === 0 ? 0.18 : 1 }} />
        </g>;
      })}
      <g fontSize="11" fill="#908C82">
        {IV.MONTHS.map((m, i) => (
          <text key={m} x={x0 + i * step + step / 2} y="190" textAnchor="middle">{m}</text>
        ))}
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------- Majors bars */
function MajorBars({ majors }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  return (
    <div className="h-bars">
      {majors.map((m, i) => (
        <div className="h-bar-row" key={m.label}>
          <span className="h-bar-label">{m.label}</span>
          <span className="h-bar-track">
            <span className="h-bar-fill" style={{ width: (mounted ? m.pct : 0) + "%", transitionDelay: (i * 70) + "ms" }} />
          </span>
          <span className="h-bar-pct">{m.pct}%</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- Donut */
function ChannelDonut({ channels }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  const shades = ["#1A1A18", "#57544D", "#A3A09A", "#C9C6C0"];
  let acc = 0;
  const top = channels[0];
  return (
    <div className="donut-wrap">
      <svg className="donut-svg" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="15.915" fill="none" stroke="#F4F4F2" strokeWidth="6" />
        {channels.map((c, i) => {
          const seg = <circle key={i} cx="21" cy="21" r="15.915" fill="none" stroke={shades[i]} strokeWidth="6"
            strokeDasharray={`${mounted ? c.pct : 0} ${100 - (mounted ? c.pct : 0)}`}
            strokeDashoffset={-acc + 25} transform="rotate(0 21 21)"
            style={{ transition: "stroke-dasharray .7s cubic-bezier(.2,.8,.2,1)", transitionDelay: (i * 90) + "ms" }} />;
          acc += c.pct;
          return seg;
        })}
        <text x="21" y="20.5" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#1A1A18">{top.pct}%</text>
        <text x="21" y="26" textAnchor="middle" fontSize="3.1" fill="#908C82">via {top.label.toLowerCase()}</text>
      </svg>
      <div className="donut-legend">
        {channels.map((c, i) => (
          <div className="item" key={c.label}>
            <span className="sw" style={{ background: shades[i] }} /><span>{c.label}</span><span className="pct">{c.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- What mattered most */
function WhatMattered({ data, n }) {
  const top3 = data.slice(0, 3);
  const rest = data.slice(3);
  const maxRest = Math.max(...rest.map((r) => r.pct), 1);
  const total = data.reduce((a, b) => a + b.pct, 0);
  const ranks = ["№ 01", "№ 02", "№ 03"];
  return (
    <section className="what-mattered">
      <div className="chart-head">
        <div>
          <h2 className="wm-h">What mattered most</h2>
          <div className="what-mattered-sub">Contributors ranked their top 3 factors, in their honest opinion</div>
        </div>
        <span className="small-meta">n={n} · {total}% of weight</span>
      </div>
      <div className="wm-podium">
        {top3.map((f, i) => (
          <div className={"wm-card" + (i === 0 ? " first" : "")} key={f.key || f.label}>
            <div className="wm-card-rank">{ranks[i]}</div>
            <div className="wm-card-pct">{f.pct}<span className="sym">%</span></div>
            <div className="wm-card-label">{f.label}</div>
            <div className="wm-card-sub">{f.sub}</div>
          </div>
        ))}
      </div>
      {rest.length > 0 && (
        <div className="wm-rest">
          {rest.map((f, i) => (
            <div className="wm-rest-row" key={f.key || f.label}>
              <span className="wm-rest-rank">{String(i + 4).padStart(2, "0")}</span>
              <span className="wm-rest-label">{f.label}</span>
              <span className="wm-rest-track"><span className="wm-rest-fill" style={{ width: (f.pct / maxRest * 100) + "%" }} /></span>
              <span className="wm-rest-pct">{f.pct}%</span>
            </div>
          ))}
        </div>
      )}
      <p className="wm-footnote">* Self-reported and subjective. Weights are normalized across all contributors for this role.</p>
    </section>
  );
}

/* ---------------------------------------------------------- Advice card */
function AdviceCard({ a, slug }) {
  const [up, setUp] = useState(false);
  const nav = useNav();
  const open = () => nav.go({ name: "community", scope: slug });
  return (
    <div className="advice contributor" onClick={open}>
      <div className="advice-head">
        <span className="flair flair-advice">★ Contributor Advice</span>
        <span className="advice-role">{a.role}</span>
      </div>
      <p className="advice-body">{a.body}</p>
      <div className="advice-foot" onClick={(e) => e.stopPropagation()}>
        <button className={"advice-up" + (up ? " on" : "")} onClick={() => setUp(!up)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 10h-5v6h-6v-6H4z" /></svg>
          {a.ups + (up ? 1 : 0)}
        </button>
        <button className="advice-reply" onClick={open}><Icon name="comment" size={12} /> Reply in thread</button>
        <span className="advice-when">{a.when}</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Majors pie */
function MajorPie({ majors }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  const shades = ["var(--accent)", "#C2502F", "#E0A800", "#57544D", "#A3A09A"];
  let acc = 0;
  return (
    <div className="major-pie-wrap">
      <svg className="donut-svg" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="15.915" fill="none" stroke="#F4F4F2" strokeWidth="9" />
        {majors.map((m, i) => {
          const seg = <circle key={i} cx="21" cy="21" r="15.915" fill="none" stroke={shades[i % shades.length]} strokeWidth="9"
            strokeDasharray={`${mounted ? m.pct : 0} ${100 - (mounted ? m.pct : 0)}`}
            strokeDashoffset={-acc + 25}
            style={{ transition: "stroke-dasharray .7s cubic-bezier(.2,.8,.2,1)", transitionDelay: (i * 90) + "ms" }} />;
          acc += m.pct;
          return seg;
        })}
      </svg>
      <div className="donut-legend">
        {majors.map((m, i) => (
          <div className="item" key={m.label}>
            <span className="sw" style={{ background: shades[i % shades.length] }} /><span>{m.label}</span><span className="pct">{m.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Rounds breakdown */
function RoundsBreakdown({ rounds, channels }) {
  const tech = rounds ? rounds.technical : 3;
  const behav = rounds ? rounds.behavioral : 1;
  const total = tech + behav;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  return (
    <section className="card rounds-card">
      <div className="chart-head"><h2>Interview rounds</h2><span className="small-meta">median · {total} rounds total</span></div>
      <div className="rounds-bar">
        <span className="rb-seg rb-tech" style={{ flexGrow: tech, flexBasis: 0 }}><span className="rb-n">{tech}</span><span className="rb-l">Technical</span></span>
        {behav > 0 && <span className="rb-seg rb-behav" style={{ flexGrow: behav, flexBasis: 0 }}><span className="rb-n">{behav}</span><span className="rb-l">Behavioral</span></span>}
      </div>
      <div className="rounds-legend">
        <span><span className="dot tech" /> Technical (OA, coding, case) · {tech}</span>
        <span><span className="dot behav" /> Behavioral (fit, "why us") · {behav || "—"}</span>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- Company view */
function CompanyView({ slug }) {
  const store = useStore();
  const nav = useNav();
  const company = IV.getCompany(slug);
  const detail = IV.getDetail(slug);
  const advice = IV.getAdvice(slug);
  const roles = useMemo(() => {
    const total = detail.roles.reduce((a, r) => a + r.count, 0);
    return [{ name: "All roles", count: total }, ...detail.roles];
  }, [detail]);
  const [role, setRole] = useState("All roles");
  const [major, setMajor] = useState("All");
  const [year, setYear] = useState("All");
  const [gpa, setGpa] = useState("All");
  const [cycle, setCycle] = useState("2024–25");
  const [query, setQuery] = useState("");
  const unlocked = store.unlocked();
  const following = store.isFollowing(slug);

  const roleCount = (roles.find((r) => r.name === role) || roles[0]).count;
  const filtered = advice.filter((a) => !query || a.body.toLowerCase().includes(query.toLowerCase()) || a.role.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="layout">
      <CommunityThread
        scope={slug}
        label="Community Thread"
        name="iv.stanford/"
        nameStrong={company.name}
        meta={IV.isLaunch() ? "Be the first to post" : `${company.reports * 10} members · ${IV.getPosts(slug).length} posts this cycle`}
        lockHeading="Contribute to unlock"
        lockBody={`Add your ${company.name} recruiting story in 90 seconds. Your data unlocks the Community Thread for this company.`}
        lockSlug={slug}
        live
      />

      <main className="main">
        <div className="page-url">
          <Icon name="lock" size={12} />
          <code>iv.stanford.edu / <strong>{company.name.toLowerCase().replace(/[^a-z]/g, "")}</strong></code>
          <button className="url-copy" title="Copy"><Icon name="copy" size={13} /></button>
        </div>

        <header className="company-header">
          <Logo company={company} size={56} radius={12} />
          <div className="company-info">
            <h1>{company.name}</h1>
            <div className="company-meta">
              <span>{cap(company.industry)}</span><span className="pip" />
              <span>{IV.isLaunch() ? "No reports yet" : company.reports + (company.reports === 1 ? " report" : " reports")}</span><span className="pip" />
              <span>{detail.roles.length} roles tracked</span>
              {!IV.isLaunch() && <CultureChip count={company.reports} />}
            </div>
          </div>
          <button className={"follow-btn" + (following ? " active" : "")} onClick={() => store.toggleFollow(slug)}>
            {following ? "✓ Following" : "+ Follow"}
          </button>
        </header>

        {IV.isLaunch() ? (
          <div className="company-launch-empty">
            <div className="cle-icon"><Icon name="sparkle" size={24} /></div>
            <h2>No reports for {company.name} yet</h2>
            <p>This company is live in the directory, but no one has contributed a {company.name} recruiting story this cycle. Be the first — your report starts the cohort data and unlocks the community.</p>
            <button className="primary-btn" onClick={() => nav.go({ name: "contribute", slug })}>Be the first to contribute →</button>
          </div>
        ) : (
        <React.Fragment>
        <div className="controls">
          <RoleSelect roles={roles} value={role} onChange={setRole} />
          <div className="divider-v" />
          <FilterChip label="Major" value={major} onChange={setMajor} options={["All", "Computer Science", "Math + CS", "Symbolic Systems", "Other"]} />
          <FilterChip label="Class year" value={year} onChange={setYear} options={["All", "Sophomore", "Junior", "Senior", "Coterm"]} />
          <FilterChip label="GPA bucket" value={gpa} onChange={setGpa} options={["All", "3.9–4.0", "3.7–3.9", "3.4–3.7", "< 3.4"]} />
        </div>

        <div className="free-tag"><Icon name="check-circle" size={12} /> Free preview · headline stats</div>
        <section className="headline">
          <div className="headline-pie card">
            <div className="chart-head"><h2>Stanford majors</h2><span className="small-meta">n={roleCount}</span></div>
            <MajorPie majors={detail.majors} />
          </div>
          <div className="headline-stats">
            <div className="hstat"><div className="label">How they got in</div><div className="value">{detail.channels[0].label}</div><div className="sub">{detail.channels[0].pct}% of all answers</div></div>
            <div className="hstat"><div className="label">Median GPA</div><div className="value">{detail.kpis.gpa}</div><div className="sub">most common bucket</div></div>
            <div className="hstat"><div className="label">Median compensation</div><div className="value">{detail.kpis.comp}</div><div className="sub">self-reported</div></div>
          </div>
        </section>

        <section className="hero-chart">
          <div className="chart-head">
            <h2>When they applied vs. got the offer</h2>
            <span className="timing-legend"><span className="tl-item"><span className="tl-sw apply" />Applied</span><span className="tl-item"><span className="tl-sw offer" />Offer received</span></span>
          </div>
          <TimingChart applied={detail.timing} offer={detail.timingOffer} n={roleCount} />
        </section>

        {(() => {
          const report = (
            <React.Fragment>
              <div className="report-divider"><span>The full cohort report</span></div>
              <div className="grid-2">
                <RoundsBreakdown rounds={detail.rounds} channels={detail.channels} />
                <div className="card">
                  <div className="chart-head"><h2>How they got in</h2><span className="small-meta">% of all answers · n={roleCount}</span></div>
                  <ChannelDonut channels={detail.channels} />
                </div>
              </div>

              <WhatMattered data={detail.whatMattered} n={roleCount} />

              <div className="section-head">
                <h2>What's not on your LinkedIn that helped you get in</h2>
                <span className="meta">Stanford-specific advice from contributors · tap to discuss in the thread</span>
              </div>
              <div className="cycle-tabs">
                {["2024–25", "2023–24", "2022–23"].map((c) => (
                  <button key={c} className={"cycle-tab" + (cycle === c ? " active" : "")} onClick={() => setCycle(c)}>
                    {c}<span className="c">{c === "2024–25" ? advice.length : c === "2023–24" ? Math.max(2, advice.length - 2) : 1}</span>
                  </button>
                ))}
              </div>
              <input className="advice-search" placeholder="Search advice — e.g. 'referral', 'OA', 'behavioral'…"
                value={query} onChange={(e) => setQuery(e.target.value)} />
              <div className="advice-grid">
                {filtered.map((a, i) => <AdviceCard key={i} a={a} slug={slug} />)}
              </div>
            </React.Fragment>
          );
          return unlocked ? report : (
            <div className="locked-report">
              <div className="locked-report-content">{report}</div>
              <LockCard
                heading="Unlock the full cohort report"
                body={`See Stanford majors, how they got in, what mattered most, and every contributor's playbook for ${company.name}.`}
                slug={slug} />
            </div>
          );
        })()}
        </React.Fragment>
        )}
      </main>
    </div>
  );
}

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

Object.assign(window, { RoleSelect, FilterChip, KpiStrip, TimingChart, MajorBars, ChannelDonut, WhatMattered, AdviceCard, CompanyView });

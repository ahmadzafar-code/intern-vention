/* =========================================================================
   Intern·vention — Contribute (original per-company design)
   Profile (major / grad year / GPA) is captured at sign-up, so the form
   doesn't re-ask those — it attaches them automatically.
   ========================================================================= */

function ContributeView({ slug }) {
  const store = useStore();
  const auth = useAuth();
  if (!store.signedIn()) return <ContributeSignInGate auth={auth} />;
  if (!slug) return <ContributePicker />;
  return <ContributeForm slug={slug} />;
}

function ContributeSignInGate({ auth }) {
  const nav = useNav();
  useEffect(() => { auth.openSignIn(); }, []);
  return (
    <div className="cycle-signin">
      <div className="cycle-signin-card">
        <div className="lock-icon"><Icon name="lock" size={22} /></div>
        <h1>Sign in to contribute</h1>
        <p>Verify your Stanford SUNet first — it takes a few seconds and keeps every contribution anonymous. Then you can add your recruiting story and unlock everything.</p>
        <button className="google-btn" onClick={() => auth.openSignIn()}><GoogleG size={18} /><span>Sign in with Google</span></button>
        <button className="text-btn" style={{ marginTop: 12 }} onClick={() => nav.go({ name: "directory" })}>← Back to companies</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Company picker */
function ContributePicker() {
  const nav = useNav();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const list = IV.companies.filter((c) => !q || (`${c.name} ${c.industry}`).toLowerCase().includes(q.toLowerCase()));
  const pick = (s) => nav.go({ name: "contribute", slug: s });
  return (
    <main className="contribute">
      <button className="back-link" onClick={() => nav.back()}>
        <Icon name="arrow-left" size={13} /> Back
      </button>
      <header className="picker-header">
        <div className="picker-step">Step 1 of 2 · Choose a company</div>
        <h1>Which company is this about?</h1>
        <p className="lede">Pick where you recruited. Your story unlocks that company's cohort report and Community forum — and helps the next class.</p>
      </header>
      <div className="picker-search-wrap">
        <span className="hero-search-icon"><Icon name="search" size={16} /></span>
        <input className="picker-search" value={q} autoFocus placeholder="Search companies by name or industry…"
          onChange={(e) => setQ(e.target.value)} />
      </div>
      {list.length === 0 ? (
        <div className="picker-empty">
          <p>No company matches "{q}".</p>
          <button className="primary-btn" onClick={() => setAdding(true)}><Icon name="plus" size={13} /> Request "{q.trim()}"</button>
        </div>
      ) : (
        <section className="picker-grid">
          {list.map((c) => (
            <button key={c.slug} className="picker-tile" onClick={() => pick(c.slug)}>
              <Logo company={c} size={40} radius={9} />
              <div className="pt-info">
                <div className="pt-name">{c.name}</div>
                <div className="pt-meta">{c.industry} · {c.reports} report{c.reports === 1 ? "" : "s"}</div>
              </div>
              <Icon name="chevron-right" size={15} className="pt-go" />
            </button>
          ))}
        </section>
      )}
      <button className="picker-add" onClick={() => setAdding(true)}>
        <span className="add-tile-plus"><Icon name="plus" size={18} /></span>
        <div className="pt-info">
          <div className="pt-name">Request a new company</div>
          <div className="pt-meta">missing one? we'll verify &amp; add it</div>
        </div>
      </button>
      {adding && <AddCompanyModal onClose={() => setAdding(false)} />}
    </main>
  );
}

function gradToYear(g) {
  if (!g || g === "Already graduated") return "Senior";
  const y = parseInt(String(g).replace(/\D/g, ""), 10);
  return ({ 2025: "Senior", 2026: "Junior", 2027: "Sophomore", 2028: "Sophomore" })[y] || "Junior";
}

/* ---------------------------------------------------------- Contribution form */
function ContributeForm({ slug }) {
  const store = useStore();
  const nav = useNav();
  const toast = useToast();
  const auth = useAuth();
  const company = IV.getCompany(slug);
  const detail = IV.getDetail(slug);
  const pending = IV.isPending(slug);
  const profile = store.profile;

  const [role, setRole] = useState(detail.roles[0].name);
  const [customRole, setCustomRole] = useState("");
  const [cycle, setCycle] = useState("2025–26");
  const [platform, setPlatform] = useState("Company website");
  const [customPlatform, setCustomPlatform] = useState("");
  const [hadReferral, setHadReferral] = useState(false);
  const [referralSource, setReferralSource] = useState("");
  const [customReferral, setCustomReferral] = useState("");
  const [techRounds, setTechRounds] = useState(3);
  const [behavioralRounds, setBehavioralRounds] = useState(1);
  const [applied, setApplied] = useState("Sept 2025");
  const [offerMonth, setOfferMonth] = useState("Nov 2025");
  const [comp, setComp] = useState("$8–10k/mo · ~$96–120k/yr");
  const [advice, setAdvice] = useState("");

  const ROLES = [...detail.roles.map((r) => r.name), "+ Add a different role"];
  const finalRole = role === "+ Add a different role" ? (customRole.trim() || "Other role") : role;
  const finalPlatform = platform === "Other" ? (customPlatform.trim() || "Other") : platform;
  const finalReferral = !hadReferral ? "" : (referralSource === "Other" ? (customReferral.trim() || "Other") : referralSource);

  const doSubmit = () => {
    store.contribute({
      slug, role: finalRole, cycle, platform: finalPlatform,
      channel: hadReferral ? "Referral" : finalPlatform,
      hadReferral, referralSource: finalReferral,
      techRounds, behavioralRounds, rounds: techRounds + behavioralRounds,
      applied, offerMonth, comp,
      major: profile.major, year: gradToYear(profile.gradYear), gpa: profile.gpa,
      advice: advice.trim(), at: Date.now(),
    });
    fireConfetti();
    if (pending) {
      toast("Story submitted with your request — unlocked! +120 karma", { icon: "check", tone: "good", duration: 3600 });
      setTimeout(() => nav.go({ name: "contributions" }), 450);
    } else {
      toast("Unlocked! +120 karma · earned Verified + Storyteller", { icon: "check", tone: "good", duration: 3400 });
      setTimeout(() => nav.go({ name: "company", slug }), 450);
    }
  };
  const submit = () => {
    if (store.signedIn()) { doSubmit(); return; }
    auth.openSignIn({ onDone: () => setTimeout(doSubmit, 250) });
  };

  const Radio = ({ value, set, options }) => (
    <div className="radio-group">
      {options.map((o) => (
        <button type="button" key={o} className={"radio-chip" + (value === o ? " selected" : "")} onClick={() => set(o)}>{o}</button>
      ))}
    </div>
  );
  const Select = ({ value, set, options }) => (
    <div className="select-wrap">
      <select className="cinput" value={value} onChange={(e) => set(e.target.value)}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <Icon name="chevron-down" size={12} className="select-chev" />
    </div>
  );

  const profileLine = profile.set
    ? `${profile.major} · ${profile.gradYear === "Already graduated" ? "Alum" : "Class of " + profile.gradYear}${profile.gpa ? " · " + profile.gpa : ""}`
    : "set at sign-in";

  return (
    <main className="contribute">
      <button className="back-link" onClick={() => nav.go({ name: pending ? "contribute" : "company", slug: pending ? undefined : slug })}>
        <Icon name="arrow-left" size={13} /> {pending ? "Back" : "Back to " + company.name}
      </button>

      {pending && (
        <div className="pending-co-banner">
          <span className="pcb-icon"><Icon name="clock" size={15} /></span>
          <div className="pcb-text">
            <strong>{company.name} is pending review.</strong> Your story is submitted together with the request — it goes live the moment our team approves the company (usually &lt; 48h). You're unlocked right away.
          </div>
        </div>
      )}

      <header className="contribute-header">
        <Logo company={company} size={56} radius={12} />
        <div className="header-info">
          <h1>How did you get <span className="accent">{company.name}</span>?</h1>
          <p className="lede">Takes 90 seconds. All entries are aggregated and anonymous — your name is never attached. {pending ? "This is the first report for " + company.name + "." : "Submitting unlocks the " + company.name + " cohort report and Community Thread."}</p>
          <div className="header-meta">
            {store.signedIn()
              ? <span className="badge-verified"><Icon name="check-circle" size={12} /> {store.state.auth.email} · anonymous</span>
              : <span className="badge-unverified"><Icon name="lock" size={12} /> Verify your SUNet to submit</span>}
            <span className="badge-time"><Icon name="user" size={12} /> {profileLine}</span>
            {!pending && <button className="change-co" onClick={() => nav.go({ name: "contribute" })}>Change company</button>}
          </div>
        </div>
      </header>

      <div className="cform">
        <section className="form-section">
          <div className="csec-head"><h2>The role</h2></div>
          <div className="form-grid g3">
            <Field label="Role"><Select value={role} set={setRole} options={ROLES} /></Field>
            <Field label="Cycle"><Select value={cycle} set={setCycle} options={["2025–26", "2024–25", "2023–24", "2022–23"]} /></Field>
            <Field label={<span>Compensation <span className="opt">(monthly · yearly equiv.)</span></span>}><Select value={comp} set={setComp} options={["< $5k/mo · < $60k/yr", "$5–7k/mo · ~$60–84k/yr", "$7–8k/mo · ~$84–96k/yr", "$8–10k/mo · ~$96–120k/yr", "$10–12k/mo · ~$120–144k/yr", "$12–14k/mo · ~$144–168k/yr", "$14–16k/mo · ~$168–192k/yr", "$16k+/mo · $192k+/yr", "Prefer not to say"]} /></Field>
          </div>
          {role === "+ Add a different role" && (
            <div style={{ marginTop: 14 }}>
              <Field label={<span>New role title <span className="opt">we'll add it to {company.name}</span></span>} full>
                <input className="cinput" value={customRole} maxLength={48} autoFocus placeholder="e.g. Forward Deployed Engineer Intern" onChange={(e) => setCustomRole(e.target.value)} />
              </Field>
            </div>
          )}
        </section>

        <section className="form-section">
          <div className="csec-head"><h2>How you applied</h2></div>
          <Field label="What platform did you use to apply?" full>
            <Radio value={platform} set={setPlatform} options={["Company website", "Handshake", "LinkedIn", "Career fair", "Cold email", "Other"]} />
          </Field>
          {platform === "Other" && (
            <div style={{ marginTop: 12 }}>
              <Field label="Tell us where" full>
                <input className="cinput" value={customPlatform} maxLength={60} autoFocus placeholder="e.g. Hackathon portal, Discord server, university job board…" onChange={(e) => setCustomPlatform(e.target.value)} />
              </Field>
            </div>
          )}
          <div className="csec-head" style={{ marginTop: 20 }}><h3 className="csec-subhead">Referral</h3></div>
          <Field label="Did you have a referral?" full>
            <Radio value={hadReferral ? "Yes" : "No"} set={(v) => setHadReferral(v === "Yes")} options={["No", "Yes"]} />
          </Field>
          {hadReferral && (
            <div style={{ marginTop: 12 }}>
              <Field label="How did you get the referral?" full>
                <Radio value={referralSource} set={setReferralSource} options={["Stanford student club", "Coffee chat", "Cold email", "LinkedIn cold outreach", "Previous workplace", "Research lab", "Professor", "Friend", "Classmate", "Other"]} />
              </Field>
              {referralSource === "Other" && (
                <div style={{ marginTop: 12 }}>
                  <Field label="Tell us how" full>
                    <input className="cinput" value={customReferral} maxLength={60} autoFocus placeholder="e.g. family friend, hackathon teammate…" onChange={(e) => setCustomReferral(e.target.value)} />
                  </Field>
                </div>
              )}
            </div>
          )}
          <div className="csec-head" style={{ marginTop: 20 }}><h3 className="csec-subhead">Interview rounds</h3><span className="csec-meta">leave behavioral at 0 if not applicable</span></div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <Field label={<span>Technical rounds <span className="opt">(OA, coding, case)</span></span>}>
              <Stepper value={techRounds} set={setTechRounds} min={0} max={9} />
            </Field>
            <Field label={<span>Behavioral rounds <span className="opt">(fit, "why us")</span></span>}>
              <Stepper value={behavioralRounds} set={setBehavioralRounds} min={0} max={6} />
            </Field>
          </div>
          <div className="csec-head" style={{ marginTop: 20 }}><h3 className="csec-subhead">Timeline</h3><span className="csec-meta">when you applied → when you got the final offer</span></div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <Field label="Applied"><Select value={applied} set={setApplied} options={["Aug 2025", "Sept 2025", "Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026"]} /></Field>
            <Field label="Final offer received"><Select value={offerMonth} set={setOfferMonth} options={["Sept 2025", "Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026"]} /></Field>
          </div>
        </section>

        <section className="form-section">
          <div className="csec-head"><h2>What's not on your LinkedIn that helped you get this job?</h2><span className="csec-meta">Stanford-specific · appears in Advice</span></div>
          <p className="csec-sub">The real, unpolished stuff that actually moved the needle. A few things worth covering:</p>
          <ul className="advice-prompts">
            <li><strong>Resources you used to prepare</strong> — specific courses, books, problem sets, mock platforms</li>
            <li><strong>Networking tips</strong> — who you reached out to, what message worked, the alum/coffee chat that helped</li>
            <li><strong>Stanford-specific advice</strong> — clubs, classes, section leaders, research labs, professors</li>
            <li><strong>The make-or-break moment</strong> — the thing you'd never put on a resume</li>
          </ul>
          <textarea className="ctextarea" value={advice} onChange={(e) => setAdvice(e.target.value)}
            placeholder="A Sigma Nu alum at the company hopped on a call and walked me through their interview loop. CS 161 with that one section leader is the reason I cleared the algo round. I drilled NeetCode 150 + did 3 Pramp mocks. Honestly, the Stanford name on the resume got the recruiter to actually open it…" />
        </section>
      </div>

      <div className="form-footer">
        <p className="privacy-note">By submitting, your anonymized data appears in cohort reports for {company.name}{pending ? " once it's approved" : ""}. You can <a>edit or delete</a> anytime. <a>Privacy details</a>.</p>
        <button className="submit-btn" onClick={submit}>
          {!store.signedIn() ? "Verify SUNet & submit →" : pending ? "Submit story & request →" : "Submit & unlock →"}
        </button>
      </div>
    </main>
  );
}

function Field({ label, full, children }) {
  return (
    <div className={"field" + (full ? " full" : "")}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function Stepper({ value, set, min, max, step = 1 }) {
  return (
    <div className="stepper">
      <button onClick={() => set(Math.max(min, value - step))}>−</button>
      <input type="number" value={value} min={min} max={max}
        onChange={(e) => set(Math.max(min, Math.min(max, Number(e.target.value) || min)))} />
      <button onClick={() => set(Math.min(max, value + step))}>+</button>
    </div>
  );
}

Object.assign(window, { ContributeView, ContributeSignInGate, ContributePicker, ContributeForm, Field, Stepper, gradToYear });

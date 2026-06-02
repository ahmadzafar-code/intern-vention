/* =========================================================================
   Intern·vention — Authentication (Stanford SUNet via Google)
   Sign-in is identity verification; it is SEPARATE from unlocking data.
   You still must contribute a story to unlock (give-to-get).
   ========================================================================= */

const AuthCtx = createContext(null);
function useAuth() { return useContext(AuthCtx); }

function ProfSelect({ value, set, options }) {
  return (
    <div className="uname-field plain prof-field">
      <select className="prof-select" value={value} onChange={(e) => set(e.target.value)}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function GoogleG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const DEMO_ACCOUNTS = [
  { name: "Cardinal Student", email: "scardinal@stanford.edu", initials: "CS", color: "#8C1515", returning: false, note: "New here" },
  { name: "Leland Stanford Jr.", email: "ljunior@stanford.edu", initials: "LS", color: "#1F7A4D", returning: true, note: "Member since 2024 · 2 contributions on record" },
];

function SignInModal({ onClose, onDone }) {
  const store = useStore();
  const toast = useToast();
  const [step, setStep] = useState("intro"); // intro | choose | verifying | username | other
  const [acct, setAcct] = useState(null);
  const [uname, setUname] = useState("");
  const [degrees, setDegrees] = useState(["Bachelor's (B.S./B.A.)"]);
  const [bMajor, setBMajor] = useState("Computer Science");
  const [bMajor2, setBMajor2] = useState("None");
  const [bMinor, setBMinor] = useState("None");
  const [bGpa, setBGpa] = useState("3.7 – 3.9");
  const [bGrad, setBGrad] = useState("2026");
  const [mMajor, setMMajor] = useState("Management Science & Engineering");
  const [mGpa, setMGpa] = useState("Prefer not to say");
  const [mGrad, setMGrad] = useState("2026");
  const [ctMajor, setCtMajor] = useState("Computer Science");
  const [ctProgram, setCtProgram] = useState("Computer Science");
  const [ctGpa, setCtGpa] = useState("3.7 – 3.9");
  const [ctGrad, setCtGrad] = useState("2026");
  const [phdDept, setPhdDept] = useState("Computer Science");
  const [phdGrad, setPhdGrad] = useState("2029");
  const CUR_YEAR = 2026;
  const gradudatedYr = (y) => { const n = parseInt(y, 10); return Number.isFinite(n) && n < CUR_YEAR; };

  const SUGGESTED = ["anon_owl", "cardinal_jr", "the_grind_2027", "farm_recruiter"];
  const clean = uname.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const unameOk = clean.length >= 3 && clean.length <= 20;

  const choose = (a) => {
    setAcct(a);
    setStep("verifying");
    setTimeout(() => {
      if (a.returning) {
        store.signIn(a);
        toast("Welcome back — your contributions are on record", { icon: "check", tone: "good", duration: 3000 });
        onClose();
        onDone && onDone(a, true);
      } else {
        // new account → pick a username before finishing
        setStep("username");
      }
    }, 1100);
  };

  const finishNew = () => {
    if (!unameOk) return;
    setStep("profile");
  };
  const finishProfile = () => {
    const has = (d) => degrees.includes(d);
    const bachelors = has("Bachelor's (B.S./B.A.)") ? { major: bMajor, major2: bMajor2 !== "None" ? bMajor2 : "", minor: bMinor !== "None" ? bMinor : "", gpa: gradudatedYr(bGrad) ? "" : bGpa, gradYear: bGrad } : null;
    const masters = has("Master's (M.S./M.A.)") ? { major: mMajor, gpa: gradudatedYr(mGrad) ? "" : mGpa, gradYear: mGrad } : null;
    const coterm = has("Coterm (B.S. + M.S.)") ? { major: ctMajor, program: ctProgram, gpa: gradudatedYr(ctGrad) ? "" : ctGpa, gradYear: ctGrad } : null;
    const phd = has("PhD") ? { dept: phdDept, gradYear: phdGrad } : null;
    const primary = phd || coterm || masters || bachelors || {};
    const major = (bachelors && bachelors.major) || (coterm && coterm.major) || (masters && masters.major) || (phd && phd.dept) || "";
    const gradYear = [bachelors, coterm, masters, phd].filter(Boolean).map((d) => d.gradYear).sort().slice(-1)[0] || "";
    const gpa = (bachelors && bachelors.gpa) || (coterm && coterm.gpa) || (masters && masters.gpa) || "";
    store.signIn({ ...acct, username: clean });
    store.setProfile({ degrees, bachelors, coterm, masters, phd, major, gradYear, gpa });
    toast("Welcome, u/" + clean + " — contribute a story to unlock", { icon: "check-circle" });
    onClose();
    onDone && onDone(acct, false);
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="signin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn signin-x" onClick={onClose}><Icon name="x" size={18} /></button>

        {step === "intro" && (
          <div className="signin-body">
            <div className="signin-brand">Intern<span className="dot">·</span>vention</div>
            <h3 className="signin-title">Sign in to join the conversation</h3>
            <p className="signin-sub">Verify it's you with your Stanford <strong>SUNet</strong> account. We confirm you're a Stanford student — then everything you post stays <strong>anonymous</strong>. Your name is never shown.</p>
            <button className="google-btn" onClick={() => setStep("choose")}>
              <GoogleG size={18} /><span>Sign in with Google</span>
            </button>
            <div className="signin-edu-note"><Icon name="lock" size={12} /> Only <code>@stanford.edu</code> accounts can join</div>
            <p className="signin-legal">By continuing you agree to the anonymity pledge: contribute honestly, never doxx, pay it forward.</p>
          </div>
        )}

        {step === "choose" && (
          <div className="signin-body">
            <div className="chooser-head">
              <GoogleG size={20} /><span>Choose an account</span>
            </div>
            <div className="chooser-sub">to continue to <strong>Intern·vention</strong></div>
            <div className="account-list">
              {DEMO_ACCOUNTS.map((a) => (
                <button key={a.email} className="account-row" onClick={() => choose(a)}>
                  <span className="account-av" style={{ background: a.color }}>{a.initials}</span>
                  <span className="account-text">
                    <span className="account-name">{a.name}</span>
                    <span className="account-email">{a.email}</span>
                    <span className="account-note">{a.note}</span>
                  </span>
                </button>
              ))}
              <button className="account-row other" onClick={() => setStep("other")}>
                <span className="account-av ghost"><Icon name="user" size={18} /></span>
                <span className="account-text"><span className="account-name">Use another account</span></span>
              </button>
            </div>
          </div>
        )}

        {step === "username" && (
          <div className="signin-body">
            <div className="uname-check"><Icon name="check-circle" size={15} /> SUNet verified · {acct.email}</div>
            <h3 className="signin-title">Pick your anonymous handle</h3>
            <p className="signin-sub">This is how you'll show up across Intern·vention. Your real name stays private — choose something that isn't identifying.</p>
            <div className="uname-field">
              <span className="uname-prefix">u/</span>
              <input className="uname-input" value={uname} autoFocus maxLength={20} placeholder="choose a username"
                onChange={(e) => setUname(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") finishNew(); }} />
            </div>
            <div className="uname-hint">{clean.length > 0 && !unameOk ? "3–20 characters · letters, numbers, underscores" : "Letters, numbers, and underscores only"}</div>
            <div className="uname-suggest">
              {SUGGESTED.map((s) => (
                <button key={s} className="uname-chip" onClick={() => setUname(s)}>u/{s}</button>
              ))}
            </div>
            <button className={"google-btn solid" + (unameOk ? "" : " disabled")} onClick={finishNew}>Claim u/{clean || "…"}</button>
          </div>
        )}

        {step === "profile" && (
          <div className="signin-body profile-body">
            <div className="uname-check"><Icon name="check-circle" size={15} /> u/{clean}</div>
            <h3 className="signin-title">Set up your profile</h3>
            <p className="signin-sub">Anonymous and bucketed. Pick the Stanford degree(s) you've pursued — we'll ask the right details for each.</p>

            <label className="prof-label">Your Stanford degree(s)</label>
            <div className="deg-chips">
              {IV.DEGREE_LEVELS.map((d) => {
                const on = degrees.includes(d);
                return <button key={d} type="button" className={"deg-chip" + (on ? " on" : "")}
                  onClick={() => setDegrees(on ? degrees.filter((x) => x !== d) : [...degrees, d])}>
                  {on && <Icon name="check" size={11} />}{d}</button>;
              })}
            </div>

            {degrees.includes("Bachelor's (B.S./B.A.)") && (
              <div className="deg-block">
                <div className="deg-block-title">Bachelor's</div>
                <label className="prof-label">Primary major</label>
                <ProfSelect value={bMajor} set={setBMajor} options={IV.STANFORD_MAJORS} />
                <label className="prof-label">Second major <span className="opt">if double major</span></label>
                <ProfSelect value={bMajor2} set={setBMajor2} options={["None", ...IV.STANFORD_MAJORS]} />
                <label className="prof-label">Minor <span className="opt">optional</span></label>
                <ProfSelect value={bMinor} set={setBMinor} options={IV.STANFORD_MINORS} />
                <div className="deg-row">
                  <div><label className="prof-label">Graduating class</label><ProfSelect value={bGrad} set={setBGrad} options={IV.GRAD_CLASS_YEARS} /></div>
                  {!gradudatedYr(bGrad)
                    ? <div><label className="prof-label">GPA bucket</label><ProfSelect value={bGpa} set={setBGpa} options={IV.GPA_BUCKETS} /></div>
                    : <div className="deg-grad-note"><Icon name="check-circle" size={13} /> Graduated — no GPA needed</div>}
                </div>
              </div>
            )}

            {degrees.includes("Coterm (B.S. + M.S.)") && (
              <div className="deg-block">
                <div className="deg-block-title">Coterm (B.S. + M.S.)</div>
                <label className="prof-label">Undergrad major</label>
                <ProfSelect value={ctMajor} set={setCtMajor} options={IV.STANFORD_MAJORS} />
                <label className="prof-label">Coterm program</label>
                <ProfSelect value={ctProgram} set={setCtProgram} options={IV.STANFORD_MAJORS} />
                <div className="deg-row">
                  <div><label className="prof-label">Graduating class</label><ProfSelect value={ctGrad} set={setCtGrad} options={IV.GRAD_CLASS_YEARS} /></div>
                  {!gradudatedYr(ctGrad)
                    ? <div><label className="prof-label">GPA bucket</label><ProfSelect value={ctGpa} set={setCtGpa} options={IV.GPA_BUCKETS} /></div>
                    : <div className="deg-grad-note"><Icon name="check-circle" size={13} /> Graduated — no GPA needed</div>}
                </div>
              </div>
            )}

            {degrees.includes("Master's (M.S./M.A.)") && (
              <div className="deg-block">
                <div className="deg-block-title">Master's</div>
                <label className="prof-label">Program / major</label>
                <ProfSelect value={mMajor} set={setMMajor} options={IV.STANFORD_MAJORS} />
                <div className="deg-row">
                  <div><label className="prof-label">Graduating class</label><ProfSelect value={mGrad} set={setMGrad} options={IV.GRAD_CLASS_YEARS} /></div>
                  {!gradudatedYr(mGrad)
                    ? <div><label className="prof-label">GPA bucket <span className="opt">optional</span></label><ProfSelect value={mGpa} set={setMGpa} options={IV.GPA_BUCKETS} /></div>
                    : <div className="deg-grad-note"><Icon name="check-circle" size={13} /> Graduated — no GPA needed</div>}
                </div>
              </div>
            )}

            {degrees.includes("PhD") && (
              <div className="deg-block">
                <div className="deg-block-title">PhD</div>
                <label className="prof-label">Department</label>
                <ProfSelect value={phdDept} set={setPhdDept} options={IV.STANFORD_MAJORS} />
                <label className="prof-label">Graduating class</label>
                <ProfSelect value={phdGrad} set={setPhdGrad} options={IV.GRAD_CLASS_YEARS} />
              </div>
            )}

            <button className={"google-btn solid" + (degrees.length ? "" : " disabled")} onClick={() => degrees.length && finishProfile()} style={{ marginTop: 18 }}>Finish &amp; explore →</button>
          </div>
        )}

        {step === "other" && (
          <div className="signin-body">
            <div className="chooser-head"><GoogleG size={20} /><span>Use another account</span></div>
            <div className="signin-reject">
              <div className="reject-icon"><Icon name="lock" size={20} /></div>
              <p>Intern·vention is <strong>Stanford-only</strong>. Sign in with an <code>@stanford.edu</code> SUNet account to continue.</p>
              <button className="text-btn" onClick={() => setStep("choose")}>← Back to accounts</button>
            </div>
          </div>
        )}

        {step === "verifying" && (
          <div className="signin-body verifying">
            <div className="verify-spinner" />
            <div className="verify-acct">
              <span className="account-av" style={{ background: acct.color }}>{acct.initials}</span>
              <span>{acct.email}</span>
            </div>
            <p className="verify-text">Verifying your SUNet identity…</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthProvider({ children }) {
  const [open, setOpen] = useState(false);
  const doneRef = useRef(null);
  const openSignIn = useCallback((opts = {}) => {
    doneRef.current = opts.onDone || null;
    setOpen(true);
  }, []);
  const close = () => setOpen(false);
  const api = useMemo(() => ({ openSignIn }), [openSignIn]);
  return (
    <AuthCtx.Provider value={api}>
      {children}
      {open && <SignInModal onClose={close} onDone={(a, u) => { const f = doneRef.current; doneRef.current = null; f && f(a, u); }} />}
    </AuthCtx.Provider>
  );
}

Object.assign(window, { AuthCtx, useAuth, AuthProvider, SignInModal, GoogleG, DEMO_ACCOUNTS });

/* =========================================================================
   Intern·vention — My Contributions (your profile / footprint)
   A Levels.fyi-style advice platform: this page shows what YOU have given
   back — your recruiting stories, your karma & badges, and your posts/replies.
   Requires sign-in (it's your account).
   ========================================================================= */

function timeAgo(ts) {
  if (!ts) return "";
  const d = Math.round((Date.now() - ts) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return d + "d ago";
  if (d < 365) return Math.round(d / 30) + "mo ago";
  return Math.round(d / 365) + "y ago";
}

/* ---------------------------------------------------------- Contribution card */
function ContributionCard({ c, onDelete }) {
  const nav = useNav();
  const store = useStore();
  const [editing, setEditing] = useState(false);
  const [eRole, setERole] = useState(c.role);
  const [eAdvice, setEAdvice] = useState(c.advice || "");
  const company = IV.getCompany(c.slug);
  const req = store.requestForSlug ? store.requestForSlug(c.slug) : null;
  const pendingReq = req && req.status === "pending";
  const rejectedReq = req && req.status === "rejected";
  const factorLabels = (c.factors || []).map((k) => {
    const f = IV.factors.find((x) => x.key === k);
    return f ? f.label : k;
  });
  const saveEdit = () => { store.editContribution(c.at, { role: eRole.trim() || c.role, advice: eAdvice.trim() }); setEditing(false); };

  if (editing) {
    const roleOpts = [...new Set([...IV.getDetail(c.slug).roles.map((r) => r.name), c.role])];
    return (
      <div className="contrib-card editing">
        <div className="contrib-head">
          <Logo company={company} size={38} radius={9} />
          <div className="contrib-id"><div className="contrib-co">{company.name}</div></div>
        </div>
        <label className="edit-label">Role</label>
        <div className="select-wrap"><select className="cinput" value={eRole} onChange={(e) => setERole(e.target.value)}>{roleOpts.map((r) => <option key={r}>{r}</option>)}</select><Icon name="chevron-down" size={12} className="select-chev" /></div>
        <label className="edit-label">What's not on your LinkedIn that helped</label>
        <textarea className="ctextarea" value={eAdvice} maxLength={500} onChange={(e) => setEAdvice(e.target.value)} placeholder="The real, unpolished advice…" />
        <div className="contrib-foot">
          <button className="link-btn" onClick={saveEdit}>Save changes</button>
          <button className="link-btn danger" onClick={() => { setERole(c.role); setEAdvice(c.advice || ""); setEditing(false); }}>Cancel</button>
        </div>
      </div>
    );
  }
  return (
    <div className={"contrib-card" + (pendingReq ? " is-pending" : "")}>
      <div className="contrib-head">
        <Logo company={company} size={38} radius={9} />
        <div className="contrib-id">
          <div className="contrib-co">{company.name}
            {pendingReq && <span className="contrib-pill amber"><Icon name="clock" size={10} /> Pending review</span>}
            {rejectedReq && <span className="contrib-pill slate"><Icon name="x" size={10} /> Not approved</span>}
          </div>
          <div className="contrib-role">{c.role}{c.cycle ? " · " + c.cycle : ""}</div>
        </div>
        <span className="contrib-when">{timeAgo(c.at)}</span>
      </div>
      {c.advice
        ? <p className="contrib-advice">“{c.advice}”</p>
        : <p className="contrib-advice muted">No written advice — just the data points.</p>}
      {factorLabels.length > 0 && (
        <div className="contrib-factors">
          {factorLabels.map((l, i) => <span className="cf-chip" key={i}><span className="cf-rank">{i + 1}</span>{l}</span>)}
        </div>
      )}
      <div className="contrib-foot">
        {pendingReq
          ? <span className="contrib-foot-note">Goes live when {company.name} is approved</span>
          : rejectedReq
            ? <span className="contrib-foot-note">Company wasn't approved — move this to an existing company</span>
            : <button className="link-btn" onClick={() => nav.go({ name: "company", slug: c.slug })}>View cohort report →</button>}
        <span className="contrib-foot-actions">
          <button className="link-btn" onClick={() => { setERole(c.role); setEAdvice(c.advice || ""); setEditing(true); }}>Edit</button>
          <button className="link-btn danger" onClick={() => onDelete(c)}>Delete</button>
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Activity rows */
function ActivityPost({ scope, post }) {
  const nav = useNav();
  return (
    <button className="activity-row" onClick={() => nav.go({ name: "thread", scope, postId: post.id })}>
      <Flair kind={post.flair} />
      <span className="activity-title">{post.title}</span>
      <span className="activity-meta">
        <span className={"scope-chip k-" + IV.scopeKind(scope)}>{IV.scopeLabel(scope)}</span>
        <span className="dotsep">·</span>{post.votes} {post.votes === 1 ? "upvote" : "upvotes"}
      </span>
    </button>
  );
}
function ActivityComment({ c }) {
  const nav = useNav();
  const canLink = c.scope && c.postId;
  return (
    <button className="activity-row comment" onClick={() => canLink && nav.go({ name: "thread", scope: c.scope, postId: c.postId })} disabled={!canLink}>
      <Icon name="comment" size={13} className="ac-icon" />
      <span className="activity-body">“{c.body}”</span>
      {c.postTitle && <span className="activity-on">on “{c.postTitle.length > 40 ? c.postTitle.slice(0, 40) + "…" : c.postTitle}”</span>}
    </button>
  );
}

/* ---------------------------------------------------------- Main view */
function MyContributionsView() {
  const store = useStore();
  const nav = useNav();
  const auth = useAuth();
  const toast = useToast();

  if (!store.signedIn()) {
    return (
      <div className="cycle-signin">
        <div className="cycle-signin-card">
          <div className="lock-icon"><Icon name="user" size={22} /></div>
          <h1>Your contributions live here</h1>
          <p>Sign in with your SUNet to see your recruiting stories, your karma and badges, and everything you've shared with the community.</p>
          <button className="google-btn" onClick={() => auth.openSignIn()}><GoogleG size={18} /><span>Sign in with Google</span></button>
        </div>
      </div>
    );
  }

  const acct = store.state.auth;
  const initials = acct.name ? acct.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "YOU";
  const contributions = store.state.contributions;
  const karma = store.myKarma();
  const badges = store.myBadges();
  const { tier } = tierFor(karma);

  const posts = [];
  Object.keys(store.state.userPosts).forEach((scope) => store.state.userPosts[scope].forEach((p) => posts.push({ scope, post: p })));
  const comments = [];
  Object.keys(store.state.userComments).forEach((pid) => store.state.userComments[pid].forEach((c) => comments.push(c)));

  const del = (c) => {
    store.removeContribution(c.at);
    toast("Contribution deleted", { icon: "x" });
  };

  return (
    <main className="contrib-page">
      <header className="profile-card">
        <div className="profile-av">{initials}</div>
        <div className="profile-id">
          <div className="profile-name">{acct.name} <BadgePill id="senior" size="sm" /></div>
          <div className="profile-email">{acct.email} · posts as <strong>u/{store.username()}</strong></div>
          <div className="profile-badges">
            {badges.length ? badges.map((b) => <BadgePill key={b} id={b} size="sm" />) : <span className="profile-nobadge">No badges yet — contribute to earn your first.</span>}
          </div>
        </div>
        <div className="profile-karma">
          <div className="pk-num"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.8.7-5 4.6 1.4 6.7L12 17.8 5.9 20.3 7.3 13.6l-5-4.6 6.8-.7z" /></svg> {karma.toLocaleString("en-US")}</div>
          <div className="pk-tier">{tier.name} · Mentor Points</div>
        </div>
      </header>

      <VisibilitySettings />

      {store.profileStale && store.profileStale() && (
        <div className="profile-confirm">
          <span className="pc-icon"><Icon name="user" size={15} /></span>
          <div className="pc-text"><strong>Still {store.profile.gradYear === "Already graduated" ? "an alum" : "Class of " + store.profile.gradYear}?</strong> It's a new year — confirm your profile is current so your contributions stay accurate.</div>
          <button className="pc-btn" onClick={() => { store.confirmProfile(); toast("Profile confirmed for this year", { icon: "check", tone: "good" }); }}>Confirm</button>
        </div>
      )}

      <div className="contrib-stats">
        <div className="cstat"><div className="cstat-val">{contributions.length}</div><div className="cstat-label">Contributions</div><div className="cstat-sub">recruiting stories</div></div>
        <div className="cstat"><div className="cstat-val">{posts.length}</div><div className="cstat-label">Posts</div><div className="cstat-sub">started discussions</div></div>
        <div className="cstat"><div className="cstat-val">{comments.length}</div><div className="cstat-label">Replies</div><div className="cstat-sub">helped someone</div></div>
        <div className="cstat"><div className="cstat-val">{IV.fmtK(karma)}</div><div className="cstat-label">Mentor Points</div><div className="cstat-sub">{tier.name}</div></div>
      </div>

      <div className="section-head contrib-section-head">
        <h2>Your recruiting stories</h2>
        <button className="primary-btn sm" onClick={() => nav.go({ name: "contribute" })}><Icon name="plus" size={13} /> Add a story</button>
      </div>

      {contributions.length === 0 ? (
        <div className="contrib-empty">
          <div className="lock-icon"><Icon name="lock" size={20} /></div>
          <h3>You haven't contributed yet</h3>
          <p>Share one recruiting story — a past internship or offer — to unlock the full cohort reports and community, and start building karma.</p>
          <button className="primary-btn" onClick={() => nav.go({ name: "contribute" })}>Contribute your first story →</button>
        </div>
      ) : (
        <div className="contrib-grid">
          {contributions.map((c) => <ContributionCard key={c.at} c={c} onDelete={del} />)}
        </div>
      )}

      {(posts.length > 0 || comments.length > 0) && (
        <React.Fragment>
          <div className="section-head"><h2>Your community footprint</h2><span className="meta">posts &amp; replies you've shared</span></div>
          {posts.length > 0 && (
            <div className="activity-block">
              <div className="activity-label">Posts</div>
              {posts.map(({ scope, post }) => <ActivityPost key={post.id} scope={scope} post={post} />)}
            </div>
          )}
          {comments.length > 0 && (
            <div className="activity-block">
              <div className="activity-label">Replies</div>
              {comments.map((c) => <ActivityComment key={c.id} c={c} />)}
            </div>
          )}
        </React.Fragment>
      )}

      <CompanyRequests />
    </main>
  );
}

/* ---------------------------------------------------------- Visibility opt-in */
function VisibilitySettings() {
  const store = useStore();
  const vis = store.visibility;
  const flairs = store.flairs || [];
  const opts = store.flairOptions();
  const uname = store.username();
  const Toggle = ({ on, onClick }) => (
    <button className={"vis-toggle" + (on ? " on" : "")} onClick={onClick} role="switch" aria-checked={on}><span className="vt-knob" /></button>
  );
  const FlairChip = ({ value, label, company }) => {
    const on = flairs.includes(value);
    const fl = IV.flairLabel(value);
    return (
      <button className={"fpb-chip flair-" + fl.type + (on ? " on" : "")} onClick={() => store.toggleFlair(value)}>
        {company && <Logo company={company} size={18} radius={4} />}
        <span>{label}</span>
        {on && <Icon name="check" size={12} />}
      </button>
    );
  };
  return (
    <div className="vis-settings">
      <div className="vis-head">
        <div>
          <h3>Identity &amp; flairs</h3>
          <p>You post as <strong>u/{uname}</strong>. Anonymous by default — optionally show your real name, and add flairs for where you've worked, your major, and your class.</p>
        </div>
        <div className="vis-preview">
          <span className="vis-preview-label">Appears as</span>
          <span className="vis-preview-name">
            {vis.name ? store.state.auth.name : "u/" + uname}
            {flairs.map((f) => { const fl = IV.flairLabel(f); return <span key={f} className={"ex-flair flair-" + fl.type}>{fl.label}</span>; })}
          </span>
        </div>
      </div>
      <div className="vis-rows">
        <div className="vis-row">
          <div className="vis-row-text"><strong>Show my name</strong><span>Display "{store.state.auth.name}" instead of u/{uname}</span></div>
          <Toggle on={vis.name} onClick={() => store.setVisibility({ name: !vis.name })} />
        </div>
      </div>
      <div className="flair-picker-block">
        <div className="fpb-group">
          <div className="fpb-label">Company <span className="opt">from companies you've contributed to</span></div>
          {opts.companies.length === 0
            ? <p className="fpb-empty">Contribute a recruiting story and that company becomes available.</p>
            : <div className="fpb-chips">{opts.companies.map((o) => <FlairChip key={o.value} value={o.value} label={o.label} company={o.company} />)}</div>}
        </div>
        <div className="fpb-group">
          <div className="fpb-label">Major</div>
          {opts.majors.length === 0
            ? <p className="fpb-empty">Your major appears here once you've contributed a story.</p>
            : <div className="fpb-chips">{opts.majors.map((o) => <FlairChip key={o.value} value={o.value} label={o.label} />)}</div>}
        </div>
        <div className="fpb-group">
          <div className="fpb-label">Graduating class</div>
          <div className="fpb-chips">{opts.years.map((o) => <FlairChip key={o.value} value={o.value} label={o.label} />)}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Company requests */
const REQ_STATUS = {
  pending:  { label: "Pending review", tone: "amber", icon: "clock" },
  approved: { label: "Approved · live", tone: "green", icon: "check-circle" },
  rejected: { label: "Not approved", tone: "slate", icon: "x" },
};
function CompanyRequests() {
  const store = useStore();
  const nav = useNav();
  const toast = useToast();
  const reqs = store.companyRequests();
  if (!reqs.length) return null;
  return (
    <React.Fragment>
      <div className="section-head" style={{ marginTop: 34 }}>
        <h2>Your company requests</h2>
        <span className="meta">new companies are verified before going live</span>
      </div>
      <div className="req-list">
        {reqs.map((r) => {
          const st = REQ_STATUS[r.status] || REQ_STATUS.pending;
          return (
            <div className="req-row" key={r.id}>
              <span className="req-mono" style={{ background: r.bg }}>{r.name[0].toUpperCase()}</span>
              <div className="req-info">
                <div className="req-name">{r.name} <span className="req-ind">{r.industry}</span></div>
                <div className="req-sub">{r.website || r.domain} · requested {timeAgo(r.at)}</div>
              </div>
              <span className={"req-status tone-" + st.tone}><Icon name={st.icon} size={12} /> {st.label}</span>
              {r.status === "approved" && (
                <button className="link-btn" onClick={() => nav.go({ name: "company", slug: r.slug })}>Open →</button>
              )}
              {r.status === "pending" && (
                <div className="req-demo">
                  <span className="req-demo-label">demo:</span>
                  <button className="req-approve" onClick={() => { store.reviewCompanyRequest(r.id, "approved"); toast(`${r.name} approved & added`, { icon: "check", tone: "good" }); }}>Approve</button>
                  <button className="req-reject" onClick={() => { store.reviewCompanyRequest(r.id, "rejected"); toast("Request rejected", { icon: "x" }); }}>Reject</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="req-foot-note">In production, our team reviews each request to prevent duplicates and verify the company is real — like Levels.fyi. The demo buttons let you play the reviewer.</p>
    </React.Fragment>
  );
}

Object.assign(window, { MyContributionsView, ContributionCard, ActivityPost, ActivityComment, CompanyRequests, VisibilitySettings, timeAgo });

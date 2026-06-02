/* =========================================================================
   Intern·vention — Alerts (notifications feed)
   Social/advice-platform notifications: replies, awards, karma, badges,
   and activity in companies you follow. Requires sign-in.
   ========================================================================= */

const ALERT_META = {
  reply:      { icon: "comment",  tone: "blue" },
  award:      { icon: "star",     tone: "amber" },
  upvote:     { icon: "trend-up", tone: "cardinal" },
  newpost:    { icon: "fire",     tone: "cardinal" },
  newcontrib: { icon: "user",     tone: "green" },
  badge:      { icon: "sparkle",  tone: "purple" },
  tier:       { icon: "star",     tone: "purple" },
  mention:    { icon: "comment",  tone: "blue" },
};

function alertGroup(ts) {
  const d = (Date.now() - ts) / 86400000;
  if (d < 1) return "Today";
  if (d < 7) return "This week";
  return "Earlier";
}

function AlertRow({ a, onClick }) {
  const meta = ALERT_META[a.type] || { icon: "bell", tone: "slate" };
  return (
    <button className={"alert-row" + (a.read ? "" : " unread")} onClick={() => onClick(a)}>
      {!a.read && <span className="alert-dot" />}
      <span className={"alert-icon tone-" + meta.tone}><Icon name={meta.icon} size={15} /></span>
      <span className="alert-main">
        <span className="alert-title">
          {a.actor && <strong>u/{a.actor} </strong>}{a.title}
        </span>
        {a.body && <span className="alert-body">{a.body}</span>}
        <span className="alert-time">{IV_timeAgo(a.ts)}</span>
      </span>
      <Icon name="chevron-right" size={15} className="alert-go" />
    </button>
  );
}
function IV_timeAgo(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 60) return m + "m ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.round(h / 24);
  return d + "d ago";
}

function AlertsView() {
  const store = useStore();
  const nav = useNav();
  const auth = useAuth();
  const [filter, setFilter] = useState("all");

  if (!store.signedIn()) {
    return (
      <div className="cycle-signin">
        <div className="cycle-signin-card">
          <div className="lock-icon"><Icon name="bell" size={22} /></div>
          <h1>Never miss a reply</h1>
          <p>Sign in to get notified when someone replies to you, awards your advice, or posts in a company you follow.</p>
          <button className="google-btn" onClick={() => auth.openSignIn()}><GoogleG size={18} /><span>Sign in with Google</span></button>
        </div>
      </div>
    );
  }

  const all = store.alerts();
  const shown = filter === "unread" ? all.filter((a) => !a.read) : all;
  const unread = all.filter((a) => !a.read).length;

  const open = (a) => {
    store.markAlertRead(a.id);
    if (a.postId) nav.go({ name: "thread", scope: a.scope, postId: a.postId });
    else if (a.scope) nav.go({ name: "community", scope: a.scope });
    else if (a.slug) nav.go({ name: "company", slug: a.slug });
    else if (a.type === "badge" || a.type === "tier") nav.go({ name: "contributions" });
  };

  // group in display order
  const groups = ["Today", "This week", "Earlier"];
  const byGroup = {};
  shown.forEach((a) => { const g = alertGroup(a.ts); (byGroup[g] = byGroup[g] || []).push(a); });

  return (
    <main className="alerts-page">
      <header className="alerts-header">
        <div>
          <h1>Alerts</h1>
          <p className="alerts-sub">{unread > 0 ? `${unread} unread` : "You're all caught up"}</p>
        </div>
        {unread > 0 && <button className="link-btn" onClick={() => store.markAllAlertsRead()}>Mark all read</button>}
      </header>

      <div className="alerts-filters">
        <button className={"sort-tab" + (filter === "all" ? " active" : "")} onClick={() => setFilter("all")}>All</button>
        <button className={"sort-tab" + (filter === "unread" ? " active" : "")} onClick={() => setFilter("unread")}>Unread {unread > 0 && <span className="filter-count">{unread}</span>}</button>
      </div>

      {shown.length === 0 ? (
        <div className="alerts-empty">
          <div className="alerts-empty-icon"><Icon name="check-circle" size={22} /></div>
          <p>{filter === "unread" ? "No unread alerts — you're all caught up." : "No alerts yet. Post, reply, and contribute to start getting notified."}</p>
        </div>
      ) : (
        groups.filter((g) => byGroup[g]).map((g) => (
          <div className="alert-group" key={g}>
            <div className="alert-group-label">{g}</div>
            <div className="alert-list">
              {byGroup[g].map((a) => <AlertRow key={a.id} a={a} onClick={open} />)}
            </div>
          </div>
        ))
      )}

      <div className="alerts-prefs">
        <div className="prefs-title">What you'll be notified about</div>
        <div className="prefs-grid">
          {[
            ["comment", "Replies to your posts & comments"],
            ["star", "Awards & karma milestones"],
            ["fire", "New posts in companies you follow"],
            ["sparkle", "Badges you earn"],
          ].map(([ic, label]) => (
            <div className="pref-item" key={label}><Icon name={ic} size={14} /><span>{label}</span><span className="pref-on">On</span></div>
          ))}
        </div>
      </div>
    </main>
  );
}

Object.assign(window, { AlertsView, AlertRow, ALERT_META });

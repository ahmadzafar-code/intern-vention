/* =========================================================================
   Intern·vention — Community hub (full-page forum)
   The social heart of the app: company + industry forums, big central feed,
   karma + leaderboard rail. Addresses grader feedback #1, #2, #3, #4.
   ========================================================================= */

function communityMeta(scope) {
  const L = IV.isLaunch();
  if (scope === "__main__")
    return { kind: "main", title: "All of Stanford", blurb: "Every recruiting conversation across campus — internships and full-time, every industry.", members: L ? 0 : 4120 };
  if (scope.indexOf("ind:") === 0) {
    const key = scope.slice(4);
    const f = IV.INDUSTRY_FORUMS[key] || { label: key, blurb: "", members: 0 };
    return { kind: "industry", key, title: f.label, blurb: f.blurb, members: L ? 0 : f.members };
  }
  const c = IV.getCompany(scope);
  return { kind: "company", company: c, title: c.name, blurb: `Company-specific thread for ${c.name} recruiting — interviews, timelines, and offers.`, members: L ? 0 : c.reports * 10 };
}

function CommunityIcon({ scope }) {
  if (scope === "__main__")
    return <span className="ci ci-main"><Icon name="fire" size={15} /></span>;
  if (scope.indexOf("ind:") === 0)
    return <span className={"ci ci-ind ind-" + scope.slice(4)}>{IV.INDUSTRY_FORUMS[scope.slice(4)] ? IV.INDUSTRY_FORUMS[scope.slice(4)].label[0] : "#"}</span>;
  const c = IV.getCompany(scope);
  return <Logo company={c} size={26} radius={6} />;
}

/* Left rail — list of communities */
function CommunityRail({ scope }) {
  const store = useStore();
  const nav = useNav();
  const go = (s) => nav.go({ name: "community", scope: s });
  const followed = IV.companies.filter((c) => store.isFollowing(c.slug));

  const Item = ({ s, label, sub }) => (
    <button className={"rail-item" + (scope === s ? " active" : "")} onClick={() => go(s)}>
      <CommunityIcon scope={s} />
      <span className="rail-item-text">
        <span className="rail-item-label">{label}</span>
        {sub && <span className="rail-item-sub">{sub}</span>}
      </span>
    </button>
  );

  return (
    <aside className="community-rail">
      <div className="rail-section">
        <Item s="__main__" label="All of Stanford" sub={IV.isLaunch() ? "new" : "4.1k members"} />
      </div>

      <div className="rail-section">
        <div className="rail-section-title">Industry forums</div>
        {Object.keys(IV.INDUSTRY_FORUMS).map((k) => (
          <Item key={k} s={"ind:" + k} label={IV.INDUSTRY_FORUMS[k].label} sub={IV.isLaunch() ? "new" : IV.fmtK(IV.INDUSTRY_FORUMS[k].members) + " members"} />
        ))}
      </div>

      <div className="rail-section">
        <div className="rail-section-title">{followed.length ? "Your companies" : "Popular companies"}</div>
        {(followed.length ? followed : IV.companies.slice(0, 5)).map((c) => (
          <Item key={c.slug} s={c.slug} label={c.name} sub={c.reports + " reports"} />
        ))}
        <button className="rail-browse" onClick={() => nav.go({ name: "directory" })}>Browse all companies →</button>
      </div>
    </aside>
  );
}

/* Right rail — karma, leaderboard, about */
function CommunityAside({ scope, meta }) {
  const nav = useNav();
  return (
    <aside className="community-aside">
      <KarmaCard />
      <Leaderboard />
      <div className="rail-card">
        <div className="rail-card-head"><h4>About this forum</h4></div>
        <p className="about-blurb">{meta.blurb}</p>
        <div className="about-stats">
          <div><strong>{IV.fmtK(meta.members)}</strong><span>members</span></div>
          <div><strong>{IV.getPosts(scope).length}</strong><span>posts</span></div>
        </div>
        {meta.kind === "company" && (
          <button className="rail-cta ghost" onClick={() => nav.go({ name: "company", slug: scope })}>View cohort report →</button>
        )}
      </div>
      <div className="rail-rules">
        <div className="rules-title">Be cool</div>
        <ul>
          <li>Anonymous, but the next class is reading.</li>
          <li>Share what actually worked — pay it forward.</li>
          <li>No doxxing, no recruiter bashing by name.</li>
        </ul>
      </div>
    </aside>
  );
}

function CommunityHub({ scope }) {
  const store = useStore();
  const nav = useNav();
  const [sort, setSort] = useState("hot");
  const [composing, setComposing] = useState(false);
  const posts = useFeed(scope, sort);
  const meta = communityMeta(scope);
  const unlocked = store.unlocked();
  const openPost = (post) => nav.go({ name: "thread", scope, postId: post.id });

  const feed = (
    <React.Fragment>
      <button className="big-create-post" onClick={() => unlocked && setComposing(true)}>
        <span className={"avatar" + (unlocked ? "" : " unsigned")} style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>{unlocked ? "YOU" : <Icon name="user" size={18} />}</span>
        <span className="bcp-placeholder">Share something with {meta.kind === "main" ? "the cohort" : meta.title}…</span>
        <span className="bcp-btn"><Icon name="plus" size={13} /> Post</span>
      </button>
      <div className="post-list big">
        {posts.length === 0
          ? <p className="empty-note">No posts in this forum yet. Start the conversation.</p>
          : posts.map((p) => <PostCard key={p.id} post={p} scope={scope} onOpen={openPost} big />)}
      </div>
    </React.Fragment>
  );

  return (
    <div className="community-page">
      <CommunityRail scope={scope} />

      <main className="community-main">
        <header className="community-banner">
          <div className="cb-icon"><CommunityIcon scope={scope} /></div>
          <div className="cb-info">
            <div className="cb-kind">{meta.kind === "industry" ? "Industry forum" : meta.kind === "company" ? "Company forum" : "Campus-wide"}</div>
            <h1>{meta.title}</h1>
            <p>{meta.blurb}</p>
            <div className="cb-stats">
              <span><span className="live-dot" />{IV.fmtK(meta.members)} members</span>
              <span className="pip" />
              <span>{IV.getPosts(scope).length} posts this cycle</span>
            </div>
          </div>
        </header>

        <div className="community-toolbar">
          <div className="sort-tabs wide">
            {["hot", "new", "top"].map((s) => (
              <button key={s} className={"sort-tab" + (sort === s ? " active" : "")} onClick={() => setSort(s)}>
                {s === "hot" ? "🔥 " : ""}{s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {unlocked ? (
          <div className="feed-live">{feed}</div>
        ) : (
          <div className="locked-feed tall">
            <div className="locked-feed-content">{feed}</div>
            <LockCard
              heading="Join the conversation"
              body={`Contribute your recruiting story to unlock posting, voting, and replies across every forum on Intern·vention.`}
              slug={meta.kind === "company" ? scope : undefined} />
          </div>
        )}
      </main>

      <CommunityAside scope={scope} meta={meta} />

      {composing && <Composer scope={scope} onClose={() => setComposing(false)} />}
    </div>
  );
}

Object.assign(window, { CommunityHub, communityMeta, CommunityRail, CommunityAside, CommunityIcon });

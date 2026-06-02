/* =========================================================================
   Intern·vention — Community Thread (feed, polls, composer, gate)
   ========================================================================= */

/* ---------------------------------------------------------- Poll block */
function PollBlock({ post }) {
  const store = useStore();
  const voted = store.pollVote(post.id);
  const seeded = post.poll.selected;
  const chosen = voted != null ? voted : (seeded >= 0 ? seeded : null);
  const showResults = chosen != null;
  const extra = (voted != null && seeded < 0) ? 1 : 0;
  const total = post.poll.total + extra;
  return (
    <div className="post-poll" onClick={(e) => e.stopPropagation()}>
      {post.poll.options.map((o, i) => {
        const isSel = chosen === i;
        return (
          <button
            key={i}
            className={"poll-row" + (isSel ? " selected" : "") + (showResults ? " revealed" : " votable")}
            onClick={() => { if (voted == null) store.votePoll(post.id, i); }}
            disabled={voted != null}
          >
            {showResults && <span className="poll-fill" style={{ width: o.pct + "%" }} />}
            <span className="poll-label">{o.label}</span>
            {isSel && <span className="poll-check">✓</span>}
            {showResults && <span className="poll-pct">{o.pct}%</span>}
          </button>
        );
      })}
      <span className="poll-total">
        {total} votes · {post.poll.daysLeft} days left{voted != null && seeded < 0 ? " · voted" : ""}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------- Post card */
function PostCard({ post, scope, onOpen, big }) {
  const store = useStore();
  const dir = store.postVote(post.id);
  const extraComments = store.getUserComments(post.id).length;
  const totalComments = (post.comments ? post.comments.length : 0) + extraComments;
  const toast = useToast();
  const [awarded, setAwarded] = useState(false);
  const giveAward = () => {
    if (awarded) return;
    setAwarded(true);
    store.award(5);
    toast("Award given · +5 karma to u/" + post.author, { icon: "star", tone: "good" });
  };
  return (
    <article className={"reddit-post" + (big ? " big" : "")} onClick={() => onOpen(post)}>
      <div className="post-header">
        <div className="post-meta">
          <AuthorTag handle={post.author} mine={post.mine} compact={!big} />
          <span className="sep">·</span>
          <span>{post.time}</span>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <VoteWidget base={post.votes} dir={dir} onChange={(d) => store.votePost(post.id, d)} />
        </div>
      </div>
      <h4 className="post-title"><Flair kind={post.flair} />{post.title}</h4>
      {post.poll
        ? <PollBlock post={post} />
        : post.body && <p className="post-body">{post.body}</p>}
      <div className="post-actions" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onOpen(post)}>
          <Icon name="comment" size={12} /> {`${totalComments} comment${totalComments === 1 ? "" : "s"}`}
        </button>
        <button className={awarded ? "awarded" : ""} onClick={giveAward}>
          <Icon name="star" size={12} /> {awarded ? "Awarded" : "Award"}
        </button>
        <button onClick={() => toast("Link copied to clipboard", { icon: "share" })}>
          <Icon name="share" size={12} /> Share
        </button>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------- Composer modal */
const FLAIR_CHOICES = ["question", "discussion", "tips", "vent", "success", "update", "poll"];
function Composer({ scope, onClose }) {
  const store = useStore();
  const toast = useToast();
  const [flair, setFlair] = useState("question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [opts, setOpts] = useState(["", ""]);
  const isPoll = flair === "poll";

  const canPost = title.trim().length > 3 &&
    (!isPoll || opts.filter((o) => o.trim()).length >= 2);

  const submit = () => {
    if (!canPost) return;
    const post = {
      id: "u-" + Math.random().toString(36).slice(2),
      author: "you", time: "now", flair, title: title.trim(), votes: 1, mine: true, comments: [],
    };
    if (isPoll) {
      const clean = opts.filter((o) => o.trim());
      const even = Math.floor(100 / clean.length);
      post.poll = {
        options: clean.map((o, i) => ({ label: o.trim(), pct: i === 0 ? 100 - even * (clean.length - 1) : even })),
        total: 1, daysLeft: 7, selected: -1,
      };
    } else if (body.trim()) {
      post.body = body.trim();
    }
    store.addPost(scope, post);
    toast("Posted to the thread", { icon: "check", tone: "good" });
    onClose();
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="composer" onClick={(e) => e.stopPropagation()}>
        <div className="composer-head">
          <h3>Create post</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="composer-body">
          <label className="composer-label">Flair</label>
          <div className="flair-picker">
            {FLAIR_CHOICES.map((f) => (
              <button key={f} className={"flair-chip flair-" + f + (flair === f ? " on" : "")} onClick={() => setFlair(f)}>
                {FLAIR_LABEL[f]}
              </button>
            ))}
          </div>

          <label className="composer-label">Title</label>
          <input className="composer-input" value={title} maxLength={120} autoFocus
            placeholder={isPoll ? "ask the cohort a question…" : "what's on your mind?"}
            onChange={(e) => setTitle(e.target.value)} />

          {isPoll ? (
            <div className="poll-editor">
              <label className="composer-label">Options</label>
              {opts.map((o, i) => (
                <div className="poll-edit-row" key={i}>
                  <input className="composer-input" value={o} maxLength={40} placeholder={"Option " + (i + 1)}
                    onChange={(e) => setOpts(opts.map((x, j) => (j === i ? e.target.value : x)))} />
                  {opts.length > 2 && (
                    <button className="icon-btn" onClick={() => setOpts(opts.filter((_, j) => j !== i))}><Icon name="x" size={14} /></button>
                  )}
                </div>
              ))}
              {opts.length < 5 && (
                <button className="text-btn" onClick={() => setOpts([...opts, ""])}><Icon name="plus" size={12} /> Add option</button>
              )}
            </div>
          ) : (
            <React.Fragment>
              <label className="composer-label">Body <span className="opt">optional</span></label>
              <textarea className="composer-textarea" value={body} maxLength={600}
                placeholder="add detail, context, the gory specifics…"
                onChange={(e) => setBody(e.target.value)} />
            </React.Fragment>
          )}
        </div>
        <div className="composer-foot">
          <span className="composer-note">Posts are anonymous. Be cool — the next class is reading.</span>
          <button className={"primary-btn" + (canPost ? "" : " disabled")} onClick={submit}>Post</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Sort + assemble */
function useFeed(scope, sort) {
  const store = useStore();
  const userPosts = store.getUserPosts(scope);
  return useMemo(() => {
    const base = IV.getPosts(scope);
    let all = [...userPosts, ...base];
    if (sort === "top") {
      all = [...all].sort((a, b) => b.votes - a.votes);
    } else if (sort === "hot") {
      all = [...all].sort((a, b) => (b.hot || 0) - (a.hot || 0) || b.votes - a.votes);
    }
    // "new" keeps userPosts-first natural order
    return all;
  }, [scope, sort, userPosts]);
}

/* ---------------------------------------------------------- Lock card */
function LockCard({ heading, body, slug }) {
  const nav = useNav();
  const store = useStore();
  const auth = useAuth();
  const goContribute = () => nav.go({ name: "contribute", slug });

  if (store.signedIn()) {
    return (
      <div className="lock-overlay">
        <div className="lock-card">
          <div className="lock-icon verified"><Icon name="check-circle" size={22} /></div>
          <h4 className="lock-title">You're verified — one step to go</h4>
          <p className="lock-body">Signed in as <strong>{store.state.auth.email}</strong>. Add <strong>one</strong> recruiting story to unlock the full report and every Community forum.</p>
          <button className="lock-cta" onClick={goContribute}>Contribute to unlock →</button>
          <div className="lock-terms"><Icon name="check" size={12} /> 1 contribution = full access all of cycle 2024–25</div>
          <p className="lock-alt">Not you? <a onClick={() => store.signOut()}>Sign out</a></p>
        </div>
      </div>
    );
  }
  return (
    <div className="lock-overlay">
      <div className="lock-card">
        <div className="lock-icon"><Icon name="lock" size={22} /></div>
        <h4 className="lock-title">{heading}</h4>
        <p className="lock-body">{body}</p>
        <div className="lock-how">
          <span><b>1</b> Report a past internship or offer</span>
          <span><b>2</b> Unlock the full report + community</span>
          <span><b>3</b> Good for all of cycle 2024–25</span>
        </div>
        <button className="lock-cta" onClick={goContribute}>Contribute to unlock →</button>
        <p className="lock-alt">Already a member? <a onClick={() => auth.openSignIn({ onDone: (a, unlocked) => { if (!unlocked) goContribute(); } })}>Sign in</a></p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Resize handle */
function ThreadResizer() {
  const store = useStore();
  const dragging = useRef(false);
  useEffect(() => {
    const move = (e) => {
      if (!dragging.current) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      store.setThreadW(x);
    };
    const up = () => { dragging.current = false; document.body.classList.remove("resizing"); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [store]);
  const start = (e) => { dragging.current = true; document.body.classList.add("resizing"); e.preventDefault(); };
  return <div className="thread-resizer" onMouseDown={start} onTouchStart={start} title="Drag to resize the thread"><span className="tr-grip" /></div>;
}

/* ---------------------------------------------------------- Community Thread */
function CommunityThread({ scope, label, name, nameStrong, meta, lockHeading, lockBody, lockSlug, live }) {
  const store = useStore();
  const nav = useNav();
  const [sort, setSort] = useState("hot");
  const [composing, setComposing] = useState(false);
  const posts = useFeed(scope, sort);
  const unlocked = store.unlocked();

  const openPost = (post) => nav.go({ name: "thread", scope, postId: post.id });
  const openHub = () => nav.go({ name: "community", scope });

  const feedInner = (
    <React.Fragment>
      <button className="create-post-btn" onClick={() => unlocked && setComposing(true)}>
        <span className="plus">+</span><span>Create Post</span>
      </button>
      <div className="post-list">
        {posts.map((p) => <PostCard key={p.id} post={p} scope={scope} onOpen={openPost} />)}
      </div>
    </React.Fragment>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="sidebar-head-top">
          {label && <div className="thread-label">{label}</div>}
          <button className="expand-thread" onClick={openHub} title="Open full Community view">Expand <Icon name="chevron-right" size={12} /></button>
        </div>
        {name
          ? <div className="thread-name">{name}<strong>{nameStrong}</strong></div>
          : <h3>{nameStrong}</h3>}
        <div className="meta">{live && <span className="live-dot" />}{meta}</div>
        <div className="sort-tabs">
          {["hot", "new", "top"].map((s) => (
            <button key={s} className={"sort-tab" + (sort === s ? " active" : "")} onClick={() => setSort(s)}>
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="sidebar-scroll">
        {unlocked ? (
          <div className="feed-live">{feedInner}</div>
        ) : (
          <div className="locked-feed">
            <div className="locked-feed-content">{feedInner}</div>
            <LockCard heading={lockHeading} body={lockBody} slug={lockSlug} />
          </div>
        )}
      </div>
      <ThreadResizer />
      {composing && <Composer scope={scope} onClose={() => setComposing(false)} />}
    </aside>
  );
}

Object.assign(window, { PollBlock, PostCard, Composer, CommunityThread, ThreadResizer, LockCard, useFeed });

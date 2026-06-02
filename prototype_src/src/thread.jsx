/* =========================================================================
   Intern·vention — Post detail + comment thread
   Supports nested replies, and edit/delete of your own posts & comments.
   ========================================================================= */

/* ---------------------------------------------------------- inline composer */
function InlineComposer({ placeholder, onSubmit, onCancel, initial, cta }) {
  const [val, setVal] = useState(initial || "");
  const ref = useRef(null);
  useEffect(() => { if (ref.current) { ref.current.focus(); ref.current.setSelectionRange(val.length, val.length); } }, []);
  const ok = val.trim().length >= 2;
  return (
    <div className="inline-composer">
      <textarea ref={ref} value={val} maxLength={500} placeholder={placeholder}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && ok) onSubmit(val.trim()); if (e.key === "Escape") onCancel(); }} />
      <div className="ic-foot">
        <span className="ic-hint">⌘↵ to submit · Esc to cancel</span>
        <div className="ic-btns">
          <button className="ghost-btn sm" onClick={onCancel}>Cancel</button>
          <button className={"primary-btn sm" + (ok ? "" : " disabled")} onClick={() => ok && onSubmit(val.trim())}>{cta || "Reply"}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- comment node */
function CommentNode({ c, postId, depth }) {
  const store = useStore();
  const toast = useToast();
  const dir = store.commentVote(c.id);
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const mine = c.author === "you";
  const replies = store.getReplies(c.id);

  const doReply = (body) => {
    store.addReply(c.id, {
      id: "ur-" + Math.random().toString(36).slice(2),
      author: "you", time: "now", body, votes: 1, scope: c.scope, postId, mine: true,
    });
    setReplying(false);
    toast("Reply posted", { icon: "check", tone: "good" });
  };
  const doEdit = (body) => { store.editComment(postId, c.id, body); setEditing(false); toast("Comment updated", { icon: "check" }); };
  const doDelete = () => { store.deleteComment(postId, c.id); toast("Comment deleted", { icon: "x" }); };

  return (
    <div className={"comment" + (depth > 0 ? " reply" : "")}>
      <div className="comment-rail" />
      <div className="comment-main">
        <div className="comment-meta">
          <AuthorTag handle={c.author} mine={mine} compact />
          <span className="sep">·</span>
          <span>{c.time}</span>
          {c.edited && <span className="edited-tag">edited</span>}
        </div>
        {editing
          ? <InlineComposer initial={c.body} placeholder="Edit your comment…" cta="Save"
              onSubmit={doEdit} onCancel={() => setEditing(false)} />
          : <p className="comment-body">{c.body}</p>}
        {!editing && (
          <div className="comment-actions">
            <button className={"cvote" + (dir === 1 ? " up" : "")} onClick={() => store.voteComment(c.id, 1)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 10h-5v6h-6v-6H4z" /></svg>
            </button>
            <span className={"cvote-count" + (dir === 1 ? " up" : dir === -1 ? " down" : "")}>{c.votes + dir}</span>
            <button className={"cvote" + (dir === -1 ? " down" : "")} onClick={() => store.voteComment(c.id, -1)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l-8-10h5V4h6v6h5z" /></svg>
            </button>
            <button className="creply" onClick={() => setReplying(!replying)}>Reply</button>
            {mine && <React.Fragment>
              <button className="creply" onClick={() => setEditing(true)}>Edit</button>
              <button className="creply danger" onClick={doDelete}>Delete</button>
            </React.Fragment>}
          </div>
        )}
        {replying && <InlineComposer placeholder={"Reply to u/" + c.author + "…"} onSubmit={doReply} onCancel={() => setReplying(false)} />}
        {replies.map((r) => <CommentNode key={r.id} c={r} postId={postId} depth={depth + 1} />)}
        {c.replies && c.replies.map((r) => <CommentNode key={r.id} c={r} postId={postId} depth={depth + 1} />)}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- post detail */
function PostDetailView({ scope, postId }) {
  const store = useStore();
  const nav = useNav();
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [editingPost, setEditingPost] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const post = useMemo(() => {
    const all = [...store.getUserPosts(scope), ...IV.getPosts(scope)];
    return all.find((p) => p.id === postId);
  }, [scope, postId, store.state.userPosts]);

  if (!post) {
    return (
      <div className="thread-page">
        <button className="back-link" onClick={() => nav.back()}><Icon name="arrow-left" size={13} /> Back</button>
        <div className="deleted-note"><Icon name="check-circle" size={18} /><p>This post was deleted.</p></div>
      </div>
    );
  }

  const dir = store.postVote(post.id);
  const userComments = store.getUserComments(post.id);
  const comments = [...userComments, ...(post.comments || [])];
  const mine = post.mine;

  const backLabel = scope === "__main__" ? "Main Community Thread" : IV.scopeKind(scope) === "industry" ? IV.scopeLabel(scope) : "iv.stanford/" + IV.getCompany(scope).name;
  const submit = () => {
    if (draft.trim().length < 2) return;
    store.addComment(post.id, {
      id: "uc-" + Math.random().toString(36).slice(2),
      author: "you", time: "now", body: draft.trim(), votes: 1, scope, postId: post.id, postTitle: post.title,
    });
    setDraft("");
    toast("Comment added", { icon: "check", tone: "good" });
  };
  const doEditPost = (body) => { store.editPost(scope, post.id, { body }); setEditingPost(false); toast("Post updated", { icon: "check" }); };
  const doDeletePost = () => { store.deletePost(scope, post.id); toast("Post deleted", { icon: "x" }); nav.back(); };

  return (
    <div className="thread-page">
      <button className="back-link" onClick={() => nav.back()}>
        <Icon name="arrow-left" size={13} /> Back to {backLabel}
      </button>

      <article className="thread-post">
        <div className="thread-post-head">
          <div className="post-meta">
            <AuthorTag handle={post.author} mine={post.mine} />
            <span className="sep">·</span><span>{post.time}</span>
            {post.edited && <span className="edited-tag">edited</span>}
          </div>
          <div className="thread-head-right">
            <VoteWidget base={post.votes} dir={dir} onChange={(d) => store.votePost(post.id, d)} />
            {mine && (
              <div className="post-menu-wrap" ref={menuRef}>
                <button className="post-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Post options">⋯</button>
                {menuOpen && (
                  <div className="post-menu">
                    {!post.poll && <button onClick={() => { setEditingPost(true); setMenuOpen(false); }}><Icon name="copy" size={13} /> Edit post</button>}
                    <button className="danger" onClick={() => { setMenuOpen(false); doDeletePost(); }}><Icon name="x" size={13} /> Delete post</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <h1 className="thread-title"><Flair kind={post.flair} />{post.title}</h1>
        {post.poll ? <PollBlock post={post} />
          : editingPost
            ? <InlineComposer initial={post.body || ""} placeholder="Edit your post…" cta="Save" onSubmit={doEditPost} onCancel={() => setEditingPost(false)} />
            : post.body && <p className="thread-body">{post.body}</p>}
        <div className="thread-stats">
          <span><Icon name="comment" size={13} /> {`${comments.length} comment${comments.length === 1 ? "" : "s"}`}</span>
          <button onClick={() => toast("Link copied to clipboard", { icon: "share" })}><Icon name="share" size={13} /> Share</button>
        </div>
      </article>

      <div className="comment-composer">
        <Avatar text="YOU" size={32} />
        <div className="cc-field">
          <textarea value={draft} placeholder="Add a comment — anonymously" maxLength={500}
            onChange={(e) => setDraft(e.target.value)} />
          <div className="cc-foot">
            <span className="cc-note">Posting as <strong>u/{store.username()}</strong></span>
            <button className={"primary-btn sm" + (draft.trim().length < 2 ? " disabled" : "")} onClick={submit}>
              Comment
            </button>
          </div>
        </div>
      </div>

      <div className="comment-list">
        {comments.length === 0
          ? <p className="empty-note">No comments yet. Be the first — someone in the next class needs this.</p>
          : comments.map((c) => <CommentNode key={c.id} c={c} postId={post.id} depth={0} />)}
      </div>
    </div>
  );
}

Object.assign(window, { CommentNode, PostDetailView, InlineComposer });

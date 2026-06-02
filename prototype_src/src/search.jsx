/* =========================================================================
   Intern·vention — Search command palette (⌘K)
   Unified search over companies, industry forums, and posts.
   ========================================================================= */

function CommandPalette({ onClose }) {
  const nav = useNav();
  const store = useStore();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  const res = useMemo(() => IV.search(q), [q]);

  // build a flat list of selectable rows for keyboard nav
  const rows = useMemo(() => {
    const r = [];
    res.companies.forEach((c) => r.push({ kind: "company", c }));
    res.forums.forEach((f) => r.push({ kind: "forum", f }));
    res.posts.forEach((p) => r.push({ kind: "post", p }));
    return r;
  }, [res]);

  useEffect(() => { setSel(0); }, [q]);

  const go = (row) => {
    if (!row) return;
    if (row.kind === "company") nav.go({ name: "company", slug: row.c.slug });
    else if (row.kind === "forum") nav.go({ name: "community", scope: "ind:" + row.f.key });
    else if (row.kind === "post") {
      if (store.unlocked()) nav.go({ name: "thread", scope: row.p.scope, postId: row.p.post.id });
      else nav.go({ name: "community", scope: row.p.scope });
    }
    onClose();
  };

  const onKey = (e) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(rows.length - 1, s + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    if (e.key === "Enter") { e.preventDefault(); go(rows[sel]); }
  };

  let idx = -1;
  const rowProps = (row) => {
    idx++;
    const i = idx;
    return {
      className: "cmd-row" + (sel === i ? " active" : ""),
      onMouseEnter: () => setSel(i),
      onClick: () => go(row),
    };
  };

  const empty = q.trim() && rows.length === 0;

  return (
    <div className="cmd-scrim" onClick={onClose}>
      <div className="cmd-palette" onClick={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <div className="cmd-input-row">
          <Icon name="search" size={18} className="cmd-search-icon" />
          <input ref={inputRef} className="cmd-input" value={q} placeholder="Search companies, forums, and posts…"
            onChange={(e) => setQ(e.target.value)} />
          <kbd className="cmd-esc">esc</kbd>
        </div>

        <div className="cmd-results">
          {!q.trim() && (
            <div className="cmd-hint-block">
              <div className="cmd-section-label">Quick links</div>
              <button className="cmd-row" onClick={() => { nav.go({ name: "directory" }); onClose(); }}>
                <span className="cmd-ic"><Icon name="search" size={15} /></span><span className="cmd-label">Browse all companies</span>
              </button>
              <button className="cmd-row" onClick={() => { nav.go({ name: "community", scope: "__main__" }); onClose(); }}>
                <span className="cmd-ic"><Icon name="fire" size={15} /></span><span className="cmd-label">Community — All of Stanford</span>
              </button>
              <button className="cmd-row" onClick={() => { nav.go({ name: "contribute" }); onClose(); }}>
                <span className="cmd-ic"><Icon name="plus" size={15} /></span><span className="cmd-label">Contribute a recruiting story</span>
              </button>
            </div>
          )}

          {empty && <div className="cmd-empty">No results for “{q}”. Try a company, role, or keyword.</div>}

          {res.companies.length > 0 && (
            <div className="cmd-group">
              <div className="cmd-section-label">Companies</div>
              {res.companies.map((c) => (
                <button key={c.slug} {...rowProps({ kind: "company", c })}>
                  <Logo company={c} size={26} radius={6} />
                  <span className="cmd-label">{c.name}</span>
                  <span className="cmd-tail">{c.reports} report{c.reports === 1 ? "" : "s"}</span>
                </button>
              ))}
            </div>
          )}

          {res.forums.length > 0 && (
            <div className="cmd-group">
              <div className="cmd-section-label">Industry forums</div>
              {res.forums.map((f) => (
                <button key={f.key} {...rowProps({ kind: "forum", f })}>
                  <span className={"cmd-ic ci-ind ind-" + f.key}>{f.label[0]}</span>
                  <span className="cmd-label">{f.label}</span>
                  <span className="cmd-tail">Forum</span>
                </button>
              ))}
            </div>
          )}

          {res.posts.length > 0 && (
            <div className="cmd-group">
              <div className="cmd-section-label">Posts</div>
              {res.posts.map((p) => (
                <button key={p.post.id + p.scope} {...rowProps({ kind: "post", p })}>
                  <span className="cmd-ic"><Icon name="comment" size={15} /></span>
                  <span className="cmd-label">{p.post.title}</span>
                  <span className={"scope-chip k-" + IV.scopeKind(p.scope)}>{IV.scopeLabel(p.scope)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="cmd-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CommandPalette });

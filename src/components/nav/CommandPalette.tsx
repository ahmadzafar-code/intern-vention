"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { SearchResults } from "@/lib/queries/search";
import { Logo } from "@/components/primitives/Logo";
import { Icon } from "@/components/primitives/Icon";

const Ctx = createContext<{ open: () => void } | null>(null);
export function useCommandPalette() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCommandPalette must be used within <CommandPaletteProvider>");
  return c;
}

const EMPTY: SearchResults = { companies: [], forums: [], posts: [] };

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const api = useMemo(() => ({ open: () => setOpen(true) }), []);
  return (
    <Ctx.Provider value={api}>
      {children}
      {open && <Palette onClose={() => setOpen(false)} />}
    </Ctx.Provider>
  );
}

type Row = { kind: "company"; c: SearchResults["companies"][number] } | { kind: "forum"; f: SearchResults["forums"][number] } | { kind: "post"; p: SearchResults["posts"][number] };

function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<SearchResults>(EMPTY);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced fetch. setState happens in the async callback (not synchronously in the
  // effect body), so empty queries are handled in render rather than by resetting state.
  useEffect(() => {
    const query = q.trim();
    if (!query) return;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (r.ok) {
          setRes(await r.json());
          setSel(0);
        }
      } catch {
        /* ignore */
      }
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  const hasQuery = q.trim().length > 0;
  const rows = useMemo<Row[]>(() => {
    if (!hasQuery) return [];
    return [
      ...res.companies.map((c) => ({ kind: "company", c }) as Row),
      ...res.forums.map((f) => ({ kind: "forum", f }) as Row),
      ...res.posts.map((p) => ({ kind: "post", p }) as Row),
    ];
  }, [res, hasQuery]);

  const go = (row: Row | undefined) => {
    if (!row) return;
    if (row.kind === "company") router.push(`/company/${row.c.slug}`);
    else if (row.kind === "forum") router.push(`/community/${encodeURIComponent("ind:" + row.f.key)}`);
    else router.push(`/thread/${encodeURIComponent(row.p.scope)}/${row.p.id}`); // posts only appear when unlocked
    onClose();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(rows.length - 1, s + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    if (e.key === "Enter") { e.preventDefault(); go(rows[Math.min(sel, rows.length - 1)]); }
  };

  const active = Math.min(sel, Math.max(0, rows.length - 1));
  let idx = -1;
  const rowCls = () => {
    idx++;
    const i = idx;
    return { className: "cmd-row" + (active === i ? " active" : ""), onMouseEnter: () => setSel(i) };
  };
  const empty = hasQuery && rows.length === 0;

  return (
    <div className="cmd-scrim" onClick={onClose}>
      <div className="cmd-palette" onClick={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <div className="cmd-input-row">
          <Icon name="search" size={18} className="cmd-search-icon" />
          <input ref={inputRef} className="cmd-input" value={q} placeholder="Search companies, forums, and posts…" onChange={(e) => setQ(e.target.value)} />
          <kbd className="cmd-esc">esc</kbd>
        </div>

        <div className="cmd-results">
          {!hasQuery && (
            <div className="cmd-hint-block">
              <div className="cmd-section-label">Quick links</div>
              <button className="cmd-row" onClick={() => { router.push("/"); onClose(); }}>
                <span className="cmd-ic"><Icon name="search" size={15} /></span>
                <span className="cmd-label">Browse all companies</span>
              </button>
              <button className="cmd-row" onClick={() => { router.push("/community/__main__"); onClose(); }}>
                <span className="cmd-ic"><Icon name="fire" size={15} /></span>
                <span className="cmd-label">Community — All of Stanford</span>
              </button>
              <button className="cmd-row" onClick={() => { router.push("/contribute"); onClose(); }}>
                <span className="cmd-ic"><Icon name="plus" size={15} /></span>
                <span className="cmd-label">Contribute a recruiting story</span>
              </button>
            </div>
          )}

          {empty && <div className="cmd-empty">No results for &ldquo;{q}&rdquo;. Try a company, role, or keyword.</div>}

          {res.companies.length > 0 && hasQuery && (
            <div className="cmd-group">
              <div className="cmd-section-label">Companies</div>
              {res.companies.map((c) => (
                <button key={c.slug} {...rowCls()} onClick={() => go({ kind: "company", c })}>
                  <Logo company={c} size={26} radius={6} />
                  <span className="cmd-label">{c.name}</span>
                  <span className="cmd-tail">{c.reports} report{c.reports === 1 ? "" : "s"}</span>
                </button>
              ))}
            </div>
          )}

          {res.forums.length > 0 && hasQuery && (
            <div className="cmd-group">
              <div className="cmd-section-label">Industry forums</div>
              {res.forums.map((f) => (
                <button key={f.key} {...rowCls()} onClick={() => go({ kind: "forum", f })}>
                  <span className={"cmd-ic ci-ind ind-" + f.key}>{f.label[0]}</span>
                  <span className="cmd-label">{f.label}</span>
                  <span className="cmd-tail">Forum</span>
                </button>
              ))}
            </div>
          )}

          {res.posts.length > 0 && hasQuery && (
            <div className="cmd-group">
              <div className="cmd-section-label">Posts</div>
              {res.posts.map((p) => (
                <button key={p.id} {...rowCls()} onClick={() => go({ kind: "post", p })}>
                  <span className="cmd-ic"><Icon name="comment" size={15} /></span>
                  <span className="cmd-label">{p.title}</span>
                  <span className={"scope-chip k-" + p.scopeKind}>{p.scopeLabel}</span>
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

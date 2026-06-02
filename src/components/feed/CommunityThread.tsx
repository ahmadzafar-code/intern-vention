"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FeedPost } from "@/lib/queries/feed";
import { PostCard } from "./PostCard";
import { Composer } from "./Composer";
import { LockCard } from "@/components/company/LockCard";
import { Icon } from "@/components/primitives/Icon";

// The persistent left-rail Community Thread (the prototype's two-column .layout). Lives on
// the directory (scope __main__) and every company page (scope = slug). Posts are fetched
// server-side and passed in; locked users get a decorative placeholder (no real posts).
export function CommunityThread({
  scope,
  label,
  name,
  nameStrong,
  meta,
  lockHeading,
  lockBody,
  lockSlug,
  posts,
  unlocked,
  live,
}: {
  scope: string;
  label?: string;
  name?: string;
  nameStrong: string;
  meta: string;
  lockHeading: string;
  lockBody: string;
  lockSlug?: string;
  posts: FeedPost[];
  unlocked: boolean;
  live?: boolean;
}) {
  const router = useRouter();
  const [sort, setSort] = useState<"hot" | "new" | "top">("hot");
  const [composing, setComposing] = useState(false);
  const sorted = sort === "top" ? [...posts].sort((a, b) => b.base + b.myVote - (a.base + a.myVote)) : posts;

  const feedInner = (
    <>
      <button className="create-post-btn" onClick={() => setComposing(true)}>
        <span className="plus">+</span>
        <span>Create Post</span>
      </button>
      <div className="post-list">
        {sorted.length === 0 ? (
          <p className="empty-note">No posts yet. Start the conversation.</p>
        ) : (
          sorted.map((p) => <PostCard key={p.id} post={p} scope={scope} />)
        )}
      </div>
    </>
  );

  const placeholder = (
    <div className="post-list" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <article className="reddit-post" key={i}>
          <div className="post-header"><div className="post-meta"><span className="poster">u/—</span></div></div>
          <h4 className="post-title">Locked — contribute to read the thread</h4>
          <p className="post-body">······ ········· ······ ········</p>
        </article>
      ))}
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="sidebar-head-top">
          {label && <div className="thread-label">{label}</div>}
          <button className="expand-thread" onClick={() => router.push(`/community/${encodeURIComponent(scope)}`)} title="Open full Community view">
            Expand <Icon name="chevron-right" size={12} />
          </button>
        </div>
        {name ? (
          <div className="thread-name">{name}<strong>{nameStrong}</strong></div>
        ) : (
          <h3>{nameStrong}</h3>
        )}
        <div className="meta">{live && <span className="live-dot" />}{meta}</div>
        <div className="sort-tabs">
          {(["hot", "new", "top"] as const).map((s) => (
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
            <div className="locked-feed-content">{placeholder}</div>
            <LockCard heading={lockHeading} body={lockBody} slug={lockSlug} />
          </div>
        )}
      </div>
      {composing && <Composer scope={scope} onClose={() => setComposing(false)} />}
    </aside>
  );
}

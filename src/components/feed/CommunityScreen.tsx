"use client";
import { useState } from "react";
import Link from "next/link";
import type { FeedPost } from "@/lib/queries/feed";
import { PostCard } from "./PostCard";
import { Composer } from "./Composer";
import { LockCard } from "@/components/company/LockCard";
import { Icon } from "@/components/primitives/Icon";
import { INDUSTRIES } from "@/lib/constants";

type Meta = { kind: string; title: string; blurb: string };

export function CommunityScreen({ scope, posts, unlocked, meta }: { scope: string; posts: FeedPost[]; unlocked: boolean; meta: Meta }) {
  const [composing, setComposing] = useState(false);

  const feed = (
    <>
      <button className="big-create-post" onClick={() => unlocked && setComposing(true)}>
        <span className="avatar" style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>YOU</span>
        <span className="bcp-placeholder">Share something with {meta.kind === "main" ? "the cohort" : meta.title}…</span>
        <span className="bcp-btn"><Icon name="plus" size={13} /> Post</span>
      </button>
      <div className="post-list big">
        {posts.length === 0 ? (
          <p className="empty-note">No posts in this forum yet. Start the conversation.</p>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} scope={scope} big />)
        )}
      </div>
    </>
  );

  // Locked: no real posts were fetched (no gated-content leak) — show a decorative blur.
  const placeholder = (
    <div className="post-list big" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <article className="reddit-post big" key={i}>
          <div className="post-header"><div className="post-meta"><span className="poster">u/—</span></div></div>
          <h4 className="post-title">Locked preview — contribute to read the forum</h4>
          <p className="post-body">······· ········· ······ ·········· ····· ········· ······</p>
        </article>
      ))}
    </div>
  );

  return (
    <div className="community-page">
      <aside className="community-rail">
        <div className="rail-section">
          <Link className={"rail-item" + (scope === "__main__" ? " active" : "")} href="/community/__main__">
            <span className="ci ci-main"><Icon name="fire" size={15} /></span>
            <span className="rail-item-text"><span className="rail-item-label">All of Stanford</span></span>
          </Link>
        </div>
        <div className="rail-section">
          <div className="rail-section-title">Industry forums</div>
          {INDUSTRIES.filter((i) => i.key !== "all").map((i) => (
            <Link key={i.key} className={"rail-item" + (scope === "ind:" + i.key ? " active" : "")} href={`/community/${encodeURIComponent("ind:" + i.key)}`}>
              <span className={"ci ci-ind ind-" + i.key}>{i.label[0]}</span>
              <span className="rail-item-text"><span className="rail-item-label">{i.label}</span></span>
            </Link>
          ))}
          <Link className="rail-browse" href="/">Browse all companies →</Link>
        </div>
      </aside>

      <main className="community-main">
        <header className="community-banner">
          <div className="cb-info">
            <div className="cb-kind">{meta.kind === "industry" ? "Industry forum" : meta.kind === "company" ? "Company forum" : "Campus-wide"}</div>
            <h1>{meta.title}</h1>
            <p>{meta.blurb}</p>
          </div>
        </header>
        {unlocked ? (
          <div className="feed-live">{feed}</div>
        ) : (
          <div className="locked-feed tall">
            <div className="locked-feed-content">{placeholder}</div>
            <LockCard
              heading="Join the conversation"
              body="Contribute your recruiting story to unlock posting, voting, and replies across every forum."
              slug={meta.kind === "company" ? scope : undefined}
            />
          </div>
        )}
      </main>

      {composing && <Composer scope={scope} onClose={() => setComposing(false)} />}
    </div>
  );
}

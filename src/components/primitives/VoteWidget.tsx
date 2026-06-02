"use client";
import { useState } from "react";

// base = score excluding the viewer's own vote; dir = the viewer's vote (1/-1/0).
// Optimistic: clicking toggles local dir immediately and fires onVote(clicked) — the
// server action toggles the persisted Vote and revalidates.
export function VoteWidget({
  base,
  dir: initial,
  onVote,
  compact,
}: {
  base: number;
  dir: number;
  onVote: (dir: 1 | -1) => void;
  compact?: boolean;
}) {
  const [dir, setDir] = useState(initial);
  const [pop, setPop] = useState(false);
  const click = (d: 1 | -1) => {
    setDir(dir === d ? 0 : d);
    setPop(true);
    setTimeout(() => setPop(false), 220);
    onVote(d);
  };
  const display = base + dir;
  return (
    <div className={"post-vote" + (compact ? " compact" : "")}>
      <button className={dir === 1 ? "upvoted" : ""} aria-label="upvote" onClick={() => click(1)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 10h-5v6h-6v-6H4z" /></svg>
      </button>
      <span className={"vote-count" + (dir === 1 ? " upvoted" : dir === -1 ? " downvoted" : "") + (pop ? " pop" : "")}>{display}</span>
      <button className={dir === -1 ? "downvoted" : ""} aria-label="downvote" onClick={() => click(-1)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l-8-10h5V4h6v6h5z" /></svg>
      </button>
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { FeedPost, ThreadComment } from "@/lib/queries/feed";
import { VoteWidget } from "@/components/primitives/VoteWidget";
import { Flair } from "@/components/primitives/Flair";
import { Icon } from "@/components/primitives/Icon";
import { Avatar } from "@/components/primitives/Avatar";
import { AuthorTag } from "@/components/karma/AuthorTag";
import { useToast } from "@/components/primitives/ToastHost";
import { editPost, deletePost, votePost } from "@/app/actions/posts";
import { addComment, voteComment, editComment, deleteComment } from "@/app/actions/comments";

export function ThreadScreen({ post, comments, scope }: { post: FeedPost; comments: ThreadComment[]; scope: string }) {
  const router = useRouter();
  const toast = useToast();
  const { data: session } = useSession();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const submitComment = async () => {
    if (draft.trim().length < 2) return;
    const r = await addComment(scope, post.id, draft);
    if (!r.ok) return toast(r.error, { icon: "x" });
    setDraft("");
    toast("Comment added", { icon: "check", tone: "good" });
    router.refresh();
  };
  const doEditPost = async (body: string) => {
    const r = await editPost(scope, post.id, body);
    if (!r.ok) return toast(r.error, { icon: "x" });
    setEditing(false);
    toast("Post updated", { icon: "check" });
    router.refresh();
  };
  const doDeletePost = async () => {
    const r = await deletePost(scope, post.id);
    if (!r.ok) return toast(r.error, { icon: "x" });
    toast("Post deleted", { icon: "x" });
    router.push(`/community/${encodeURIComponent(scope)}`);
  };

  return (
    <div className="thread-page">
      <button className="back-link" onClick={() => router.push(`/community/${encodeURIComponent(scope)}`)}>
        <Icon name="arrow-left" size={13} /> Back to forum
      </button>

      <article className="thread-post">
        <div className="thread-post-head">
          <div className="post-meta">
            <AuthorTag handle={post.author} mine={post.mine} />
            <span className="sep">·</span>
            <span>{post.time}</span>
            {post.edited && <span className="edited-tag">edited</span>}
          </div>
          <div className="thread-head-right">
            <VoteWidget base={post.base} dir={post.myVote} onVote={(d) => votePost(scope, post.id, d)} />
            {post.mine && (
              <div className="post-menu-wrap" ref={menuRef}>
                <button className="post-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Post options">⋯</button>
                {menuOpen && (
                  <div className="post-menu">
                    <button onClick={() => { setEditing(true); setMenuOpen(false); }}><Icon name="copy" size={13} /> Edit post</button>
                    <button className="danger" onClick={() => { setMenuOpen(false); doDeletePost(); }}><Icon name="x" size={13} /> Delete post</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <h1 className="thread-title">
          <Flair kind={post.flair} />
          {post.title}
        </h1>
        {editing ? (
          <InlineComposer initial={post.body || ""} placeholder="Edit your post…" cta="Save" onSubmit={doEditPost} onCancel={() => setEditing(false)} />
        ) : (
          post.body && <p className="thread-body">{post.body}</p>
        )}
        <div className="thread-stats">
          <span><Icon name="comment" size={13} /> {post.comments} comment{post.comments === 1 ? "" : "s"}</span>
        </div>
      </article>

      <div className="comment-composer">
        <Avatar text="YOU" size={32} />
        <div className="cc-field">
          <textarea value={draft} placeholder="Add a comment — anonymously" maxLength={500} onChange={(e) => setDraft(e.target.value)} />
          <div className="cc-foot">
            <span className="cc-note">Posting as <strong>u/{session?.user?.username ?? "you"}</strong></span>
            <button className={"primary-btn sm" + (draft.trim().length < 2 ? " disabled" : "")} onClick={submitComment}>Comment</button>
          </div>
        </div>
      </div>

      <div className="comment-list">
        {comments.length === 0 ? (
          <p className="empty-note">No comments yet. Be the first — someone in the next class needs this.</p>
        ) : (
          comments.map((c) => <CommentNode key={c.id} c={c} postId={post.id} scope={scope} depth={0} />)
        )}
      </div>
    </div>
  );
}

function CommentNode({ c, postId, scope, depth }: { c: ThreadComment; postId: string; scope: string; depth: number }) {
  const router = useRouter();
  const toast = useToast();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);

  const doReply = async (body: string) => {
    const r = await addComment(scope, postId, body, c.id);
    if (!r.ok) return toast(r.error, { icon: "x" });
    setReplying(false);
    toast("Reply posted", { icon: "check", tone: "good" });
    router.refresh();
  };
  const doEdit = async (body: string) => {
    const r = await editComment(scope, postId, c.id, body);
    if (!r.ok) return toast(r.error, { icon: "x" });
    setEditing(false);
    toast("Comment updated", { icon: "check" });
    router.refresh();
  };
  const doDelete = async () => {
    const r = await deleteComment(scope, postId, c.id);
    if (!r.ok) return toast(r.error, { icon: "x" });
    toast("Comment deleted", { icon: "x" });
    router.refresh();
  };

  return (
    <div className={"comment" + (depth > 0 ? " reply" : "")}>
      <div className="comment-rail" />
      <div className="comment-main">
        <div className="comment-meta">
          <AuthorTag handle={c.author} mine={c.mine} />
          <span className="sep">·</span>
          <span>{c.time}</span>
          {c.edited && <span className="edited-tag">edited</span>}
        </div>
        {editing ? (
          <InlineComposer initial={c.body} placeholder="Edit your comment…" cta="Save" onSubmit={doEdit} onCancel={() => setEditing(false)} />
        ) : (
          <p className="comment-body">{c.body}</p>
        )}
        {!editing && (
          <div className="comment-actions">
            <VoteWidget base={c.base} dir={c.myVote} onVote={(d) => voteComment(scope, postId, c.id, d)} compact />
            <button className="creply" onClick={() => setReplying(!replying)}>Reply</button>
            {c.mine && (
              <>
                <button className="creply" onClick={() => setEditing(true)}>Edit</button>
                <button className="creply danger" onClick={doDelete}>Delete</button>
              </>
            )}
          </div>
        )}
        {replying && <InlineComposer placeholder={"Reply to u/" + (c.author ?? "anon") + "…"} onSubmit={doReply} onCancel={() => setReplying(false)} />}
        {c.replies.map((r) => <CommentNode key={r.id} c={r} postId={postId} scope={scope} depth={depth + 1} />)}
      </div>
    </div>
  );
}

function InlineComposer({ placeholder, onSubmit, onCancel, initial, cta }: { placeholder: string; onSubmit: (v: string) => void; onCancel: () => void; initial?: string; cta?: string }) {
  const [val, setVal] = useState(initial || "");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      ref.current.setSelectionRange(ref.current.value.length, ref.current.value.length);
    }
  }, []);
  const ok = val.trim().length >= 2;
  return (
    <div className="inline-composer">
      <textarea
        ref={ref}
        value={val}
        maxLength={500}
        placeholder={placeholder}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && ok) onSubmit(val.trim());
          if (e.key === "Escape") onCancel();
        }}
      />
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

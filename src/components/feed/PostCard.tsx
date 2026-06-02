"use client";
import { useRouter } from "next/navigation";
import type { FeedPost } from "@/lib/queries/feed";
import { VoteWidget } from "@/components/primitives/VoteWidget";
import { Flair } from "@/components/primitives/Flair";
import { Icon } from "@/components/primitives/Icon";
import { AuthorTag } from "@/components/karma/AuthorTag";
import { votePost } from "@/app/actions/posts";

export function PostCard({ post, scope, big }: { post: FeedPost; scope: string; big?: boolean }) {
  const router = useRouter();
  const open = () => router.push(`/thread/${encodeURIComponent(scope)}/${post.id}`);
  return (
    <article className={"reddit-post" + (big ? " big" : "")} onClick={open}>
      <div className="post-header">
        <div className="post-meta">
          <AuthorTag handle={post.author} mine={post.mine} />
          <span className="sep">·</span>
          <span>{post.time}</span>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <VoteWidget base={post.base} dir={post.myVote} onVote={(d) => votePost(scope, post.id, d)} />
        </div>
      </div>
      <h4 className="post-title">
        <Flair kind={post.flair} />
        {post.title}
      </h4>
      {post.body && <p className="post-body">{post.body}</p>}
      <div className="post-actions" onClick={(e) => e.stopPropagation()}>
        <button onClick={open}>
          <Icon name="comment" size={12} /> {post.comments} comment{post.comments === 1 ? "" : "s"}
        </button>
        <button onClick={open}>
          <Icon name="share" size={12} /> Share
        </button>
      </div>
    </article>
  );
}

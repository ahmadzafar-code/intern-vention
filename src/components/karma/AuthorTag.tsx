// Inline author identity for posts/comments. P8 ships handle-only; the karma chip +
// top badge land in P10 (computed Mentor Points). Pure component.
export function AuthorTag({ handle, mine }: { handle: string | null; mine?: boolean }) {
  return (
    <span className="author-tag">
      <span className="poster">u/{handle ?? "anon"}</span>
      {mine && <span className="you-tag">you</span>}
    </span>
  );
}

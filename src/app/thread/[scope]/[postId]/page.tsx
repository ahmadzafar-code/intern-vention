import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isUnlocked } from "@/lib/session";
import { getPost } from "@/lib/queries/feed";
import { ThreadScreen } from "@/components/feed/ThreadScreen";
import { Icon } from "@/components/primitives/Icon";

export default async function ThreadPage({ params }: { params: Promise<{ scope: string; postId: string }> }) {
  const { scope: raw, postId } = await params;
  const scope = decodeURIComponent(raw);
  // Reading a thread is unlock-gated; bounce locked users to the forum (which shows the gate).
  if (!(await isUnlocked())) redirect(`/community/${encodeURIComponent(scope)}`);

  const session = await auth();
  const data = await getPost(postId, session?.user?.id ?? null);
  if (!data) {
    return (
      <div className="thread-page">
        <div className="deleted-note">
          <Icon name="check-circle" size={18} />
          <p>This post was deleted.</p>
        </div>
      </div>
    );
  }
  return <ThreadScreen post={data.post} comments={data.comments} scope={scope} />;
}

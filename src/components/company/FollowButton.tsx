"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useAuthModal } from "@/components/auth/AuthModal";
import { toggleFollow } from "@/app/actions/follow";

export function FollowButton({ slug, following: initial }: { slug: string; following: boolean }) {
  const { status } = useSession();
  const { openSignIn } = useAuthModal();
  const [following, setFollowing] = useState(initial);
  const [busy, setBusy] = useState(false);

  const click = async () => {
    if (status !== "authenticated") return openSignIn();
    setBusy(true);
    const r = await toggleFollow(slug);
    setBusy(false);
    if (r.ok) setFollowing(r.following);
  };

  return (
    <button className={"follow-btn" + (following ? " active" : "")} onClick={click} disabled={busy}>
      {following ? "✓ Following" : "+ Follow"}
    </button>
  );
}

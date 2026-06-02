"use client";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Icon } from "@/components/primitives/Icon";
import { useAuthModal } from "@/components/auth/AuthModal";

// Gate overlay. Two states: signed-in-but-not-unlocked vs signed-out. Never shows email
// (the prototype did) — uses the public handle.
export function LockCard({ heading, body, slug }: { heading: string; body: string; slug?: string }) {
  const router = useRouter();
  const { status, data: session } = useSession();
  const { openSignIn } = useAuthModal();
  const goContribute = () => router.push(slug ? `/contribute/${slug}` : "/contribute");

  if (status === "authenticated") {
    return (
      <div className="lock-overlay">
        <div className="lock-card">
          <div className="lock-icon verified">
            <Icon name="check-circle" size={22} />
          </div>
          <h4 className="lock-title">You&apos;re verified — one step to go</h4>
          <p className="lock-body">
            Signed in as <strong>u/{session?.user?.username ?? "you"}</strong>. Add <strong>one</strong> recruiting
            story to unlock the full report and every Community forum.
          </p>
          <button className="lock-cta" onClick={goContribute}>
            Contribute to unlock →
          </button>
          <div className="lock-terms">
            <Icon name="check" size={12} /> 1 contribution = full access all cycle
          </div>
          <p className="lock-alt">
            Not you? <a onClick={() => signOut()}>Sign out</a>
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="lock-overlay">
      <div className="lock-card">
        <div className="lock-icon">
          <Icon name="lock" size={22} />
        </div>
        <h4 className="lock-title">{heading}</h4>
        <p className="lock-body">{body}</p>
        <div className="lock-how">
          <span><b>1</b> Report a past internship or offer</span>
          <span><b>2</b> Unlock the full report + community</span>
          <span><b>3</b> Good for the whole cycle</span>
        </div>
        <button className="lock-cta" onClick={openSignIn}>
          Sign in to contribute →
        </button>
      </div>
    </div>
  );
}

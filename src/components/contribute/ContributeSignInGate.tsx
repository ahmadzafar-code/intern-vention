"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/primitives/Icon";
import { GoogleG } from "@/components/auth/GoogleG";
import { useAuthModal } from "@/components/auth/AuthModal";

export function ContributeSignInGate() {
  const { openSignIn } = useAuthModal();
  const router = useRouter();
  useEffect(() => {
    openSignIn();
  }, [openSignIn]);
  return (
    <div className="cycle-signin">
      <div className="cycle-signin-card">
        <div className="lock-icon">
          <Icon name="lock" size={22} />
        </div>
        <h1>Sign in to contribute</h1>
        <p>
          Verify your Stanford SUNet first — it takes a few seconds and keeps every contribution anonymous. Then you
          can add your recruiting story and unlock everything.
        </p>
        <button className="google-btn" onClick={openSignIn}>
          <GoogleG size={18} />
          <span>Sign in with Google</span>
        </button>
        <button className="text-btn" style={{ marginTop: 12 }} onClick={() => router.push("/")}>
          ← Back to companies
        </button>
      </div>
    </div>
  );
}

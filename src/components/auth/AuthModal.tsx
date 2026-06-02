"use client";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Icon } from "@/components/primitives/Icon";
import { useToast } from "@/components/primitives/ToastHost";
import { GoogleG } from "./GoogleG";
import { STANFORD_MAJORS, STANFORD_MINORS, GRAD_CLASS_YEARS, GPA_BUCKETS } from "@/lib/constants";
import { hasGraduated } from "@/lib/profile";
import { setProfile, setUsername } from "@/app/actions/onboarding";

// Context so the nav / contribute gate can trigger the sign-in modal.
const AuthModalCtx = createContext<{ openSignIn: () => void } | null>(null);
export function useAuthModal() {
  const c = useContext(AuthModalCtx);
  if (!c) throw new Error("useAuthModal must be used within <AuthModalProvider>");
  return c;
}

function ProfSelect({ value, set, options }: { value: string; set: (v: string) => void; options: string[] }) {
  return (
    <div className="uname-field plain prof-field">
      <select className="prof-select" value={value} onChange={(e) => set(e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const [manualOpen, setManualOpen] = useState(false);
  const api = useMemo(() => ({ openSignIn: () => setManualOpen(true) }), []);

  // Forced onboarding: signed in but profile not finished. Not dismissible (X signs out).
  const needsOnboarding = status === "authenticated" && !!session?.user && !session.user.profileSet;
  const showIntro = manualOpen && status === "unauthenticated";

  return (
    <AuthModalCtx.Provider value={api}>
      {children}
      {needsOnboarding ? (
        <OnboardingModal hasUsername={!!session!.user.username} onAdvance={async () => void (await update())} />
      ) : showIntro ? (
        <IntroModal onClose={() => setManualOpen(false)} />
      ) : null}
    </AuthModalCtx.Provider>
  );
}

function IntroModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="signin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn signin-x" onClick={onClose} aria-label="Close">
          <Icon name="x" size={18} />
        </button>
        <div className="signin-body">
          <div className="signin-brand">Intern<span className="dot">·</span>vention</div>
          <h3 className="signin-title">Sign in to join the conversation</h3>
          <p className="signin-sub">
            Verify it&apos;s you with your Stanford <strong>SUNet</strong> account. We confirm you&apos;re a Stanford
            student — then everything you post stays <strong>anonymous</strong>. Your name is never shown.
          </p>
          <button className="google-btn" onClick={() => signIn("google")}>
            <GoogleG size={18} />
            <span>Sign in with Google</span>
          </button>
          <div className="signin-edu-note">
            <Icon name="lock" size={12} /> Only <code>@stanford.edu</code> accounts can join
          </div>
          <p className="signin-legal">
            By continuing you agree to the anonymity pledge: contribute honestly, never doxx, pay it forward.
          </p>
        </div>
      </div>
    </div>
  );
}

function OnboardingModal({ hasUsername, onAdvance }: { hasUsername: boolean; onAdvance: () => Promise<void> }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // username step
  const [uname, setUname] = useState("");
  const clean = uname.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const unameOk = clean.length >= 3 && clean.length <= 20;
  const SUGGESTED = ["anon_owl", "cardinal_jr", "the_grind_2027", "farm_recruiter"];

  // profile step (Bachelor's — other degree levels added in a widen phase)
  const [bMajor, setBMajor] = useState("Computer Science");
  const [bMajor2, setBMajor2] = useState("None");
  const [bMinor, setBMinor] = useState("None");
  const [bGrad, setBGrad] = useState("2026");
  const [bGpa, setBGpa] = useState("3.7 – 3.9");
  const graduated = hasGraduated(bGrad);

  const submitUsername = async () => {
    if (!unameOk || busy) return;
    setBusy(true);
    setError(null);
    const res = await setUsername(clean);
    setBusy(false);
    if (res.ok) await onAdvance();
    else setError(res.error);
  };

  const submitProfile = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await setProfile({ major: bMajor, major2: bMajor2, minor: bMinor, gradYear: bGrad, gpa: bGpa });
    setBusy(false);
    if (res.ok) {
      toast("Welcome — contribute a story to unlock", { icon: "check-circle" });
      await onAdvance();
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="modal-scrim">
      <div className="signin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn signin-x" onClick={() => signOut()} aria-label="Cancel and sign out">
          <Icon name="x" size={18} />
        </button>

        {!hasUsername ? (
          <div className="signin-body">
            <div className="uname-check">
              <Icon name="check-circle" size={15} /> SUNet verified
            </div>
            <h3 className="signin-title">Pick your anonymous handle</h3>
            <p className="signin-sub">
              This is how you&apos;ll show up across Intern·vention. Your real name stays private — choose something
              that isn&apos;t identifying.
            </p>
            <div className="uname-field">
              <span className="uname-prefix">u/</span>
              <input
                className="uname-input"
                value={uname}
                autoFocus
                maxLength={20}
                placeholder="choose a username"
                onChange={(e) => setUname(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitUsername();
                }}
              />
            </div>
            <div className="uname-hint">
              {error ? error : clean.length > 0 && !unameOk ? "3–20 characters · letters, numbers, underscores" : "Letters, numbers, and underscores only"}
            </div>
            <div className="uname-suggest">
              {SUGGESTED.map((s) => (
                <button key={s} className="uname-chip" onClick={() => setUname(s)}>
                  u/{s}
                </button>
              ))}
            </div>
            <button className={"google-btn solid" + (unameOk && !busy ? "" : " disabled")} onClick={submitUsername}>
              {busy ? "Claiming…" : `Claim u/${clean || "…"}`}
            </button>
          </div>
        ) : (
          <div className="signin-body profile-body">
            <h3 className="signin-title">Set up your profile</h3>
            <p className="signin-sub">Anonymous and bucketed — attached to your contributions, never shown with your name.</p>

            <div className="deg-block">
              <div className="deg-block-title">Bachelor&apos;s</div>
              <label className="prof-label">Primary major</label>
              <ProfSelect value={bMajor} set={setBMajor} options={STANFORD_MAJORS} />
              <label className="prof-label">
                Second major <span className="opt">if double major</span>
              </label>
              <ProfSelect value={bMajor2} set={setBMajor2} options={["None", ...STANFORD_MAJORS]} />
              <label className="prof-label">
                Minor <span className="opt">optional</span>
              </label>
              <ProfSelect value={bMinor} set={setBMinor} options={STANFORD_MINORS} />
              <div className="deg-row">
                <div>
                  <label className="prof-label">Graduating class</label>
                  <ProfSelect value={bGrad} set={setBGrad} options={GRAD_CLASS_YEARS} />
                </div>
                {!graduated ? (
                  <div>
                    <label className="prof-label">GPA bucket</label>
                    <ProfSelect value={bGpa} set={setBGpa} options={GPA_BUCKETS} />
                  </div>
                ) : (
                  <div className="deg-grad-note">
                    <Icon name="check-circle" size={13} /> Graduated — no GPA needed
                  </div>
                )}
              </div>
            </div>

            {error && <div className="uname-hint">{error}</div>}
            <button className={"google-btn solid" + (busy ? " disabled" : "")} onClick={submitProfile} style={{ marginTop: 18 }}>
              {busy ? "Saving…" : "Finish & explore →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

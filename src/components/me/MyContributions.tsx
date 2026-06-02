"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MyProfile, MyContribution, FlairOption } from "@/lib/queries/me";
import { Logo } from "@/components/primitives/Logo";
import { Icon } from "@/components/primitives/Icon";
import { BadgePill } from "@/components/karma/BadgePill";
import { GoogleG } from "@/components/auth/GoogleG";
import { useAuthModal } from "@/components/auth/AuthModal";
import { useToast } from "@/components/primitives/ToastHost";
import { fmtK } from "@/lib/karma";
import { flairLabel } from "@/lib/labels";
import { confirmProfile, setShowName, toggleFlair, editContribution, removeContribution } from "@/app/actions/profile";

const REQ_STATUS: Record<string, { label: string; tone: string; icon: string }> = {
  PENDING: { label: "Pending review", tone: "amber", icon: "clock" },
  APPROVED: { label: "Approved · live", tone: "green", icon: "check-circle" },
  REJECTED: { label: "Not approved", tone: "slate", icon: "x" },
};

export function MyContributions({ profile }: { profile: MyProfile | null }) {
  const { openSignIn } = useAuthModal();
  const router = useRouter();
  const toast = useToast();

  if (!profile) {
    return (
      <div className="cycle-signin">
        <div className="cycle-signin-card">
          <div className="lock-icon"><Icon name="user" size={22} /></div>
          <h1>Your contributions live here</h1>
          <p>Sign in with your SUNet to see your recruiting stories, your karma and badges, and everything you&apos;ve shared.</p>
          <button className="google-btn" onClick={openSignIn}><GoogleG size={18} /><span>Sign in with Google</span></button>
        </div>
      </div>
    );
  }

  const name = profile.realName || ("u/" + profile.username);
  const initials = profile.realName ? profile.realName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "YOU";

  return (
    <main className="contrib-page">
      <header className="profile-card">
        <div className="profile-av">{initials}</div>
        <div className="profile-id">
          <div className="profile-name">{name}</div>
          <div className="profile-email">posts as <strong>u/{profile.username}</strong>{profile.major ? ` · ${profile.major}` : ""}{profile.gradYear ? ` · Class of ${profile.gradYear}` : ""}</div>
          <div className="profile-badges">
            {profile.badges.length ? profile.badges.map((b) => <BadgePill key={b} id={b} size="sm" />) : <span className="profile-nobadge">No badges yet — contribute to earn your first.</span>}
          </div>
        </div>
        <div className="profile-karma">
          <div className="pk-num">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.8.7-5 4.6 1.4 6.7L12 17.8 5.9 20.3 7.3 13.6l-5-4.6 6.8-.7z" /></svg>{" "}
            {profile.karma.toLocaleString("en-US")}
          </div>
          <div className="pk-tier">{profile.tier} · Mentor Points</div>
        </div>
      </header>

      {profile.stale && (
        <div className="profile-confirm">
          <span className="pc-icon"><Icon name="user" size={15} /></span>
          <div className="pc-text"><strong>Still Class of {profile.gradYear}?</strong> It&apos;s a new year — confirm your profile is current so your contributions stay accurate.</div>
          <button className="pc-btn" onClick={async () => { await confirmProfile(); toast("Profile confirmed for this year", { icon: "check", tone: "good" }); router.refresh(); }}>Confirm</button>
        </div>
      )}

      <VisibilitySettings profile={profile} />

      <div className="contrib-stats">
        <div className="cstat"><div className="cstat-val">{profile.counts.contributions}</div><div className="cstat-label">Contributions</div><div className="cstat-sub">recruiting stories</div></div>
        <div className="cstat"><div className="cstat-val">{profile.counts.posts}</div><div className="cstat-label">Posts</div><div className="cstat-sub">started discussions</div></div>
        <div className="cstat"><div className="cstat-val">{profile.counts.comments}</div><div className="cstat-label">Replies</div><div className="cstat-sub">helped someone</div></div>
        <div className="cstat"><div className="cstat-val">{fmtK(profile.karma)}</div><div className="cstat-label">Mentor Points</div><div className="cstat-sub">{profile.tier}</div></div>
      </div>

      <div className="section-head contrib-section-head">
        <h2>Your recruiting stories</h2>
        <button className="primary-btn sm" onClick={() => router.push("/contribute")}><Icon name="plus" size={13} /> Add a story</button>
      </div>

      {profile.contributions.length === 0 ? (
        <div className="contrib-empty">
          <div className="lock-icon"><Icon name="lock" size={20} /></div>
          <h3>You haven&apos;t contributed yet</h3>
          <p>Share one recruiting story to unlock the full cohort reports and community, and start building karma.</p>
          <button className="primary-btn" onClick={() => router.push("/contribute")}>Contribute your first story →</button>
        </div>
      ) : (
        <div className="contrib-grid">
          {profile.contributions.map((c) => <ContributionCard key={c.id} c={c} />)}
        </div>
      )}

      {profile.requests.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 34 }}>
            <h2>Your company requests</h2>
            <span className="meta">new companies are verified before going live</span>
          </div>
          <div className="req-list">
            {profile.requests.map((r) => {
              const st = REQ_STATUS[r.status] || REQ_STATUS.PENDING;
              return (
                <div className="req-row" key={r.id}>
                  <span className="req-mono">{r.name[0].toUpperCase()}</span>
                  <div className="req-info">
                    <div className="req-name">{r.name} <span className="req-ind">{r.industry}</span></div>
                    <div className="req-sub">{r.website || `${r.slug}.com`}</div>
                  </div>
                  <span className={"req-status tone-" + st.tone}><Icon name={st.icon} size={12} /> {st.label}</span>
                  {r.status === "APPROVED" && <button className="link-btn" onClick={() => router.push(`/company/${r.slug}`)}>Open →</button>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

function ContributionCard({ c }: { c: MyContribution }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(c.role);
  const [advice, setAdvice] = useState(c.advice ?? "");
  const pending = c.status === "PENDING";

  const save = async () => {
    const r = await editContribution(c.id, { role, advice });
    if (!r.ok) return toast(r.error ?? "Failed", { icon: "x" });
    setEditing(false);
    toast("Contribution updated", { icon: "check" });
    router.refresh();
  };
  const del = async () => {
    const r = await removeContribution(c.id);
    if (!r.ok) return toast(r.error ?? "Failed", { icon: "x" });
    toast("Contribution deleted", { icon: "x" });
    router.refresh();
  };

  if (editing) {
    return (
      <div className="contrib-card editing">
        <div className="contrib-head">
          <Logo company={{ name: c.companyName, domain: c.domain, bg: c.bg }} size={38} radius={9} />
          <div className="contrib-id"><div className="contrib-co">{c.companyName}</div></div>
        </div>
        <label className="edit-label">Role</label>
        <input className="cinput" value={role} maxLength={48} onChange={(e) => setRole(e.target.value)} />
        <label className="edit-label">What&apos;s not on your LinkedIn that helped</label>
        <textarea className="ctextarea" value={advice} maxLength={500} onChange={(e) => setAdvice(e.target.value)} placeholder="The real, unpolished advice…" />
        <div className="contrib-foot">
          <button className="link-btn" onClick={save}>Save changes</button>
          <button className="link-btn danger" onClick={() => { setRole(c.role); setAdvice(c.advice ?? ""); setEditing(false); }}>Cancel</button>
        </div>
      </div>
    );
  }
  return (
    <div className={"contrib-card" + (pending ? " is-pending" : "")}>
      <div className="contrib-head">
        <Logo company={{ name: c.companyName, domain: c.domain, bg: c.bg }} size={38} radius={9} />
        <div className="contrib-id">
          <div className="contrib-co">{c.companyName}{pending && <span className="contrib-pill amber"><Icon name="clock" size={10} /> Pending review</span>}</div>
          <div className="contrib-role">{c.role}{c.cycle ? " · " + c.cycle : ""}</div>
        </div>
      </div>
      {c.advice ? <p className="contrib-advice">&ldquo;{c.advice}&rdquo;</p> : <p className="contrib-advice muted">No written advice — just the data points.</p>}
      <div className="contrib-foot">
        {pending ? (
          <span className="contrib-foot-note">Goes live when {c.companyName} is approved</span>
        ) : (
          <button className="link-btn" onClick={() => router.push(`/company/${c.slug}`)}>View cohort report →</button>
        )}
        <span className="contrib-foot-actions">
          <button className="link-btn" onClick={() => setEditing(true)}>Edit</button>
          <button className="link-btn danger" onClick={del}>Delete</button>
        </span>
      </div>
    </div>
  );
}

function VisibilitySettings({ profile }: { profile: MyProfile }) {
  const router = useRouter();
  const { companies, majors, years } = profile.flairOptions;

  const FlairChip = ({ o, company }: { o: FlairOption; company?: boolean }) => {
    const on = profile.flairs.includes(o.value);
    const fl = flairLabel(o.value);
    return (
      <button
        className={"fpb-chip flair-" + fl.type + (on ? " on" : "")}
        onClick={async () => { await toggleFlair(o.value); router.refresh(); }}
      >
        {company && o.slug && <Logo company={{ name: o.label, domain: o.domain, bg: o.bg }} size={18} radius={4} />}
        <span>{o.label}</span>
        {on && <Icon name="check" size={12} />}
      </button>
    );
  };

  return (
    <div className="vis-settings">
      <div className="vis-head">
        <div>
          <h3>Identity &amp; flairs</h3>
          <p>You post as <strong>u/{profile.username}</strong>. Anonymous by default — optionally show your real name, and add flairs for where you&apos;ve worked, your major, and your class.</p>
        </div>
        <div className="vis-preview">
          <span className="vis-preview-label">Appears as</span>
          <span className="vis-preview-name">
            {profile.showName && profile.realName ? profile.realName : "u/" + profile.username}
            {profile.flairs.map((f) => { const fl = flairLabel(f); return <span key={f} className={"ex-flair flair-" + fl.type}>{fl.label}</span>; })}
          </span>
        </div>
      </div>
      <div className="vis-rows">
        <div className="vis-row">
          <div className="vis-row-text"><strong>Show my name</strong><span>Display your real name instead of u/{profile.username}</span></div>
          <button className={"vis-toggle" + (profile.showName ? " on" : "")} role="switch" aria-checked={profile.showName} onClick={async () => { await setShowName(!profile.showName); router.refresh(); }}>
            <span className="vt-knob" />
          </button>
        </div>
      </div>
      <div className="flair-picker-block">
        <div className="fpb-group">
          <div className="fpb-label">Company <span className="opt">from companies you&apos;ve contributed to</span></div>
          {companies.length === 0 ? <p className="fpb-empty">Contribute a recruiting story and that company becomes available.</p> : <div className="fpb-chips">{companies.map((o) => <FlairChip key={o.value} o={o} company />)}</div>}
        </div>
        <div className="fpb-group">
          <div className="fpb-label">Major</div>
          {majors.length === 0 ? <p className="fpb-empty">Your major appears here once your profile is set.</p> : <div className="fpb-chips">{majors.map((o) => <FlairChip key={o.value} o={o} />)}</div>}
        </div>
        <div className="fpb-group">
          <div className="fpb-label">Graduating class</div>
          {years.length === 0 ? <p className="fpb-empty">Your class year appears here once your profile is set.</p> : <div className="fpb-chips">{years.map((o) => <FlairChip key={o.value} o={o} />)}</div>}
        </div>
      </div>
    </div>
  );
}

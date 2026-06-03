"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Logo, type LogoCompany } from "@/components/primitives/Logo";
import { Icon } from "@/components/primitives/Icon";
import { useToast } from "@/components/primitives/ToastHost";
import { fireConfetti } from "@/components/primitives/confetti";
import { contribute } from "@/app/actions/contribute";
import { COMP_BUCKETS } from "@/lib/constants";

const ADD_ROLE = "+ Add a different role";
const CYCLES = ["2025–26", "2024–25", "2023–24", "2022–23"];
const PLATFORMS = ["Company website", "Handshake", "LinkedIn", "Career fair", "Cold email", "Other"];
const REFERRAL_SOURCES = [
  "Stanford student club", "Coffee chat", "Cold email", "LinkedIn cold outreach", "Previous workplace",
  "Research lab", "Professor", "Friend", "Classmate", "Other",
];
// Month + year are picked independently so any application/offer date works — not just the current
// cycle. The two are recombined into "MMM YYYY", the exact format lib/aggregate.ts monthCounts()
// parses (first token, "Sept"→"Sep") to bin the timing chart, so storage/reporting is unchanged.
const MONTH_ABBREVS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const YEARS = Array.from({ length: 2030 - 2015 + 1 }, (_, i) => String(2030 - i)); // 2030 → 2015 (desc)

type FormCompany = LogoCompany & { slug: string; name: string };
type Profile = { major: string | null; gradYear: string | null; gpa: string | null };

export function ContributeForm({ company, roles, profile, pending }: { company: FormCompany; roles: string[]; profile: Profile; pending?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const { data: session, update } = useSession();

  const [role, setRole] = useState(roles[0] ?? ADD_ROLE);
  const [customRole, setCustomRole] = useState("");
  const [cycle, setCycle] = useState("2025–26");
  const [platform, setPlatform] = useState("Company website");
  const [customPlatform, setCustomPlatform] = useState("");
  const [hadReferral, setHadReferral] = useState(false);
  const [referralSource, setReferralSource] = useState("");
  const [customReferral, setCustomReferral] = useState("");
  const [techRounds, setTechRounds] = useState(3);
  const [behavioralRounds, setBehavioralRounds] = useState(1);
  const [appliedMonth, setAppliedMonth] = useState("Sept");
  const [appliedYear, setAppliedYear] = useState("2026");
  const [offerMonth, setOfferMonth] = useState("Nov");
  const [offerYear, setOfferYear] = useState("2026");
  const [comp, setComp] = useState("$8–10k/mo · ~$96–120k/yr");
  const [advice, setAdvice] = useState("");
  const [busy, setBusy] = useState(false);

  const ROLES = [...roles, ADD_ROLE];
  const finalRole = role === ADD_ROLE ? customRole.trim() || "Other role" : role;
  const finalPlatform = platform === "Other" ? customPlatform.trim() || "Other" : platform;
  const finalReferral = !hadReferral ? "" : referralSource === "Other" ? customReferral.trim() || "Other" : referralSource;

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    const res = await contribute({
      slug: company.slug,
      role: finalRole,
      cycle,
      platform: finalPlatform,
      hadReferral,
      referralSource: finalReferral,
      techRounds,
      behavioralRounds,
      applied: `${appliedMonth} ${appliedYear}`,
      offerMonth: `${offerMonth} ${offerYear}`,
      comp,
      advice,
    });
    if (!res.ok) {
      setBusy(false);
      toast(res.error, { icon: "x" });
      return;
    }
    fireConfetti();
    toast("Unlocked! +120 karma · earned Verified + Storyteller", { icon: "check", tone: "good", duration: 3400 });
    await update(); // flip the nav's unlocked hint (the report page reads truth from the DB)
    // A pending company has no public page yet (/company/[slug] 404s until approved), so land on
    // My Contributions — it shows the new entry with a "Goes live when approved" note.
    setTimeout(() => router.push(pending ? "/me" : `/company/${company.slug}`), 450);
  };

  const profileLine = profile.major
    ? `${profile.major} · ${profile.gradYear === "Already graduated" ? "Alum" : "Class of " + profile.gradYear}${profile.gpa ? " · " + profile.gpa : ""}`
    : "set at sign-in";

  return (
    <main className="contribute">
      <button className="back-link" onClick={() => router.push(pending ? "/contribute" : `/company/${company.slug}`)}>
        <Icon name="arrow-left" size={13} /> {pending ? "Back" : `Back to ${company.name}`}
      </button>

      {pending && (
        <div className="pending-co-banner">
          <span className="pcb-icon"><Icon name="clock" size={15} /></span>
          <div className="pcb-text">
            <strong>{company.name} is pending review.</strong> Your story is submitted together with the request — it
            goes live the moment our team approves the company (usually &lt; 48h). You&apos;re unlocked right away.
          </div>
        </div>
      )}

      <header className="contribute-header">
        <Logo company={company} size={56} radius={12} />
        <div className="header-info">
          <h1>
            How did you get <span className="accent">{company.name}</span>?
          </h1>
          <p className="lede">
            Takes 90 seconds. All entries are aggregated and anonymous — your name is never attached. Submitting unlocks
            the {company.name} cohort report and Community Thread.
          </p>
          <div className="header-meta">
            <span className="badge-verified">
              <Icon name="check-circle" size={12} /> u/{session?.user?.username ?? "you"} · anonymous
            </span>
            <span className="badge-time">
              <Icon name="user" size={12} /> {profileLine}
            </span>
            <button className="change-co" onClick={() => router.push("/contribute")}>
              Change company
            </button>
          </div>
        </div>
      </header>

      <div className="cform">
        <section className="form-section">
          <div className="csec-head">
            <h2>The role</h2>
          </div>
          <div className="form-grid g3">
            <Field label="Role">
              <Select value={role} set={setRole} options={ROLES} />
            </Field>
            <Field label="Cycle">
              <Select value={cycle} set={setCycle} options={CYCLES} />
            </Field>
            <Field label={<span>Compensation <span className="opt">(monthly · yearly equiv.)</span></span>}>
              <Select value={comp} set={setComp} options={COMP_BUCKETS} />
            </Field>
          </div>
          {role === ADD_ROLE && (
            <div style={{ marginTop: 14 }}>
              <Field label={<span>New role title <span className="opt">we&apos;ll add it to {company.name}</span></span>} full>
                <input
                  className="cinput"
                  value={customRole}
                  maxLength={48}
                  autoFocus
                  placeholder="e.g. Forward Deployed Engineer Intern"
                  onChange={(e) => setCustomRole(e.target.value)}
                />
              </Field>
            </div>
          )}
        </section>

        <section className="form-section">
          <div className="csec-head">
            <h2>How you applied</h2>
          </div>
          <Field label="What platform did you use to apply?" full>
            <Radio value={platform} set={setPlatform} options={PLATFORMS} />
          </Field>
          {platform === "Other" && (
            <div style={{ marginTop: 12 }}>
              <Field label="Tell us where" full>
                <input
                  className="cinput"
                  value={customPlatform}
                  maxLength={60}
                  autoFocus
                  placeholder="e.g. Hackathon portal, Discord server, university job board…"
                  onChange={(e) => setCustomPlatform(e.target.value)}
                />
              </Field>
            </div>
          )}
          <div className="csec-head" style={{ marginTop: 20 }}>
            <h3 className="csec-subhead">Referral</h3>
          </div>
          <Field label="Did you have a referral?" full>
            <Radio value={hadReferral ? "Yes" : "No"} set={(v) => setHadReferral(v === "Yes")} options={["No", "Yes"]} />
          </Field>
          {hadReferral && (
            <div style={{ marginTop: 12 }}>
              <Field label="How did you get the referral?" full>
                <Radio value={referralSource} set={setReferralSource} options={REFERRAL_SOURCES} />
              </Field>
              {referralSource === "Other" && (
                <div style={{ marginTop: 12 }}>
                  <Field label="Tell us how" full>
                    <input
                      className="cinput"
                      value={customReferral}
                      maxLength={60}
                      autoFocus
                      placeholder="e.g. family friend, hackathon teammate…"
                      onChange={(e) => setCustomReferral(e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </div>
          )}
          <div className="csec-head" style={{ marginTop: 20 }}>
            <h3 className="csec-subhead">Interview rounds</h3>
            <span className="csec-meta">leave behavioral at 0 if not applicable</span>
          </div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <Field label={<span>Technical rounds <span className="opt">(OA, coding, case)</span></span>}>
              <Stepper value={techRounds} set={setTechRounds} min={0} max={9} />
            </Field>
            <Field label={<span>Behavioral rounds <span className="opt">(fit, &quot;why us&quot;)</span></span>}>
              <Stepper value={behavioralRounds} set={setBehavioralRounds} min={0} max={6} />
            </Field>
          </div>
          <div className="csec-head" style={{ marginTop: 20 }}>
            <h3 className="csec-subhead">Timeline</h3>
            <span className="csec-meta">when you applied → when you got the final offer</span>
          </div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <Field label="Applied">
              <div className="month-year">
                <Select value={appliedMonth} set={setAppliedMonth} options={MONTH_ABBREVS} />
                <Select value={appliedYear} set={setAppliedYear} options={YEARS} />
              </div>
            </Field>
            <Field label="Final offer received">
              <div className="month-year">
                <Select value={offerMonth} set={setOfferMonth} options={MONTH_ABBREVS} />
                <Select value={offerYear} set={setOfferYear} options={YEARS} />
              </div>
            </Field>
          </div>
        </section>

        <section className="form-section">
          <div className="csec-head">
            <h2>What&apos;s not on your LinkedIn that helped you get this job?</h2>
            <span className="csec-meta">Stanford-specific · appears in Advice</span>
          </div>
          <p className="csec-sub">The real, unpolished stuff that actually moved the needle. A few things worth covering:</p>
          <ul className="advice-prompts">
            <li><strong>Resources you used to prepare</strong> — specific courses, books, problem sets, mock platforms</li>
            <li><strong>Networking tips</strong> — who you reached out to, what message worked, the alum/coffee chat that helped</li>
            <li><strong>Stanford-specific advice</strong> — clubs, classes, section leaders, research labs, professors</li>
            <li><strong>The make-or-break moment</strong> — the thing you&apos;d never put on a resume</li>
          </ul>
          <textarea
            className="ctextarea"
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            placeholder="A Sigma Nu alum at the company hopped on a call and walked me through their interview loop. CS 161 with that one section leader is the reason I cleared the algo round. I drilled NeetCode 150 + did 3 Pramp mocks. Honestly, the Stanford name on the resume got the recruiter to actually open it…"
          />
        </section>
      </div>

      <div className="form-footer">
        <p className="privacy-note">
          By submitting, your anonymized data appears in cohort reports for {company.name}. You can edit or delete
          anytime.
        </p>
        <button className="submit-btn" onClick={submit} disabled={busy}>
          {busy ? "Submitting…" : "Submit & unlock →"}
        </button>
      </div>
    </main>
  );
}

function Field({ label, full, children }: { label: ReactNode; full?: boolean; children: ReactNode }) {
  return (
    <div className={"field" + (full ? " full" : "")}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function Radio({ value, set, options }: { value: string; set: (v: string) => void; options: string[] }) {
  return (
    <div className="radio-group">
      {options.map((o) => (
        <button type="button" key={o} className={"radio-chip" + (value === o ? " selected" : "")} onClick={() => set(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Select({ value, set, options }: { value: string; set: (v: string) => void; options: string[] }) {
  return (
    <div className="select-wrap">
      <select className="cinput" value={value} onChange={(e) => set(e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <Icon name="chevron-down" size={12} className="select-chev" />
    </div>
  );
}

function Stepper({ value, set, min, max, step = 1 }: { value: number; set: (v: number) => void; min: number; max: number; step?: number }) {
  return (
    <div className="stepper">
      <button onClick={() => set(Math.max(min, value - step))}>−</button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => set(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
      />
      <button onClick={() => set(Math.min(max, value + step))}>+</button>
    </div>
  );
}

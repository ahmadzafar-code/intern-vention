"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/primitives/Icon";
import { useToast } from "@/components/primitives/ToastHost";
import { INDUSTRIES } from "@/lib/constants";
import { requestCompany } from "@/app/actions/companies";

export function AddCompanyModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("startups");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inds = INDUSTRIES.filter((i) => i.key !== "all");
  const canSubmit = name.trim().length >= 2 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const res = await requestCompany({ name, website, industry, note });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast("Company details saved — now add your story", { icon: "check", tone: "good" });
    onClose();
    router.push(`/contribute/${res.slug}`);
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="composer" onClick={(e) => e.stopPropagation()}>
        <div className="composer-head">
          <h3>Add a new company · Step 1 of 2</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="composer-body">
          <div className="req-banner">
            <Icon name="check-circle" size={13} /> New companies <strong>go live instantly</strong>. Next you&apos;ll add
            your recruiting story — it publishes with the company and unlocks the cohort report right away.
          </div>
          <label className="composer-label">Company name</label>
          <input className="composer-input" value={name} maxLength={40} autoFocus placeholder="e.g. Mercor, Sierra, Cognition…" onChange={(e) => setName(e.target.value)} />
          {error && <div className="add-co-warn">{error}</div>}
          <label className="composer-label">Website <span className="opt">helps us verify</span></label>
          <input className="composer-input" value={website} maxLength={60} placeholder="company.com" onChange={(e) => setWebsite(e.target.value)} />
          <label className="composer-label">Industry</label>
          <div className="flair-picker">
            {inds.map((i) => (
              <button key={i.key} className={"radio-chip" + (industry === i.key ? " selected" : "")} onClick={() => setIndustry(i.key)}>
                {i.label}
              </button>
            ))}
          </div>
          <label className="composer-label">Anything we should know? <span className="opt">optional</span></label>
          <textarea className="composer-textarea" value={note} maxLength={200} placeholder="e.g. seed-stage AI startup, ~20 people, hires Stanford interns…" onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="composer-foot">
          <span className="composer-note">Goes live immediately · please avoid duplicates</span>
          <button className={"primary-btn" + (canSubmit ? "" : " disabled")} onClick={submit}>
            {busy ? "Saving…" : "Continue to your story →"}
          </button>
        </div>
      </div>
    </div>
  );
}

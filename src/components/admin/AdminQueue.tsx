"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PendingRequest } from "@/lib/queries/companies";
import { Icon } from "@/components/primitives/Icon";
import { useToast } from "@/components/primitives/ToastHost";
import { reviewCompanyRequest } from "@/app/actions/companies";

export function AdminQueue({ requests }: { requests: PendingRequest[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const review = async (id: string, decision: "approve" | "reject") => {
    setBusy(id);
    const r = await reviewCompanyRequest(id, decision);
    setBusy(null);
    if (!r.ok) return toast(r.error ?? "Failed", { icon: "x" });
    toast(decision === "approve" ? "Approved — company is live" : "Rejected", {
      icon: decision === "approve" ? "check" : "x",
      tone: decision === "approve" ? "good" : undefined,
    });
    router.refresh();
  };

  return (
    <main className="admin-page" style={{ maxWidth: 760, margin: "0 auto", padding: "var(--page-pad)" }}>
      <div className="section-head">
        <h2>Company review queue</h2>
        <span className="meta">{requests.length} pending</span>
      </div>
      {requests.length === 0 ? (
        <p className="empty-note big">No pending company requests.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {requests.map((r) => (
            <div className="card" key={r.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "var(--head-font)", fontSize: 17 }}>
                    {r.name} <span style={{ color: "var(--text-3)", fontSize: 13 }}>· {r.industry}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>
                    <code>{r.slug}</code>
                    {r.website ? ` · ${r.website}` : ""}
                  </div>
                  {r.note && <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 8 }}>{r.note}</p>}
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button className="primary-btn sm" disabled={busy === r.id} onClick={() => review(r.id, "approve")}>
                    <Icon name="check" size={13} /> Approve
                  </button>
                  <button className="ghost-btn sm" disabled={busy === r.id} onClick={() => review(r.id, "reject")}>
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

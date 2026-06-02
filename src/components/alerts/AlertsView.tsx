"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Alert, AlertGroup } from "@/lib/queries/notifications";
import { Icon, type IconName } from "@/components/primitives/Icon";
import { GoogleG } from "@/components/auth/GoogleG";
import { useAuthModal } from "@/components/auth/AuthModal";
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions/notifications";

const ALERT_META: Record<string, { icon: IconName; tone: string }> = {
  reply: { icon: "comment", tone: "blue" },
  award: { icon: "star", tone: "amber" },
  upvote: { icon: "trend-up", tone: "cardinal" },
  newpost: { icon: "fire", tone: "cardinal" },
  newcontrib: { icon: "user", tone: "green" },
  badge: { icon: "sparkle", tone: "purple" },
  tier: { icon: "star", tone: "purple" },
};
const GROUPS: AlertGroup[] = ["Today", "This week", "Earlier"];

export function AlertsView({ notifications }: { notifications: Alert[] | null }) {
  const router = useRouter();
  const { openSignIn } = useAuthModal();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  if (notifications === null) {
    return (
      <div className="cycle-signin">
        <div className="cycle-signin-card">
          <div className="lock-icon"><Icon name="bell" size={22} /></div>
          <h1>Never miss a reply</h1>
          <p>Sign in to get notified when someone replies to you, awards your advice, or posts in a company you follow.</p>
          <button className="google-btn" onClick={openSignIn}>
            <GoogleG size={18} />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  const unread = notifications.filter((a) => !a.read).length;
  const shown = filter === "unread" ? notifications.filter((a) => !a.read) : notifications;
  const byGroup: Record<string, Alert[]> = {};
  for (const a of shown) (byGroup[a.group] = byGroup[a.group] || []).push(a);

  const open = async (a: Alert) => {
    if (!a.read) await markNotificationRead(a.id);
    if (a.postId && a.scope) router.push(`/thread/${encodeURIComponent(a.scope)}/${a.postId}`);
    else if (a.scope) router.push(`/community/${encodeURIComponent(a.scope)}`);
    else if (a.slug) router.push(`/company/${a.slug}`);
    else router.push("/me");
  };
  const markAll = async () => {
    await markAllNotificationsRead();
    router.refresh();
  };

  return (
    <main className="alerts-page">
      <header className="alerts-header">
        <div>
          <h1>Alerts</h1>
          <p className="alerts-sub">{unread > 0 ? `${unread} unread` : "You're all caught up"}</p>
        </div>
        {unread > 0 && <button className="link-btn" onClick={markAll}>Mark all read</button>}
      </header>

      <div className="alerts-filters">
        <button className={"sort-tab" + (filter === "all" ? " active" : "")} onClick={() => setFilter("all")}>All</button>
        <button className={"sort-tab" + (filter === "unread" ? " active" : "")} onClick={() => setFilter("unread")}>
          Unread {unread > 0 && <span className="filter-count">{unread}</span>}
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="alerts-empty">
          <div className="alerts-empty-icon"><Icon name="check-circle" size={22} /></div>
          <p>{filter === "unread" ? "No unread alerts — you're all caught up." : "No alerts yet. Post, reply, and contribute to start getting notified."}</p>
        </div>
      ) : (
        GROUPS.filter((g) => byGroup[g]).map((g) => (
          <div className="alert-group" key={g}>
            <div className="alert-group-label">{g}</div>
            <div className="alert-list">
              {byGroup[g].map((a) => {
                const meta = ALERT_META[a.type] || { icon: "bell" as IconName, tone: "slate" };
                return (
                  <button key={a.id} className={"alert-row" + (a.read ? "" : " unread")} onClick={() => open(a)}>
                    {!a.read && <span className="alert-dot" />}
                    <span className={"alert-icon tone-" + meta.tone}><Icon name={meta.icon} size={15} /></span>
                    <span className="alert-main">
                      <span className="alert-title">{a.actor && <strong>u/{a.actor} </strong>}{a.title}</span>
                      {a.body && <span className="alert-body">{a.body}</span>}
                      <span className="alert-time">{a.time}</span>
                    </span>
                    <Icon name="chevron-right" size={15} className="alert-go" />
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </main>
  );
}

"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { routePath } from "@/lib/nav";
import { Icon } from "@/components/primitives/Icon";
import { Avatar } from "@/components/primitives/Avatar";
import { useAuthModal } from "@/components/auth/AuthModal";
import { getUnreadCount } from "@/app/actions/notifications";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { status, data: session } = useSession();
  const { openSignIn } = useAuthModal();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Unread notifications badge — re-fetched on navigation (and after marking read).
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (status === "authenticated") getUnreadCount().then(setUnread).catch(() => {});
  }, [status, pathname]);

  const signedIn = status === "authenticated";
  const user = session?.user;
  const unlocked = !!user?.unlocked;
  const name = user?.name ?? "";
  const initials = name ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "YOU";

  const active =
    pathname === "/" || pathname.startsWith("/company") ? "companies"
    : pathname.startsWith("/community") || pathname.startsWith("/thread") ? "community"
    : pathname.startsWith("/mentorboard") ? "mentorboard"
    : pathname.startsWith("/me") ? "me"
    : pathname.startsWith("/alerts") ? "alerts"
    : "";

  return (
    <nav className="topnav">
      <Link className="brand" href="/">Intern<span className="dot">·</span>vention</Link>
      <button className="nav-search" onClick={() => { /* TODO(P12): command palette */ }}>
        <Icon name="search" size={14} /> Search companies, roles, majors…
        <kbd className="nav-search-kbd">⌘K</kbd>
      </button>
      <div className="nav-right">
        <Link className={active === "companies" ? "active" : ""} href={routePath({ name: "directory" })}>Companies</Link>
        <Link className={active === "community" ? "active" : ""} href={routePath({ name: "community", scope: "__main__" })}>Community</Link>
        <Link className={active === "mentorboard" ? "active" : ""} href={routePath({ name: "mentorboard" })}>Mentorboard</Link>
        <Link className={active === "me" ? "active" : ""} href={routePath({ name: "contributions" })}>My Contributions</Link>
        <Link className={"nav-alerts" + (active === "alerts" ? " active" : "")} href={routePath({ name: "alerts" })}>
          Alerts{signedIn && unread > 0 && <span className="nav-badge">{unread}</span>}
        </Link>
        {!signedIn ? (
          <button className="signin-nav-btn" onClick={openSignIn}>Sign in</button>
        ) : (
          <div className="avatar-wrap" ref={ref}>
            <Avatar text={initials} size={30} onClick={() => setMenu(!menu)} title="Account" />
            {menu && (
              <div className="acct-menu">
                <div className="acct-head">
                  {name || "Signed in"}
                  <span>u/{user?.username ?? "…"}</span>
                </div>
                <div className="acct-status">
                  {unlocked ? (
                    <>
                      <Icon name="check-circle" size={13} /> Unlocked
                    </>
                  ) : (
                    <>
                      <Icon name="lock" size={13} /> Verified — not yet contributed
                    </>
                  )}
                </div>
                {!unlocked && (
                  <button onClick={() => { setMenu(false); router.push(routePath({ name: "contribute" })); }}>
                    <Icon name="plus" size={13} /> Contribute &amp; unlock
                  </button>
                )}
                <button onClick={() => { setMenu(false); signOut(); }}>
                  <Icon name="arrow-left" size={13} /> Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

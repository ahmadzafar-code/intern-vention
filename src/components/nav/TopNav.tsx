"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { routePath } from "@/lib/nav";
import { Icon } from "@/components/primitives/Icon";

// Skeletal nav: links + search affordance, signed-out state only.
// P3 wires the auth-aware account menu / sign-in; P12 wires ⌘K search.
export function TopNav() {
  const pathname = usePathname();
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
        <Link className={"nav-alerts" + (active === "alerts" ? " active" : "")} href={routePath({ name: "alerts" })}>Alerts</Link>
        <button className="signin-nav-btn" onClick={() => { /* TODO(P3): open sign-in */ }}>Sign in</button>
      </div>
    </nav>
  );
}

import type { CSSProperties } from "react";

// Ported verbatim from prototype_src/src/components.jsx (shared SVG icon set).
// No "use client": pure render, usable from both server and client components.
export type IconName =
  | "search" | "comment" | "share" | "chevron-down" | "chevron-right" | "chevron-left"
  | "lock" | "user" | "check" | "check-circle" | "plus" | "bell" | "x" | "sliders"
  | "arrow-left" | "trend-up" | "fire" | "clock" | "star" | "copy" | "sparkle" | "send";

export function Icon({
  name,
  size = 16,
  stroke = 2,
  style,
  className,
}: {
  name: IconName | string;
  size?: number;
  stroke?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const p: React.SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style,
    className,
  };
  switch (name) {
    case "search": return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
    case "comment": return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case "share": return <svg {...p}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" /></svg>;
    case "chevron-down": return <svg {...p}><path d="M6 9l6 6 6-6" /></svg>;
    case "chevron-right": return <svg {...p}><path d="M9 18l6-6-6-6" /></svg>;
    case "chevron-left": return <svg {...p}><path d="M15 18l-6-6 6-6" /></svg>;
    case "lock": return <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
    case "user": return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case "check": return <svg {...p}><path d="M20 6 9 17l-5-5" /></svg>;
    case "check-circle": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>;
    case "plus": return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case "bell": return <svg {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>;
    case "x": return <svg {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>;
    case "sliders": return <svg {...p}><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>;
    case "arrow-left": return <svg {...p}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>;
    case "trend-up": return <svg {...p}><path d="M23 6l-9.5 9.5-5-5L1 18" /><path d="M17 6h6v6" /></svg>;
    case "fire": return <svg {...p} fill="currentColor" stroke="none"><path d="M12 2c1 3-1 4-2 6-1 1.8-.5 4 1 5 .8-1 .7-2.4.5-3.5 1.6 1 3 3 3 5.2A5 5 0 1 1 7 15c0-1.4.6-2.6 1.4-3.6C9 13 10 13.6 10.7 13c-1.4-2.2-.4-5 1.3-7 .3-1.3 0-2.7 0-4z" /></svg>;
    case "clock": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "star": return <svg {...p}><path d="M12 2l2.9 6.3 6.8.7-5 4.6 1.4 6.7L12 17.8 5.9 20.3 7.3 13.6l-5-4.6 6.8-.7z" /></svg>;
    case "copy": return <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
    case "sparkle": return <svg {...p} fill="currentColor" stroke="none"><path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6z" /></svg>;
    case "send": return <svg {...p}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4z" /></svg>;
    default: return null;
  }
}

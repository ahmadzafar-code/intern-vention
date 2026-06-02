/* =========================================================================
   Intern·vention — shared UI atoms
   ========================================================================= */
const { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } = React;

/* ----------------------------------------------------------------- Icons */
function Icon({ name, size = 16, stroke = 2, style, className }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", style, className };
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

/* ----------------------------------------------------------------- OpenAI mark */
function OpenAIMark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" aria-label="OpenAI">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.5093-2.6067-1.5093Z" />
    </svg>
  );
}

/* ----------------------------------------------------------------- Logo tile */
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  To use logo.dev's sharp logos: sign up free at https://logo.dev,         │
// │  grab your PUBLISHABLE key (starts with "pk_"), and paste it below.        │
// │  Leave blank to use the no-token favicon service instead.                  │
// └─────────────────────────────────────────────────────────────────────────┘
const LOGO_DEV_TOKEN = "pk_GPjIAuXNTVmwfUsjmuW2gA"; // e.g. "pk_XXXXXXXXXXXXXXXXXXXX"

// Ordered list of logo sources to try; each falls back to the next on error,
// finally landing on the colored monogram tile.
function logoSources(company) {
  const out = [];
  if (company.domain) {
    if (LOGO_DEV_TOKEN) {
      out.push(`https://img.logo.dev/${company.domain}?token=${LOGO_DEV_TOKEN}&size=128&format=png&retina=true&fallback=404`);
    }
    out.push(`https://www.google.com/s2/favicons?domain=${company.domain}&sz=128`);
  }
  return out;
}

function Logo({ company, size = 46, radius = 10 }) {
  const sources = logoSources(company);
  const [idx, setIdx] = useState(0);
  const src = sources[idx];
  if (src) {
    return (
      <div className="logo-tile-c logo-img-tile" style={{ width: size, height: size, borderRadius: radius }}>
        <img className="logo-img" src={src} alt={company.name}
          width={Math.round(size * 0.62)} height={Math.round(size * 0.62)}
          loading="lazy" referrerPolicy="no-referrer" onError={() => setIdx(idx + 1)} />
      </div>
    );
  }
  const dim = { width: size, height: size, borderRadius: radius, background: company.bg || "#0E0E0C" };
  return (
    <div className="logo-tile-c" style={dim}>
      {company.logo === "openai"
        ? <OpenAIMark size={Math.round(size * 0.56)} />
        : <span className="logo-letter" style={{ fontSize: Math.round(size * 0.48) }}>{(company.logo || company.name[0]).toUpperCase()}</span>}
    </div>
  );
}

/* ----------------------------------------------------------------- Flair pill */
const FLAIR_LABEL = {
  question: "Question", poll: "Poll", vent: "Vent", success: "Success",
  tips: "Tips", discussion: "Discussion", update: "Update",
};
function Flair({ kind }) {
  return <span className={"flair flair-" + kind}>{FLAIR_LABEL[kind] || kind}</span>;
}

/* ----------------------------------------------------------------- Avatar */
function Avatar({ text, size = 30, onClick, unsigned, title }) {
  if (unsigned) {
    return (
      <button className="avatar unsigned" style={{ width: size, height: size }} onClick={onClick} title={title || "Sign in"} aria-label="Sign in">
        <Icon name="user" size={Math.round(size * 0.53)} />
      </button>
    );
  }
  return <div className="avatar" style={{ width: size, height: size }} onClick={onClick} title={title}>{text}</div>;
}

/* ----------------------------------------------------------------- VoteWidget */
// dir: 0 none, 1 up, -1 down ; base is the displayed-neutral count
function VoteWidget({ base, dir, onChange, compact }) {
  const display = base + (dir === 1 ? 1 : dir === -1 ? -1 : 0);
  const [pop, setPop] = useState(false);
  const bump = (next) => {
    onChange(next);
    setPop(true);
    setTimeout(() => setPop(false), 220);
  };
  return (
    <div className={"post-vote" + (compact ? " compact" : "")}>
      <button className={dir === 1 ? "upvoted" : ""} aria-label="upvote" onClick={() => bump(dir === 1 ? 0 : 1)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 10h-5v6h-6v-6H4z" /></svg>
      </button>
      <span className={"vote-count" + (dir === 1 ? " upvoted" : dir === -1 ? " downvoted" : "") + (pop ? " pop" : "")}>{display}</span>
      <button className={dir === -1 ? "downvoted" : ""} aria-label="downvote" onClick={() => bump(dir === -1 ? 0 : -1)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l-8-10h5V4h6v6h5z" /></svg>
      </button>
    </div>
  );
}

/* ----------------------------------------------------------------- Toast host */
const ToastCtx = createContext(null);
function useToast() { return useContext(ToastCtx); }
function ToastHost({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, icon: opts.icon, tone: opts.tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts.duration || 2600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-host">
        {toasts.map((t) => (
          <div key={t.id} className={"toast" + (t.tone ? " toast-" + t.tone : "")}>
            {t.icon && <Icon name={t.icon} size={15} />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ----------------------------------------------------------------- Confetti */
function fireConfetti() {
  const colors = ["#8C1515", "#E0A800", "#2F7D32", "#4A90E2", "#C2502F", "#5B21B6"];
  const host = document.createElement("div");
  host.className = "confetti-host";
  document.body.appendChild(host);
  for (let i = 0; i < 70; i++) {
    const bit = document.createElement("div");
    bit.className = "confetti-bit";
    const left = Math.random() * 100;
    const delay = Math.random() * 0.25;
    const dur = 1.5 + Math.random() * 1.2;
    const size = 6 + Math.random() * 7;
    bit.style.left = left + "vw";
    bit.style.width = size + "px";
    bit.style.height = size * (0.5 + Math.random()) + "px";
    bit.style.background = colors[i % colors.length];
    bit.style.animationDelay = delay + "s";
    bit.style.animationDuration = dur + "s";
    bit.style.transform = `rotate(${Math.random() * 360}deg)`;
    host.appendChild(bit);
  }
  setTimeout(() => host.remove(), 3200);
}

/* ----------------------------------------------------------------- exports */
Object.assign(window, {
  Icon, OpenAIMark, Logo, Flair, FLAIR_LABEL, Avatar, VoteWidget,
  ToastHost, useToast, fireConfetti,
  useState, useEffect, useRef, useCallback, useMemo, createContext, useContext,
});

"use client";
import { useEffect, useState } from "react";
import { MONTHS } from "@/lib/constants";

// Animated SVG charts ported from prototype_src/src/company.jsx. Fed server-computed
// slices (no client data fetching). Local Slice type avoids importing the server-only
// report module into the client bundle.
type Slice = { label: string; pct: number };

export function MajorPie({ majors }: { majors: Slice[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);
  const shades = ["var(--accent)", "#C2502F", "#E0A800", "#57544D", "#A3A09A"];
  const cum = majors.map((_, i) => majors.slice(0, i).reduce((s, x) => s + x.pct, 0)); // prefix sums (no render mutation)
  return (
    <div className="major-pie-wrap">
      <svg className="donut-svg" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="15.915" fill="none" stroke="#F4F4F2" strokeWidth="9" />
        {majors.map((m, i) => (
          <circle
            key={i}
            cx="21"
            cy="21"
            r="15.915"
            fill="none"
            stroke={shades[i % shades.length]}
            strokeWidth="9"
            strokeDasharray={`${mounted ? m.pct : 0} ${100 - (mounted ? m.pct : 0)}`}
            strokeDashoffset={-cum[i] + 25}
            style={{ transition: "stroke-dasharray .7s cubic-bezier(.2,.8,.2,1)", transitionDelay: i * 90 + "ms" }}
          />
        ))}
      </svg>
      <div className="donut-legend">
        {majors.map((m, i) => (
          <div className="item" key={m.label}>
            <span className="sw" style={{ background: shades[i % shades.length] }} />
            <span>{m.label}</span>
            <span className="pct">{m.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChannelDonut({ channels }: { channels: Slice[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);
  const shades = ["#1A1A18", "#57544D", "#A3A09A", "#C9C6C0"];
  const cum = channels.map((_, i) => channels.slice(0, i).reduce((s, x) => s + x.pct, 0)); // prefix sums (no render mutation)
  const top = channels[0] ?? { label: "—", pct: 0 };
  return (
    <div className="donut-wrap">
      <svg className="donut-svg" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="15.915" fill="none" stroke="#F4F4F2" strokeWidth="6" />
        {channels.map((c, i) => (
          <circle
            key={i}
            cx="21"
            cy="21"
            r="15.915"
            fill="none"
            stroke={shades[i % shades.length]}
            strokeWidth="6"
            strokeDasharray={`${mounted ? c.pct : 0} ${100 - (mounted ? c.pct : 0)}`}
            strokeDashoffset={-cum[i] + 25}
            style={{ transition: "stroke-dasharray .7s cubic-bezier(.2,.8,.2,1)", transitionDelay: i * 90 + "ms" }}
          />
        ))}
        <text x="21" y="20.5" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#1A1A18">{top.pct}%</text>
        <text x="21" y="26" textAnchor="middle" fontSize="3.1" fill="#908C82">via {top.label.toLowerCase()}</text>
      </svg>
      <div className="donut-legend">
        {channels.map((c, i) => (
          <div className="item" key={c.label}>
            <span className="sw" style={{ background: shades[i % shades.length] }} />
            <span>{c.label}</span>
            <span className="pct">{c.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimingChart({ applied, offer }: { applied: number[]; offer: number[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);
  const data = applied.length ? applied : new Array(12).fill(0);
  const off = offer.length ? offer : data.map(() => 0);
  const max = Math.max(...data, ...off, 1);
  const W = 1180, H = 210, x0 = 40, top = 20, bottom = 170;
  const span = W - x0 - 10;
  const step = span / data.length;
  const ticks = [0, Math.ceil(max / 2), max];
  return (
    <svg className="timing-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <line x1={x0} y1={top} x2={x0} y2={bottom} stroke="#E7E5E0" strokeWidth="1" />
      <line x1={x0} y1={bottom} x2={W - 10} y2={bottom} stroke="#D4D2CC" strokeWidth="1" />
      {ticks.map((t, i) => {
        const y = bottom - (t / max) * (bottom - top);
        return (
          <g key={i}>
            {i > 0 && <line x1={x0} y1={y} x2={W - 10} y2={y} stroke="#F4F4F2" strokeWidth="1" strokeDasharray="2,3" />}
            <text x={x0 - 8} y={y + 3} textAnchor="end" fontSize="10.5" fill="#908C82">{t}</text>
          </g>
        );
      })}
      {data.map((v, i) => {
        const groupW = step * 0.56;
        const bw = groupW / 2 - 1;
        const gx = x0 + i * step + (step - groupW) / 2;
        const aH = mounted ? (v / max) * (bottom - top) : 0;
        const oH = mounted ? (off[i] / max) * (bottom - top) : 0;
        return (
          <g key={i}>
            <rect x={gx} y={bottom - aH} width={bw} height={aH} rx="2" fill="var(--accent)" style={{ transition: "y .6s cubic-bezier(.2,.8,.2,1), height .6s cubic-bezier(.2,.8,.2,1)", transitionDelay: i * 30 + "ms", opacity: v === 0 ? 0.18 : 1 }} />
            <rect x={gx + bw + 2} y={bottom - oH} width={bw} height={oH} rx="2" fill="#1A1A18" style={{ transition: "y .6s cubic-bezier(.2,.8,.2,1), height .6s cubic-bezier(.2,.8,.2,1)", transitionDelay: i * 30 + 90 + "ms", opacity: off[i] === 0 ? 0.18 : 1 }} />
          </g>
        );
      })}
      <g fontSize="11" fill="#908C82">
        {MONTHS.map((m, i) => (
          <text key={m} x={x0 + i * step + step / 2} y="190" textAnchor="middle">{m}</text>
        ))}
      </g>
    </svg>
  );
}

export function RoundsBreakdown({ rounds }: { rounds: { technical: number; behavioral: number } }) {
  const tech = rounds.technical;
  const behav = rounds.behavioral;
  const total = tech + behav;
  return (
    <section className="card rounds-card">
      <div className="chart-head">
        <h2>Interview rounds</h2>
        <span className="small-meta">median · {total} rounds total</span>
      </div>
      <div className="rounds-bar">
        <span className="rb-seg rb-tech" style={{ flexGrow: tech, flexBasis: 0 }}>
          <span className="rb-n">{tech}</span>
          <span className="rb-l">Technical</span>
        </span>
        {behav > 0 && (
          <span className="rb-seg rb-behav" style={{ flexGrow: behav, flexBasis: 0 }}>
            <span className="rb-n">{behav}</span>
            <span className="rb-l">Behavioral</span>
          </span>
        )}
      </div>
      <div className="rounds-legend">
        <span>
          <span className="dot tech" /> Technical (OA, coding, case) · {tech}
        </span>
        <span>
          <span className="dot behav" /> Behavioral (fit, &quot;why us&quot;) · {behav || "—"}
        </span>
      </div>
    </section>
  );
}

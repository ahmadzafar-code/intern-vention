"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/primitives/Icon";
import { GPA_BUCKETS } from "@/lib/constants";

const MAJOR_OPTS = ["All", "Computer Science", "Symbolic Systems", "Mathematical & Computational Science", "Economics", "Mathematics", "Electrical Engineering", "Other"];
const YEAR_OPTS = ["All", "Freshman", "Sophomore", "Junior", "Senior", "Coterm", "Alum"];
const GPA_OPTS = ["All", ...GPA_BUCKETS.filter((g) => g !== "Prefer not to say")];

// Filters drive URL searchParams → the RSC re-computes cohortReport server-side, so the
// n≥5 guard applies to every filter combination (can't be bypassed client-side).
export function CompanyControls({ roles, current }: { roles: string[]; current: { role: string; major: string; year: string; gpa: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const update = (key: string, val: string, allVal: string) => {
    const p = new URLSearchParams(sp.toString());
    if (val === allVal) p.delete(key);
    else p.set(key, val);
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="controls">
      <RoleSelect roles={roles} value={current.role} onChange={(v) => update("role", v, "All roles")} />
      <div className="divider-v" />
      <FilterChip label="Major" value={current.major} options={MAJOR_OPTS} onChange={(v) => update("major", v, "All")} />
      <FilterChip label="Class year" value={current.year} options={YEAR_OPTS} onChange={(v) => update("year", v, "All")} />
      <FilterChip label="GPA bucket" value={current.gpa} options={GPA_OPTS} onChange={(v) => update("gpa", v, "All")} />
    </div>
  );
}

function RoleSelect({ roles, value, onChange }: { roles: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const all = ["All roles", ...roles];
  const cur = all.includes(value) ? value : "All roles";
  return (
    <div className="role-select" ref={ref}>
      <button className={"role-trigger" + (open ? " open" : "")} onClick={() => setOpen(!open)}>
        <span className="rt-col">
          <span className="label">Role</span>
          <span className="value">{cur}</span>
        </span>
        <Icon name="chevron-down" size={14} className="chev" />
      </button>
      {open && (
        <div className="role-menu open">
          {all.map((r) => (
            <button key={r} className={"role-option" + (r === cur ? " selected" : "")} onClick={() => { onChange(r); setOpen(false); }}>
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const active = value && value !== "All";
  return (
    <div className="filter-chip-wrap" ref={ref}>
      <button className={"chip" + (active ? " active" : "")} onClick={() => setOpen(!open)}>
        {active ? value : label}
        <Icon name="chevron-down" size={10} stroke={2.5} />
      </button>
      {open && (
        <div className="chip-menu">
          {options.map((o) => (
            <button key={o} className={"chip-opt" + (o === value ? " sel" : "")} onClick={() => { onChange(o); setOpen(false); }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

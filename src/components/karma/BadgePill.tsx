import { BADGES } from "@/lib/karma";
import { Icon, type IconName } from "@/components/primitives/Icon";

export function BadgePill({ id, size }: { id: string; size?: "sm" }) {
  const b = BADGES[id];
  if (!b) return null;
  return (
    <span className={"badge-pill tone-" + b.tone + (size === "sm" ? " sm" : "")} title={b.desc}>
      {b.icon && <Icon name={b.icon as IconName} size={size === "sm" ? 9 : 11} />}
      {b.label}
    </span>
  );
}

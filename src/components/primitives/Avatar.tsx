"use client";
import { Icon } from "./Icon";

// Ported from prototype_src/src/components.jsx.
export function Avatar({
  text,
  size = 30,
  onClick,
  unsigned,
  title,
}: {
  text?: string;
  size?: number;
  onClick?: () => void;
  unsigned?: boolean;
  title?: string;
}) {
  if (unsigned) {
    return (
      <button
        className="avatar unsigned"
        style={{ width: size, height: size }}
        onClick={onClick}
        title={title || "Sign in"}
        aria-label="Sign in"
      >
        <Icon name="user" size={Math.round(size * 0.53)} />
      </button>
    );
  }
  return (
    <div className="avatar" style={{ width: size, height: size }} onClick={onClick} title={title}>
      {text}
    </div>
  );
}

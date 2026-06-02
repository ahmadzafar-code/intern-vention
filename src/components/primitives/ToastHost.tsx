"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type ToastOpts = { icon?: IconName | string; tone?: "good" | string; duration?: number };
type ToastFn = (msg: string, opts?: ToastOpts) => void;

const ToastCtx = createContext<ToastFn | null>(null);

export function useToast(): ToastFn {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastHost>");
  return ctx;
}

type Toast = { id: string; msg: string; icon?: string; tone?: string };

export function ToastHost({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback<ToastFn>((msg, opts = {}) => {
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

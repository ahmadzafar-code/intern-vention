"use client";
import type { ReactNode } from "react";
import { ToastHost } from "@/components/primitives/ToastHost";

// Client provider boundary. P3 adds <SessionProvider>; P4 adds the auth-modal trigger context.
export function Providers({ children }: { children: ReactNode }) {
  return <ToastHost>{children}</ToastHost>;
}

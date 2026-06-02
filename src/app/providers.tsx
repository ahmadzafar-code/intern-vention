"use client";
import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ToastHost } from "@/components/primitives/ToastHost";
import { AuthModalProvider } from "@/components/auth/AuthModal";

// Client provider boundary: session, toasts, and the auth/onboarding modal.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ToastHost>
        <AuthModalProvider>{children}</AuthModalProvider>
      </ToastHost>
    </SessionProvider>
  );
}

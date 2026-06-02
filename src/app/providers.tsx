"use client";
import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ToastHost } from "@/components/primitives/ToastHost";
import { AuthModalProvider } from "@/components/auth/AuthModal";
import { CommandPaletteProvider } from "@/components/nav/CommandPalette";

// Client provider boundary: session, toasts, auth/onboarding modal, ⌘K palette.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ToastHost>
        <AuthModalProvider>
          <CommandPaletteProvider>{children}</CommandPaletteProvider>
        </AuthModalProvider>
      </ToastHost>
    </SessionProvider>
  );
}

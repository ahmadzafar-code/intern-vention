import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "./providers";
import { TopNav } from "@/components/nav/TopNav";

// Only webfont we self-host: JetBrains Mono (u/handle, URLs, kbd). Headings use the local
// "Iowan Old Style"/Charter/Georgia serif stack; body uses the system sans stack (both in globals.css).
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Intern·vention",
  description: "Give-to-get, anonymous-but-verified recruiting intelligence for Stanford students.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body className="playful density-regular">
        <Providers>
          <TopNav />
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

"use client";
import { useRouter } from "next/navigation";

// The prototype's hash router ({name,...} → "#/path") becomes the App Router dir tree.
// This shim preserves the prototype's nav.go({name,...}) call shape so ported components
// need minimal edits. routePath() is the single source of truth for the {name}→path map.
export type Route =
  | { name: "directory" }
  | { name: "company"; slug: string }
  | { name: "contribute"; slug?: string }
  | { name: "community"; scope: string }
  | { name: "contributions" }
  | { name: "alerts" }
  | { name: "mentorboard" }
  | { name: "thread"; scope: string; postId: string };

export function routePath(r: Route): string {
  switch (r.name) {
    case "company": return `/company/${r.slug}`;
    case "contribute": return r.slug ? `/contribute/${r.slug}` : "/contribute";
    case "community": return `/community/${encodeURIComponent(r.scope)}`;
    case "contributions": return "/me";
    case "alerts": return "/alerts";
    case "mentorboard": return "/mentorboard";
    case "thread": return `/thread/${encodeURIComponent(r.scope)}/${r.postId}`;
    case "directory":
    default: return "/";
  }
}

export function useNav() {
  const router = useRouter();
  return {
    go: (r: Route) => router.push(routePath(r)),
    back: () => router.back(),
    openSearch: () => {
      /* TODO(P12): open the ⌘K command palette */
    },
  };
}

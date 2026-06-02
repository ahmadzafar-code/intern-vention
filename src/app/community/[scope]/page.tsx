import { auth } from "@/auth";
import { isUnlocked } from "@/lib/session";
import { getPosts } from "@/lib/queries/feed";
import { getCompany } from "@/lib/queries/companies";
import { INDUSTRIES } from "@/lib/constants";
import { CommunityScreen } from "@/components/feed/CommunityScreen";

async function buildMeta(scope: string) {
  if (scope === "__main__") {
    return { kind: "main", title: "All of Stanford", blurb: "Every recruiting conversation across campus — internships and full-time, every industry." };
  }
  if (scope.startsWith("ind:")) {
    const k = scope.slice(4);
    const i = INDUSTRIES.find((x) => x.key === k);
    return { kind: "industry", title: `${i?.label ?? k} recruiting`, blurb: `The ${i?.label ?? k} forum — interviews, timelines, and offers.` };
  }
  const c = await getCompany(scope);
  return { kind: "company", title: c?.name ?? scope, blurb: `Company-specific thread for ${c?.name ?? scope} recruiting — interviews, timelines, and offers.` };
}

export default async function CommunityPage({ params }: { params: Promise<{ scope: string }> }) {
  const { scope: raw } = await params;
  const scope = decodeURIComponent(raw);
  const session = await auth();
  const unlocked = await isUnlocked();
  // Locked users get no real posts (no gated-content leak) — the screen shows a placeholder.
  const posts = unlocked ? await getPosts(scope, session?.user?.id ?? null) : [];
  const meta = await buildMeta(scope);
  return <CommunityScreen scope={scope} posts={posts} unlocked={unlocked} meta={meta} />;
}

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isUnlocked } from "@/lib/session";
import { listApprovedWithCounts } from "@/lib/queries/companies";
import { getPosts } from "@/lib/queries/feed";
import { DirectoryView } from "@/components/directory/DirectoryView";
import { CommunityThread } from "@/components/feed/CommunityThread";

// Render per-request (not prerendered at build): the directory shows live company data,
// and a DB query must never run at build time (where DATABASE_URL isn't available).
export const dynamic = "force-dynamic";

// Home = the two-column layout: the main Community Thread (left) + the company directory.
export default async function Home() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const unlocked = await isUnlocked();
  const [companies, postCount, posts] = await Promise.all([
    listApprovedWithCounts(),
    prisma.post.count({ where: { scope: "__main__" } }),
    unlocked ? getPosts("__main__", userId) : Promise.resolve([]),
  ]);
  return (
    <div className="layout">
      <CommunityThread
        scope="__main__"
        nameStrong="Main Community Thread"
        meta={`all of Stanford recruiting · ${postCount} post${postCount === 1 ? "" : "s"}`}
        lockHeading="Contribute to unlock"
        lockBody="Add your recruiting story in 90 seconds — it unlocks the full Community Thread and helps the next class."
        posts={posts}
        unlocked={unlocked}
        live
      />
      <DirectoryView companies={companies} />
    </div>
  );
}

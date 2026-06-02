import { auth } from "@/auth";
import { getMyProfile } from "@/lib/queries/me";
import { MyContributions } from "@/components/me/MyContributions";

export default async function MePage() {
  const session = await auth();
  const profile = session?.user ? await getMyProfile(session.user.id) : null;
  return <MyContributions profile={profile} />;
}

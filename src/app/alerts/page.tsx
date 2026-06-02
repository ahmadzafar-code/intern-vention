import { auth } from "@/auth";
import { listNotifications } from "@/lib/queries/notifications";
import { AlertsView } from "@/components/alerts/AlertsView";

export default async function AlertsPage() {
  const session = await auth();
  const notifications = session?.user ? await listNotifications(session.user.id) : null;
  return <AlertsView notifications={notifications} />;
}

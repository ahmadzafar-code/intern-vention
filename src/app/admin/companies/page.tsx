import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listPendingRequests } from "@/lib/queries/companies";
import { AdminQueue } from "@/components/admin/AdminQueue";

// Admin-only; non-admins get a 404 (route is not discoverable). isAdmin is set in the DB.
export default async function AdminCompaniesPage() {
  const session = await auth();
  if (!session?.user) notFound();
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } });
  if (!me?.isAdmin) notFound();
  const requests = await listPendingRequests();
  return <AdminQueue requests={requests} />;
}

import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCompany, getCompanyRoles } from "@/lib/queries/companies";
import { ContributeSignInGate } from "@/components/contribute/ContributeSignInGate";
import { ContributeForm } from "@/components/contribute/ContributeForm";

// Step 2: the contribution form. Sign-in gated; profile completeness is enforced both by
// the auto-onboarding modal and server-side in the contribute action.
export default async function ContributeFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) return <ContributeSignInGate />;

  const company = await getCompany(slug);
  if (!company) notFound();

  const [roles, me] = await Promise.all([
    getCompanyRoles(slug, company.industry),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { major: true, gradYear: true, gpa: true },
    }),
  ]);

  return (
    <ContributeForm
      company={company}
      roles={roles}
      profile={{ major: me?.major ?? null, gradYear: me?.gradYear ?? null, gpa: me?.gpa ?? null }}
      pending={company.status === "PENDING"}
    />
  );
}

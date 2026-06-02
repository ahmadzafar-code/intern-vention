import { auth } from "@/auth";
import { listApprovedWithCounts } from "@/lib/queries/companies";
import { ContributeSignInGate } from "@/components/contribute/ContributeSignInGate";
import { ContributePicker } from "@/components/contribute/ContributePicker";

// Step 1: pick a company. Sign-in gated (matches the prototype's ContributeView).
export default async function ContributePickerPage() {
  const session = await auth();
  if (!session?.user) return <ContributeSignInGate />;
  const companies = await listApprovedWithCounts();
  return <ContributePicker companies={companies} />;
}

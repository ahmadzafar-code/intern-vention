import { listApprovedWithCounts } from "@/lib/queries/companies";
import { DirectoryView } from "@/components/directory/DirectoryView";

// Home = the company directory (RSC fetches approved companies + real report counts).
export default async function Home() {
  const companies = await listApprovedWithCounts();
  return <DirectoryView companies={companies} />;
}

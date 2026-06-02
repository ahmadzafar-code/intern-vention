import { listApprovedWithCounts } from "@/lib/queries/companies";
import { DirectoryView } from "@/components/directory/DirectoryView";

// Render per-request (not prerendered at build): the directory shows live company data,
// and a DB query must never run at build time (where DATABASE_URL isn't available).
export const dynamic = "force-dynamic";

// Home = the company directory (RSC fetches approved companies + real report counts).
export default async function Home() {
  const companies = await listApprovedWithCounts();
  return <DirectoryView companies={companies} />;
}

import { type NextRequest, NextResponse } from "next/server";
import { isUnlocked } from "@/lib/session";
import { searchAll } from "@/lib/queries/search";

// The one client-fetched GET surface (the ⌘K palette). Reads stay RSC-direct elsewhere.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const unlocked = await isUnlocked();
  return NextResponse.json(await searchAll(q, unlocked));
}

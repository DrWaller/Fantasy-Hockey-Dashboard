import { NextResponse } from "next/server";
import { getLiveRosters } from "@/lib/yahooRosterStore";

export async function GET() {
  const { rosters, syncedAt } = await getLiveRosters();
  if (rosters) {
    return NextResponse.json({ baseline: rosters, source: "yahoo", syncedAt });
  }
  // null baseline tells the client to use its own bundled static import
  return NextResponse.json({ baseline: null, source: "static", syncedAt: null });
}

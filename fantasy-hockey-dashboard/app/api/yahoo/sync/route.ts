import { NextResponse } from "next/server";
import { syncLiveRosters } from "@/lib/yahooRosterStore";

export async function POST() {
  try {
    const rosters = await syncLiveRosters();
    return NextResponse.json({ ok: true, teamCount: Object.keys(rosters).length });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to sync from Yahoo" },
      { status: 502 }
    );
  }
}

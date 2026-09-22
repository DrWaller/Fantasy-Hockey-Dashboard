import { NextResponse } from "next/server";
import { isYahooConnected } from "@/lib/yahooAuth";
import { getLiveRosters } from "@/lib/yahooRosterStore";

export async function GET() {
  const connected = await isYahooConnected();
  const { syncedAt } = await getLiveRosters();
  return NextResponse.json({ connected, syncedAt });
}

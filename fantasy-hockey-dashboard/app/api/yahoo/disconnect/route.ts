import { NextResponse } from "next/server";
import { disconnectYahoo } from "@/lib/yahooAuth";

export async function POST() {
  await disconnectYahoo();
  return NextResponse.json({ ok: true });
}

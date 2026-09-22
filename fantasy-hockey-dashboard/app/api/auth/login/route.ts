import { NextRequest, NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/yahooAuth";

export async function GET(req: NextRequest) {
  const state = Math.random().toString(36).slice(2);
  return NextResponse.redirect(getAuthorizationUrl(state));
}

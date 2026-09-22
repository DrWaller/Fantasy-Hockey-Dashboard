import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/yahooAuth";
import { syncLiveRosters } from "@/lib/yahooRosterStore";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const base = req.nextUrl.origin;

  if (error) {
    return NextResponse.redirect(`${base}/?yahoo_error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return NextResponse.redirect(`${base}/?yahoo_error=no_code`);
  }

  try {
    await exchangeCodeForTokens(code);
    // Sync immediately so the dashboard has live data right away. If this
    // specific step fails (e.g. the parsing layer needs a fix), the OAuth
    // connection itself still succeeded — surface the sync error
    // separately rather than losing the successful login.
    try {
      await syncLiveRosters();
      return NextResponse.redirect(`${base}/?yahoo_connected=1`);
    } catch (syncErr: any) {
      return NextResponse.redirect(
        `${base}/?yahoo_connected=1&yahoo_sync_error=${encodeURIComponent(syncErr.message ?? "sync failed")}`
      );
    }
  } catch (err: any) {
    return NextResponse.redirect(
      `${base}/?yahoo_error=${encodeURIComponent(err.message ?? "auth failed")}`
    );
  }
}

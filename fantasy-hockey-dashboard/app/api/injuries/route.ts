import { NextResponse } from "next/server";
import { parseEspnInjuries, type InjuriesPayload } from "@/lib/injuries";

export const revalidate = 900; // 15 minutes

const ESPN_INJURIES = "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/injuries";

// Always answers 200 with { ok:false } on any failure, so the dashboard just
// hides the injury column instead of breaking the table.
export async function GET() {
  try {
    const res = await fetch(ESPN_INJURIES, {
      headers: { Accept: "application/json" },
      next: { revalidate: 900 },
    });
    if (!res.ok) throw new Error(`ESPN injuries request failed: ${res.status}`);
    const injuries = parseEspnInjuries(await res.json());
    const payload: InjuriesPayload = { ok: Object.keys(injuries).length > 0, injuries };
    return NextResponse.json(payload);
  } catch (err: any) {
    const payload: InjuriesPayload = {
      ok: false,
      injuries: {},
      error: err?.message ?? "Failed to load injuries",
    };
    return NextResponse.json(payload);
  }
}

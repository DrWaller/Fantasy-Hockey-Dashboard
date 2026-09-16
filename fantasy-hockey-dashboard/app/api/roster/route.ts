import { NextRequest, NextResponse } from "next/server";
import { getAllOverrides, setOverride, clearOverride } from "@/lib/rosterOverrides";

export async function GET() {
  try {
    const overrides = await getAllOverrides();
    return NextResponse.json({ overrides });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to load roster changes" },
      { status: 502 }
    );
  }
}

// Add/move a player: { player: string, team: string | null }
// team: null means drop to free agency.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { player, team } = body ?? {};
    if (!player || typeof player !== "string") {
      return NextResponse.json({ error: "player is required" }, { status: 400 });
    }
    await setOverride(player, team ?? null);
    const overrides = await getAllOverrides();
    return NextResponse.json({ overrides });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to save roster change" },
      { status: 502 }
    );
  }
}

// Revert a single player back to the draft-night baseline: ?player=Name
export async function DELETE(req: NextRequest) {
  try {
    const player = req.nextUrl.searchParams.get("player");
    if (!player) {
      return NextResponse.json({ error: "player is required" }, { status: 400 });
    }
    await clearOverride(player);
    const overrides = await getAllOverrides();
    return NextResponse.json({ overrides });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to revert roster change" },
      { status: 502 }
    );
  }
}

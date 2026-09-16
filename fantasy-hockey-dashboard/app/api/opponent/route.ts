import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const KEY = "week:opponent";

export async function GET() {
  try {
    const opponent = redis ? await redis.get<string>(KEY) : null;
    return NextResponse.json({ opponent: opponent ?? null });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to load this week's opponent" },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!redis) {
      throw new Error(
        "Roster database isn't connected yet — add the Upstash Redis integration first."
      );
    }
    const body = await req.json();
    const { opponent } = body ?? {};
    if (opponent === null) {
      await redis.del(KEY);
    } else if (typeof opponent === "string") {
      await redis.set(KEY, opponent);
    } else {
      return NextResponse.json({ error: "opponent must be a string or null" }, { status: 400 });
    }
    return NextResponse.json({ opponent: opponent ?? null });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to save this week's opponent" },
      { status: 502 }
    );
  }
}

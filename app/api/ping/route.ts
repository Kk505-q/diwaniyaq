import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { flushDuePoints } from "@/lib/points";
import { maybeSendDailyMotivation, maybeSendDailyReminder } from "@/lib/motivation";

// Lightweight health check that touches the database, so an external uptime
// pinger can keep the serverless database awake and avoid cold-start delays.
// It also applies scheduled (delayed) point adjustments that are now due, and
// sends the daily motivational email once a day — all without anyone browsing.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await flushDuePoints();
    await maybeSendDailyMotivation();
    await maybeSendDailyReminder();
    return NextResponse.json({ ok: true, t: Date.now() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

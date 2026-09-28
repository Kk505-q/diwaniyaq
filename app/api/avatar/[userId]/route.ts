import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Serves a user's profile picture stored in the database. Any logged-in user
// may view avatars (they appear beside names in shared views).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const viewer = await getCurrentUser();
  if (!viewer) return new NextResponse("Unauthorized", { status: 401 });

  const { userId } = await params;
  const avatar = await prisma.avatar.findUnique({ where: { userId } });
  if (!avatar) return new NextResponse("Not found", { status: 404 });

  const body = new Uint8Array(avatar.data);
  return new NextResponse(body, {
    headers: {
      "content-type": avatar.mimeType,
      "cache-control": "private, max-age=60",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox; style-src 'unsafe-inline'",
    },
  });
}

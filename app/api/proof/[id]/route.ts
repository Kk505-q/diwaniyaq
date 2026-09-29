import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Serves a proof file stored in the database. `id` is the ProofFile id.
// Access: the student who owns it, any supervisor/admin, or a parent linked to
// that student.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const proof = await prisma.proofFile.findUnique({
    where: { id },
    include: { completion: { select: { studentId: true } } },
  });
  if (!proof) return new NextResponse("Not found", { status: 404 });

  const studentId = proof.completion.studentId;
  let allowed = false;
  if (user.role === "ADMIN" || user.role === "SUPERVISOR") {
    allowed = true;
  } else if (user.role === "STUDENT" && user.id === studentId) {
    allowed = true;
  } else if (user.role === "PARENT") {
    const link = await prisma.parentChild.findFirst({
      where: { parentId: user.id, studentId },
    });
    allowed = !!link;
  }
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });

  const body = new Uint8Array(proof.data);
  return new NextResponse(body, {
    headers: {
      "content-type": proof.mimeType,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox; style-src 'unsafe-inline'",
      "content-disposition": "inline",
    },
  });
}

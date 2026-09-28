import { prisma } from "@/lib/db";

// Manual point adjustments are delayed before they take effect / become visible.
export const MANUAL_POINTS_DELAY_MS = 5 * 60 * 60 * 1000; // 5 hours

// Apply a points change immediately (used for automatic task points).
export async function applyPointsDelta(
  studentId: string,
  delta: number,
  reason: string,
  createdById: string
) {
  await prisma.$transaction([
    prisma.pointsLog.create({
      data: { studentId, delta, reason, createdById, applied: true, effectiveAt: new Date() },
    }),
    prisma.user.update({
      where: { id: studentId },
      data: { points: { increment: delta } },
    }),
  ]);
}

// Schedule a points change to take effect later (used for manual adjustments).
// It is not added to the student's total until `effectiveAt` passes.
export async function schedulePointsDelta(
  studentId: string,
  delta: number,
  reason: string,
  createdById: string,
  delayMs: number = MANUAL_POINTS_DELAY_MS
) {
  await prisma.pointsLog.create({
    data: {
      studentId,
      delta,
      reason,
      createdById,
      applied: false,
      effectiveAt: new Date(Date.now() + delayMs),
    },
  });
}

// Apply any scheduled adjustments whose effective time has passed. Cheap when
// nothing is due (a single indexed read). Safe against double-application: the
// updateMany guard ensures only one caller applies each entry.
export async function flushDuePoints() {
  const due = await prisma.pointsLog.findMany({
    where: { applied: false, effectiveAt: { lte: new Date() } },
    select: { id: true, studentId: true, delta: true },
  });
  if (due.length === 0) return;

  for (const d of due) {
    const claimed = await prisma.pointsLog.updateMany({
      where: { id: d.id, applied: false },
      data: { applied: true },
    });
    if (claimed.count === 1) {
      await prisma.user.update({
        where: { id: d.studentId },
        data: { points: { increment: d.delta } },
      });
    }
  }
}

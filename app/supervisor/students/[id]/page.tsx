import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatArabicDateTime } from "@/lib/dates";
import { STATUS_LABEL, STATUS_COLOR } from "@/lib/labels";
import { ReviewButtons } from "@/components/supervisor/ReviewButtons";
import { AllowResubmitButton } from "@/components/supervisor/AllowResubmitButton";
import { AdjustPointsForm } from "@/components/supervisor/AdjustPointsForm";
import { ProofLightbox } from "@/components/ProofLightbox";
import { flushDuePoints } from "@/lib/points";
import Link from "next/link";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SUPERVISOR");
  await flushDuePoints();
  const { id } = await params;

  const student = await prisma.user.findUnique({ where: { id } });
  if (!student || student.role !== "STUDENT") notFound();

  const completions = await prisma.taskCompletion.findMany({
    where: { studentId: id },
    include: { task: true, proofFiles: { select: { id: true, mimeType: true }, orderBy: { createdAt: "asc" } } },
    orderBy: { submittedAt: "desc" },
  });

  const pointsLog = await prisma.pointsLog.findMany({
    where: { studentId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/supervisor/progress" className="text-sm text-brand hover:underline">
          ← العودة إلى قائمة الطلاب
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{student.name}</h2>
            <p className="text-sm text-foreground/50" dir="ltr">
              {student.email}
            </p>
          </div>
          <div className="rounded-xl bg-accent-gold/10 px-4 py-2 text-center">
            <div className="text-2xl font-bold text-accent-gold">{student.points}</div>
            <div className="text-xs text-foreground/50">نقطة</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h3 className="font-bold">سجل الإنجازات</h3>
          {completions.length === 0 && (
            <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-foreground/50">
              لا يوجد سجل إنجازات بعد
            </div>
          )}
          {completions.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{c.task.title}</div>
                  <div className="text-xs text-foreground/50">{formatArabicDateTime(c.submittedAt)}</div>
                  {c.proofFiles.length > 0 && (
                    <div className="mt-2">
                      <ProofLightbox files={c.proofFiles} />
                    </div>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLOR[c.status]}`}>
                  {STATUS_LABEL[c.status]}
                </span>
              </div>
              {c.status === "PENDING_REVIEW" && (
                <div className="mt-3">
                  <ReviewButtons completionId={c.id} />
                </div>
              )}
              {c.status === "REJECTED" && (
                <div className="mt-3 space-y-2">
                  {c.rejectionReason && (
                    <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
                      سبب الرفض: {c.rejectionReason}
                    </p>
                  )}
                  <AllowResubmitButton completionId={c.id} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <AdjustPointsForm fixedStudentId={student.id} />
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-2 font-bold">سجل النقاط</h3>
            <div className="space-y-2 text-sm">
              {pointsLog.length === 0 && <p className="text-foreground/50">لا يوجد سجل بعد</p>}
              {pointsLog.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <span className="text-foreground/70">
                    {p.reason}
                    {!p.applied && (
                      <span className="ms-1 text-xs text-accent-gold">
                        (تُطبّق {formatArabicDateTime(p.effectiveAt)})
                      </span>
                    )}
                  </span>
                  <span
                    className={`font-bold ${!p.applied ? "text-foreground/40" : p.delta >= 0 ? "text-success" : "text-danger"}`}
                  >
                    {p.delta >= 0 ? "+" : ""}
                    {p.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

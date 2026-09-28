import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { formatArabicDateTime } from "@/lib/dates";
import { ReviewButtons } from "@/components/supervisor/ReviewButtons";
import { AllowResubmitButton } from "@/components/supervisor/AllowResubmitButton";
import { ProofLightbox } from "@/components/ProofLightbox";

export default async function SupervisorReviewPage() {
  await requireRole("SUPERVISOR");

  const [pending, rejected] = await Promise.all([
    prisma.taskCompletion.findMany({
      where: { status: "PENDING_REVIEW" },
      include: {
        task: true,
        student: true,
        proofFiles: { select: { id: true, mimeType: true }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { submittedAt: "asc" },
    }),
    prisma.taskCompletion.findMany({
      where: { status: "REJECTED" },
      include: {
        task: true,
        student: true,
        proofFiles: { select: { id: true, mimeType: true }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { reviewedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-lg font-bold">بانتظار المراجعة ({pending.length})</h2>

        {pending.length === 0 && (
          <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-foreground/60">
            لا توجد إثباتات بانتظار المراجعة حاليًا.
          </div>
        )}

        <div className="space-y-3">
          {pending.map((c) => (
            <div key={c.id} className="space-y-3 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{c.task.title}</div>
                  <div className="text-xs text-foreground/50">
                    {c.student.name} • {formatArabicDateTime(c.submittedAt)}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-accent-gold/10 px-2 py-1 text-xs font-bold text-accent-gold">
                  {c.task.points} نقطة
                </span>
              </div>

              {c.proofFiles.length > 0 ? (
                <ProofLightbox files={c.proofFiles} />
              ) : (
                <p className="text-xs text-foreground/40">لا توجد ملفات مرفقة</p>
              )}

              <ReviewButtons completionId={c.id} />
            </div>
          ))}
        </div>
      </section>

      {rejected.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">مرفوضة ({rejected.length})</h2>
          <p className="text-sm text-foreground/50">
            اضغط «إتاحة إعادة الرفع» ليتمكّن الطالب من رفع إثبات جديد (تعود المهمة لغير المنجزة).
          </p>
          <div className="space-y-3">
            {rejected.map((c) => (
              <div key={c.id} className="space-y-3 rounded-xl border border-danger/30 bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{c.task.title}</div>
                    <div className="text-xs text-foreground/50">
                      {c.student.name} • {formatArabicDateTime(c.submittedAt)}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-danger/10 px-2 py-1 text-xs font-bold text-danger">
                    مرفوض
                  </span>
                </div>

                {c.proofFiles.length > 0 && <ProofLightbox files={c.proofFiles} />}

                {c.rejectionReason && (
                  <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
                    سبب الرفض: {c.rejectionReason}
                  </p>
                )}

                <AllowResubmitButton completionId={c.id} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

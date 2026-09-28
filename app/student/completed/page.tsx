import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { formatArabicDateTime } from "@/lib/dates";
import { STATUS_LABEL, STATUS_COLOR } from "@/lib/labels";
import { ProofManager } from "@/components/student/ProofManager";
import { ProofLightbox } from "@/components/ProofLightbox";

export default async function StudentCompletedPage() {
  const user = await requireRole("STUDENT");
  const completions = await prisma.taskCompletion.findMany({
    where: { studentId: user.id },
    include: { task: true, proofFiles: { select: { id: true, mimeType: true }, orderBy: { createdAt: "asc" } } },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">المهام المنجزة</h2>
      {completions.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-foreground/60">
          لم تقم بإنجاز أي مهمة بعد.
        </div>
      )}
      <div className="space-y-3">
        {completions.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{c.task.title}</div>
                <div className="text-xs text-foreground/50">{formatArabicDateTime(c.submittedAt)}</div>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLOR[c.status]}`}>
                {STATUS_LABEL[c.status]}
              </span>
            </div>
            {c.task.requiresProof &&
              (c.status === "REJECTED" ? (
                <div className="mt-2 space-y-2">
                  {c.proofFiles.length > 0 && <ProofLightbox files={c.proofFiles} />}
                  {c.rejectionReason && (
                    <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
                      سبب الرفض: {c.rejectionReason}
                    </p>
                  )}
                  <p className="text-xs text-danger">
                    تم رفض الإثبات. انتظر إتاحة المشرف لإعادة الرفع، وستعود المهمة إلى «المهام غير المنجزة».
                  </p>
                </div>
              ) : (
                <ProofManager completionId={c.id} files={c.proofFiles} />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

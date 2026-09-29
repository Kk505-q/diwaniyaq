import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { getParentChildren } from "@/lib/parent";
import { formatArabicDateTime } from "@/lib/dates";
import { STATUS_LABEL, STATUS_COLOR } from "@/lib/labels";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";

export default async function ParentTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const user = await requireRole("PARENT");
  const kids = await getParentChildren(user.id);

  if (kids.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-foreground/60">
        لم يتم ربط أي طالب بحسابك بعد. الرجاء التواصل مع الإدارة.
      </div>
    );
  }

  const { child } = await searchParams;
  const selected = kids.find((k) => k.id === child) ?? kids[0];

  const completions = await prisma.taskCompletion.findMany({
    where: { studentId: selected.id, status: "APPROVED" },
    include: { task: true },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <SubscriptionBadge status={selected.subscription} />
      <h2 className="text-lg font-bold">المهام المنجزة — {selected.name}</h2>
      {completions.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-foreground/60">
          لا توجد مهام منجزة بعد
        </div>
      )}
      <div className="space-y-3">
        {completions.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl border border-border bg-surface p-4"
          >
            <div>
              <div className="font-semibold">{c.task.title}</div>
              <div className="text-xs text-foreground/50">{formatArabicDateTime(c.submittedAt)}</div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLOR[c.status]}`}>
              {STATUS_LABEL[c.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

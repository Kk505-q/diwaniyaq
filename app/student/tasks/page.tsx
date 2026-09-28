import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { periodKeyFor } from "@/lib/dates";
import { TaskCompleteForm } from "@/components/student/TaskCompleteForm";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { WelcomeCard } from "@/components/WelcomeCard";
import { randomPhrase } from "@/lib/phrases";
import { FREQ_LABEL } from "@/lib/labels";

export default async function StudentTasksPage() {
  const user = await requireRole("STUDENT");
  const tasks = await prisma.habitTask.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } });

  const unfinished = [];
  for (const task of tasks) {
    const periodKey = periodKeyFor(task.frequency);
    const completion = await prisma.taskCompletion.findUnique({
      where: { taskId_studentId_periodKey: { taskId: task.id, studentId: user.id, periodKey } },
    });
    if (!completion) unfinished.push(task);
  }

  const total = tasks.length;
  const remaining = unfinished.length;
  const percent = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
  const phrase = randomPhrase(percent);

  return (
    <div className="space-y-4">
      <WelcomeCard name={user.name} percent={percent} remaining={remaining} total={total} phrase={phrase} />
      <SubscriptionBadge status={user.subscription} />
      <h2 className="text-lg font-bold">المهام غير المنجزة</h2>
      {unfinished.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-foreground/60">
          أحسنت! لا توجد مهام متبقية لهذه الفترة.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {unfinished.map((task) => (
          <div key={task.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold">{task.title}</h3>
                {task.description && <p className="mt-1 text-sm text-foreground/60">{task.description}</p>}
              </div>
              <span className="shrink-0 rounded-full bg-brand/10 px-2 py-1 text-xs font-bold text-brand">
                {FREQ_LABEL[task.frequency]}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm font-bold text-accent-gold">
              <span>{task.points} نقطة</span>
              {task.requiresProof && <span className="font-normal text-foreground/40">• يتطلب إثبات</span>}
            </div>
            <TaskCompleteForm taskId={task.id} requiresProof={task.requiresProof} />
          </div>
        ))}
      </div>
    </div>
  );
}

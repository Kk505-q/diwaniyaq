import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { periodKeyFor } from "@/lib/dates";
import { weeklyCompletion } from "@/lib/completion";
import { CompletionBadge } from "@/components/CompletionBadge";
import { SubscriptionSelect } from "@/components/SubscriptionSelect";
import { StudentNameManager } from "@/components/admin/StudentNameManager";
import { DeleteStudentButton } from "@/components/supervisor/DeleteStudentButton";
import { flushDuePoints } from "@/lib/points";
import Link from "next/link";

export default async function SupervisorProgressPage() {
  await requireRole("SUPERVISOR");
  await flushDuePoints();
  const students = (await prisma.user.findMany({ where: { role: "STUDENT" } })).sort((a, b) =>
    a.name.localeCompare(b.name, "ar")
  );
  const tasks = await prisma.habitTask.findMany({ where: { active: true } });
  const totalTasks = tasks.length;

  const rows = await Promise.all(
    students.map(async (s) => {
      const doneCount =
        totalTasks === 0
          ? 0
          : await prisma.taskCompletion.count({
              where: {
                studentId: s.id,
                status: { in: ["APPROVED", "PENDING_REVIEW"] },
                OR: tasks.map((t) => ({ taskId: t.id, periodKey: periodKeyFor(t.frequency) })),
              },
            });
      const pendingReview = await prisma.taskCompletion.count({
        where: { studentId: s.id, status: "PENDING_REVIEW" },
      });
      const weekly = await weeklyCompletion(s.id);
      return { ...s, doneCount, pendingReview, weeklyPercent: weekly.percent };
    })
  );

  return (
    <div className="space-y-10">
      <div className="space-y-4">
      <h2 className="text-lg font-bold">متابعة الطلاب وتقدمهم</h2>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-foreground/50">
              <th className="px-4 py-3 text-right font-medium">الطالب</th>
              <th className="px-4 py-3 text-right font-medium">التقدم اليوم</th>
              <th className="px-4 py-3 text-right font-medium">الإنجاز الأسبوعي</th>
              <th className="px-4 py-3 text-right font-medium">قيد المراجعة</th>
              <th className="px-4 py-3 text-right font-medium">النقاط</th>
              <th className="px-4 py-3 text-right font-medium">الاشتراك</th>
              <th className="px-4 py-3 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{s.name}</div>
                  {s.alias && (
                    <div className="mt-1 text-xs text-foreground/50">
                      الاسم المستعار: {s.alias}
                      {s.aliasDisabled && <span className="text-danger"> (مخفي)</span>}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {s.doneCount} / {totalTasks}
                </td>
                <td className="px-4 py-3">
                  <CompletionBadge percent={s.weeklyPercent} />
                </td>
                <td className="px-4 py-3">
                  {s.pendingReview > 0 ? (
                    <span className="rounded-full bg-accent-gold/10 px-2 py-1 text-xs font-bold text-accent-gold">
                      {s.pendingReview}
                    </span>
                  ) : (
                    <span className="text-foreground/30">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-bold text-brand">{s.points}</td>
                <td className="px-4 py-3">
                  <SubscriptionSelect studentId={s.id} value={s.subscription} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-2">
                    <Link href={`/supervisor/students/${s.id}`} className="text-sm text-brand hover:underline">
                      التفاصيل
                    </Link>
                    <DeleteStudentButton studentId={s.id} name={s.name} />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-foreground/50">
                  لا يوجد طلاب بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      <StudentNameManager />
    </div>
  );
}

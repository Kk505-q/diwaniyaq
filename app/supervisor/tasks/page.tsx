import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { CreateTaskForm } from "@/components/supervisor/CreateTaskForm";
import { TaskRow } from "@/components/supervisor/TaskRow";
import { AdjustPointsForm } from "@/components/supervisor/AdjustPointsForm";

export default async function SupervisorTasksPage() {
  await requireRole("SUPERVISOR");
  const tasks = await prisma.habitTask.findMany({ orderBy: { createdAt: "asc" } });
  const students = (
    await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true, name: true } })
  ).sort((a, b) => a.name.localeCompare(b.name, "ar"));

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-lg font-bold">إدارة المهام</h2>
        <CreateTaskForm />
        <div className="space-y-3">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
          {tasks.length === 0 && (
            <p className="text-sm text-foreground/50">لا توجد مهام بعد، أضف أول مهمة من الأعلى.</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">إضافة / خصم نقاط الطلاب</h2>
        <AdjustPointsForm students={students} />
      </section>
    </div>
  );
}

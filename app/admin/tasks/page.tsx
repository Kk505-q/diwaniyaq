import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { CreateTaskForm } from "@/components/supervisor/CreateTaskForm";
import { TaskRow } from "@/components/supervisor/TaskRow";

export default async function AdminTasksPage() {
  await requireRole("ADMIN");
  const tasks = await prisma.habitTask.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">إدارة المهام</h2>
      <p className="text-sm text-foreground/50">
        أضف المهام اليومية أو الأسبوعية، وحدّد إن كانت تتطلب إرفاق ملف إثبات من الطالب أم لا.
      </p>
      <CreateTaskForm />
      <div className="space-y-3">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} />
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-foreground/50">لا توجد مهام بعد، أضف أول مهمة من الأعلى.</p>
        )}
      </div>
    </div>
  );
}

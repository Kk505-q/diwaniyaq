import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { SendNotificationForm } from "@/components/supervisor/SendNotificationForm";
import { formatArabicDateTime } from "@/lib/dates";

const TARGET_LABEL: Record<string, string> = {
  ALL: "الجميع",
  STUDENT: "الطلاب",
  PARENT: "أولياء الأمور",
  SUPERVISOR: "المشرفون",
  USER: "طالب محدد",
};

export default async function SupervisorNotificationsPage() {
  await requireRole("SUPERVISOR");
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-bold">إرسال إشعار جديد</h2>
        <SendNotificationForm students={students} />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold">الإشعارات المرسلة</h2>
        {notifications.map((n) => (
          <div key={n.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{n.title}</h3>
              <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                {TARGET_LABEL[n.targetRole]}
              </span>
            </div>
            <p className="mt-1 text-sm text-foreground/70">{n.body}</p>
            <p className="mt-1 text-xs text-foreground/40">{formatArabicDateTime(n.createdAt)}</p>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-sm text-foreground/50">لا توجد إشعارات مرسلة بعد</p>
        )}
      </section>
    </div>
  );
}

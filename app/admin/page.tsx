import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { AssignRoleForm } from "@/components/admin/AssignRoleForm";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";
import { RejectRequestButton } from "@/components/admin/RejectRequestButton";
import { SubscriptionSelect } from "@/components/SubscriptionSelect";
import { StudentNameManager } from "@/components/admin/StudentNameManager";
import { ROLE_LABELS } from "@/lib/roles";

export default async function AdminPage() {
  await requireRole("ADMIN");

  const [pendingUsers, allUsersRaw] = await Promise.all([
    prisma.user.findMany({ where: { role: "PENDING" }, orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({ where: { role: { not: "PENDING" } } }),
  ]);

  // Alphabetical (Arabic) ordering for all listings.
  const allUsers = allUsersRaw.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  const students = allUsers.filter((u) => u.role === "STUDENT");

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-lg font-bold">طلبات التسجيل بانتظار الموافقة ({pendingUsers.length})</h2>
        {pendingUsers.length === 0 && <p className="text-sm text-foreground/50">لا توجد طلبات معلقة</p>}
        <div className="space-y-3">
          {pendingUsers.map((u) => (
            <div key={u.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-2">
                <div className="font-semibold">{u.name}</div>
                <div className="text-xs text-foreground/50" dir="ltr">
                  {u.email}
                </div>
              </div>
              <AssignRoleForm userId={u.id} currentRole={u.role} />
              <div className="mt-3 border-t border-border pt-3">
                <RejectRequestButton userId={u.id} name={u.name} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">حالة الاشتراك للطلاب</h2>
        <div className="space-y-2">
          {students.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm"
            >
              <span className="font-medium">{s.name}</span>
              <SubscriptionSelect studentId={s.id} value={s.subscription} />
            </div>
          ))}
          {students.length === 0 && <p className="text-sm text-foreground/50">لا يوجد طلاب بعد</p>}
        </div>
      </section>

      <StudentNameManager />

      <section className="space-y-4">
        <h2 className="text-lg font-bold">جميع المستخدمين</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-foreground/50">
                <th className="px-4 py-3 text-right font-medium">الاسم</th>
                <th className="px-4 py-3 text-right font-medium">البريد</th>
                <th className="px-4 py-3 text-right font-medium">الدور</th>
                <th className="px-4 py-3 text-right font-medium">تغيير الدور</th>
                <th className="px-4 py-3 text-right font-medium">حذف</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3 text-foreground/60" dir="ltr">
                    {u.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand/10 px-2 py-1 text-xs font-bold text-brand">
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <AssignRoleForm userId={u.id} currentRole={u.role} />
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "ADMIN" ? (
                      <span className="text-xs text-foreground/30">—</span>
                    ) : (
                      <DeleteUserButton userId={u.id} name={u.name} />
                    )}
                  </td>
                </tr>
              ))}
              {allUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-foreground/50">
                    لا يوجد مستخدمون بعد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

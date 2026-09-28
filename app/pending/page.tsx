import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";
import { AuthShell } from "@/components/AuthShell";
import { LogoutButton } from "@/components/LogoutButton";

export default async function PendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "PENDING") redirect(ROLE_HOME[user.role] ?? "/login");

  return (
    <AuthShell title="طلبك قيد المراجعة" subtitle={`مرحبًا ${user.name}`}>
      <div className="space-y-4 text-center">
        <p className="text-sm leading-relaxed text-foreground/70">
          تم استلام طلب تسجيلك بنجاح. سيقوم فريق الإدارة بمراجعة طلبك واعتماد حسابك
          قريبًا. يمكنك المحاولة لاحقًا بتسجيل الدخول من جديد للتحقق من حالة حسابك.
        </p>
        <LogoutButton />
      </div>
    </AuthShell>
  );
}

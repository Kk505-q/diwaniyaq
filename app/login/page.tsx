import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role] ?? "/login");

  return (
    <AuthShell title="تسجيل الدخول" subtitle="منصة ديوانية ق لمتابعة العادات اليومية">
      <LoginForm />
    </AuthShell>
  );
}

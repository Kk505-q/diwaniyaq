import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";
import { AuthShell } from "@/components/AuthShell";
import { SignupForm } from "@/components/SignupForm";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role] ?? "/login");

  return (
    <AuthShell title="إنشاء حساب جديد" subtitle="للطلاب">
      <SignupForm />
    </AuthShell>
  );
}

import { AuthShell } from "@/components/AuthShell";
import { ForgotForm } from "@/components/ForgotForm";

export default function ForgotPage() {
  return (
    <AuthShell title="نسيت كلمة المرور" subtitle="أدخل بريدك وسنرسل لك رابطًا لإعادة التعيين">
      <ForgotForm />
    </AuthShell>
  );
}

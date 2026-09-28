import { AuthShell } from "@/components/AuthShell";
import { ResetForm } from "@/components/ResetForm";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  const valid = record && !record.used && record.expiresAt > new Date();

  if (!valid) {
    return (
      <AuthShell title="رابط غير صالح" subtitle="انتهت صلاحية الرابط أو تم استخدامه">
        <div className="space-y-4 text-center">
          <p className="text-sm text-foreground/70">
            الرجاء طلب رابط جديد لإعادة تعيين كلمة المرور.
          </p>
          <Link
            href="/forgot"
            className="inline-block rounded-xl bg-brand px-6 py-3 font-bold text-white hover:bg-brand-dark"
          >
            طلب رابط جديد
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="تعيين كلمة مرور جديدة" subtitle="اختر كلمة مرور جديدة لحسابك">
      <ResetForm token={token} />
    </AuthShell>
  );
}

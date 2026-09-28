"use server";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendMail } from "@/lib/email";

export type PasswordActionState = { error?: string; success?: string };

function appUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function forgotPasswordAction(
  _prev: PasswordActionState,
  formData: FormData
): Promise<PasswordActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const genericSuccess = {
    success: "إذا كان البريد مسجّلًا لدينا، فقد أرسلنا إليه رابطًا لإعادة تعيين كلمة المرور. تحقّق من بريدك (وصندوق الرسائل غير المرغوبة).",
  };

  if (!email) return { error: "الرجاء إدخال البريد الإلكتروني" };

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return the same message so we don't reveal which emails exist.
  if (!user) return genericSuccess;

  // Throttle: don't send another reset email within 2 minutes.
  const recent = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) } },
  });
  if (recent) return genericSuccess;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Invalidate previous unused tokens for this user, then create a fresh one.
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, used: false } });
  await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

  const link = `${appUrl()}/reset/${token}`;
  const html = `
    <div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right;color:#10172a">
      <h2 style="color:#1e4fd6">إعادة تعيين كلمة المرور</h2>
      <p>مرحبًا ${user.name}،</p>
      <p>تلقّينا طلبًا لإعادة تعيين كلمة مرور حسابك في <strong>ديوانية ق</strong>. اضغط الزر أدناه لتعيين كلمة مرور جديدة:</p>
      <p style="margin:24px 0">
        <a href="${link}" style="background:#1e4fd6;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold">
          إعادة تعيين كلمة المرور
        </a>
      </p>
      <p style="color:#64748b;font-size:13px">الرابط صالح لمدة ساعة واحدة. إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p>
      <p style="color:#94a3b8;font-size:12px">أو انسخ هذا الرابط: ${link}</p>
    </div>
  `;

  try {
    await sendMail(email, "إعادة تعيين كلمة المرور - ديوانية ق", html);
  } catch (e) {
    console.error("Failed to send reset email:", e);
    return { error: "تعذّر إرسال البريد حاليًا. حاول لاحقًا أو تواصل مع الإدارة." };
  }

  return genericSuccess;
}

export async function resetPasswordAction(
  _prev: PasswordActionState,
  formData: FormData
): Promise<PasswordActionState> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!token) return { error: "رابط غير صالح" };
  if (password.length < 6) return { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" };
  if (password !== confirm) return { error: "كلمتا المرور غير متطابقتين" };

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.used || record.expiresAt < new Date()) {
    return { error: "الرابط منتهي الصلاحية أو غير صالح. الرجاء طلب رابط جديد." };
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
  ]);

  return { success: "تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول." };
}

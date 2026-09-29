"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, createSessionToken, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";

export type ActionState = { error?: string };

export async function signupAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") || "").trim();
  const alias = String(formData.get("alias") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!name || !email || !password) {
    return { error: "الرجاء تعبئة الاسم والبريد وكلمة المرور" };
  }
  if (!email.includes("@")) {
    return { error: "الرجاء إدخال بريد إلكتروني صحيح" };
  }
  if (password.length < 6) {
    return { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "هذا البريد الإلكتروني مسجل مسبقًا" };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, alias: alias || null, email, passwordHash, role: "PENDING" },
  });

  const token = await createSessionToken({ sub: user.id, role: user.role });
  await setSessionCookie(token);
  redirect("/pending");
}

export async function loginAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  // Brute-force protection: lock the account after too many failed attempts.
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: "تم إيقاف الدخول مؤقتًا بسبب محاولات خاطئة كثيرة. حاول بعد ١٥ دقيقة." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const failed = user.failedLogins + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: failed,
        lockedUntil: failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      },
    });
    return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  // Successful login clears the counter.
  if (user.failedLogins > 0 || user.lockedUntil) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  }

  const token = await createSessionToken({ sub: user.id, role: user.role });
  await setSessionCookie(token);
  redirect(ROLE_HOME[user.role] ?? "/login");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

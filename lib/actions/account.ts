"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { requireAnyRole } from "@/lib/guard";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { getSettings, canEditAlias, canEditName } from "@/lib/settings";
import { isAllowedImage } from "@/lib/uploads";
import { revalidatePath } from "next/cache";

export type AccountState = { error?: string; success?: string };

// Update the current user's real name and alias — but only the fields the user
// is currently permitted to edit (students are locked unless opened by staff).
export async function updateProfileAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return { error: "يجب تسجيل الدخول" };

  const settings = await getSettings();
  const mayName = canEditName(settings, user);
  const mayAlias = canEditAlias(settings, user);
  if (!mayName && !mayAlias) {
    return { error: "لا يمكنك تعديل بياناتك حاليًا. تواصل مع الإدارة." };
  }

  const data: { name?: string; alias?: string | null } = {};

  if (mayName) {
    const name = String(formData.get("name") || "").trim();
    if (!name) return { error: "الرجاء إدخال الاسم" };
    data.name = name;
  }
  if (mayAlias) {
    const alias = String(formData.get("alias") || "").trim();
    data.alias = alias || null;
  }

  await prisma.user.update({ where: { id: user.id }, data });

  revalidatePath("/account");
  return { success: "تم حفظ البيانات ✅" };
}

// Supervisor/admin: open or close (for everyone) the ability of students to
// edit their alias or real name.
export async function setGlobalEditPermissionAction(field: "alias" | "name", value: boolean) {
  await requireAnyRole(["ADMIN", "SUPERVISOR"]);
  const data = field === "alias" ? { allowAllEditAlias: value } : { allowAllEditName: value };
  await prisma.settings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });
  revalidatePath("/admin");
  revalidatePath("/supervisor/progress");
  return {};
}

// Supervisor/admin: open or close the edit ability for a single student.
export async function setStudentEditPermissionAction(
  studentId: string,
  field: "alias" | "name",
  value: boolean
) {
  await requireAnyRole(["ADMIN", "SUPERVISOR"]);
  const target = await prisma.user.findUnique({ where: { id: studentId } });
  if (!target || target.role !== "STUDENT") return { error: "الطالب غير موجود" };
  const data = field === "alias" ? { canEditAlias: value } : { canEditName: value };
  await prisma.user.update({ where: { id: studentId }, data });
  revalidatePath("/admin");
  revalidatePath("/supervisor/progress");
  return {};
}

// Supervisor/admin: permanently delete (clear) a specific student's alias.
export async function deleteStudentAliasAction(studentId: string) {
  await requireAnyRole(["ADMIN", "SUPERVISOR"]);
  const target = await prisma.user.findUnique({ where: { id: studentId } });
  if (!target || target.role !== "STUDENT") return { error: "الطالب غير موجود" };
  await prisma.user.update({ where: { id: studentId }, data: { alias: null, aliasDisabled: false } });
  revalidatePath("/admin");
  revalidatePath("/supervisor/progress");
  return {};
}

// Change password by supplying the current password (the in-app path).
export async function changePasswordAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return { error: "يجب تسجيل الدخول" };

  const current = String(formData.get("current") || "");
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!current) return { error: "الرجاء إدخال كلمة المرور الحالية" };
  const ok = await verifyPassword(current, user.passwordHash);
  if (!ok) return { error: "كلمة المرور الحالية غير صحيحة" };

  if (password.length < 6) return { error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" };
  if (password !== confirm) return { error: "كلمتا المرور غير متطابقتين" };

  const passwordHash = await hashPassword(password);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: "تم تغيير كلمة المرور بنجاح ✅" };
}

// Upload / replace the current user's profile picture.
export async function updateAvatarAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return { error: "يجب تسجيل الدخول" };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "الرجاء اختيار صورة" };
  }
  if (!isAllowedImage(file.type)) {
    return { error: "الصورة يجب أن تكون بصيغة PNG أو JPG أو WEBP أو GIF" };
  }
  if (file.size > 4 * 1024 * 1024) {
    return { error: "حجم الصورة كبير جدًا (الحد ٤ ميجابايت)" };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  await prisma.avatar.upsert({
    where: { userId: user.id },
    create: { userId: user.id, mimeType: file.type, data: bytes as Uint8Array<ArrayBuffer> },
    update: { mimeType: file.type, data: bytes as Uint8Array<ArrayBuffer> },
  });

  revalidatePath("/account");
  return { success: "تم تحديث الصورة ✅" };
}

// Delete the current user's profile picture (revert to initials).
export async function deleteAvatarAction(): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return { error: "يجب تسجيل الدخول" };
  await prisma.avatar.deleteMany({ where: { userId: user.id } });
  revalidatePath("/account");
  return { success: "تم حذف الصورة ✅" };
}

// Supervisor/admin can cancel (or restore) a student's alias so the public
// leaderboard shows the real name instead.
export async function setAliasDisabledAction(studentId: string, disabled: boolean) {
  await requireAnyRole(["ADMIN", "SUPERVISOR"]);
  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student || student.role !== "STUDENT") return { error: "الطالب غير موجود" };

  await prisma.user.update({ where: { id: studentId }, data: { aliasDisabled: disabled } });
  revalidatePath("/supervisor/progress");
  revalidatePath("/admin");
  return {};
}

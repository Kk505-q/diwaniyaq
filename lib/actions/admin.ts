"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/actions/auth";
import type { Role } from "@prisma/client";

const ASSIGNABLE_ROLES: Role[] = ["STUDENT", "SUPERVISOR", "ADMIN"];

export async function assignRoleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const userId = String(formData.get("userId") || "");
  const role = String(formData.get("role") || "") as Role;

  if (!userId || !ASSIGNABLE_ROLES.includes(role)) {
    return { error: "بيانات غير صالحة" };
  }

  // Set the role only.
  await prisma.user.update({ where: { id: userId }, data: { role } });

  revalidatePath("/admin");
  return {};
}

// Reject a pending registration request: remove the pending account entirely.
export async function rejectPendingUserAction(userId: string): Promise<{ error?: string }> {
  await requireRole("ADMIN");
  if (!userId) return { error: "طلب غير صالح" };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "الطلب غير موجود" };
  if (target.role !== "PENDING") return { error: "لا يمكن رفض هذا الحساب لأنه مُعتمد بالفعل" };

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin");
  return {};
}

export async function deleteUserAction(userId: string): Promise<{ error?: string }> {
  const admin = await requireRole("ADMIN");
  if (!userId || userId === admin.id) {
    return { error: "لا يمكن حذف هذا الحساب" };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "المستخدم غير موجود" };
  if (target.role === "ADMIN") {
    return { error: "لا يمكن حذف حساب إدارة من هنا" };
  }

  // Reassign records the user authored to the admin (so tasks/notifications
  // aren't lost), null out any reviews, then delete. Student-side
  // records (completions, points) cascade automatically.
  await prisma.$transaction([
    prisma.habitTask.updateMany({ where: { createdById: userId }, data: { createdById: admin.id } }),
    prisma.notification.updateMany({ where: { createdById: userId }, data: { createdById: admin.id } }),
    prisma.pointsLog.updateMany({ where: { createdById: userId }, data: { createdById: admin.id } }),
    prisma.taskCompletion.updateMany({ where: { reviewedById: userId }, data: { reviewedById: null } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  revalidatePath("/admin");
  return {};
}

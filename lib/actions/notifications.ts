"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { requireRole } from "@/lib/guard";
import type { Role, NotificationTarget } from "@prisma/client";
import type { ActionState } from "@/lib/actions/auth";

function roleToNotificationTarget(role: Role): NotificationTarget | null {
  if (role === "STUDENT" || role === "SUPERVISOR") return role;
  return null;
}

export async function getMyNotifications() {
  const user = await getCurrentUser();
  if (!user) return [];

  const target = roleToNotificationTarget(user.role);
  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        { targetRole: "ALL" },
        ...(target ? [{ targetRole: target }] : []),
        { targetUserId: user.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { reads: { where: { userId: user.id } } },
  });

  return notifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    createdAt: n.createdAt.toISOString(),
    read: n.reads.length > 0,
  }));
}

export async function markNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) return;

  const target = roleToNotificationTarget(user.role);
  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        { targetRole: "ALL" },
        ...(target ? [{ targetRole: target }] : []),
        { targetUserId: user.id },
      ],
      NOT: { reads: { some: { userId: user.id } } },
    },
    select: { id: true },
  });

  if (notifications.length === 0) return;

  await prisma.notificationRead.createMany({
    data: notifications.map((n) => ({ notificationId: n.id, userId: user.id })),
  });
}

export async function sendNotificationAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("SUPERVISOR");

  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const targetType = String(formData.get("targetType") || "ALL") as NotificationTarget;
  const targetUserId = String(formData.get("targetUserId") || "") || null;

  if (!title || !body) {
    return { error: "الرجاء تعبئة عنوان الإشعار ونصه" };
  }
  if (targetType === "USER" && !targetUserId) {
    return { error: "الرجاء اختيار طالب لإرسال الإشعار له" };
  }

  await prisma.notification.create({
    data: {
      title,
      body,
      targetRole: targetType,
      targetUserId: targetType === "USER" ? targetUserId : null,
      createdById: user.id,
    },
  });

  return {};
}

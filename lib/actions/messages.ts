"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canSendTo, ALL_STUDENTS } from "@/lib/messages";
import { ROLE_LABELS } from "@/lib/roles";
import { aliasOnly } from "@/lib/display";

export type MessageActionState = { error?: string; ok?: boolean };

export async function sendMessageAction(
  _prev: MessageActionState,
  formData: FormData
): Promise<MessageActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "يجب تسجيل الدخول" };

  const recipientId = String(formData.get("recipientId") || "");
  const body = String(formData.get("body") || "").trim();

  if (!recipientId) return { error: "الرجاء اختيار المستلم" };
  if (!body) return { error: "الرجاء كتابة نص الرسالة" };
  if (body.length > 2000) return { error: "الرسالة طويلة جدًا (الحد ٢٠٠٠ حرف)" };

  // Basic anti-spam throttle for students: at most 5 messages per 10 seconds.
  if (user.role === "STUDENT") {
    const recent = await prisma.message.count({
      where: { senderId: user.id, createdAt: { gte: new Date(Date.now() - 10_000) } },
    });
    if (recent >= 5) return { error: "أنت ترسل بسرعة كبيرة. انتظر قليلًا ثم أعد المحاولة." };
  }

  // Broadcast to every student (supervisors and admins only).
  if (recipientId === ALL_STUDENTS) {
    if (user.role !== "SUPERVISOR" && user.role !== "ADMIN") {
      return { error: "لا تملك صلاحية الإرسال للجميع" };
    }
    const students = await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true } });
    if (students.length === 0) return { error: "لا يوجد طلاب لإرسال الرسالة إليهم" };
    await prisma.message.createMany({
      data: students.map((s) => ({ senderId: user.id, recipientId: s.id, body })),
    });
    return { ok: true };
  }

  const allowed = await canSendTo(user.id, user.role, recipientId);
  if (!allowed) return { error: "لا يمكنك مراسلة هذا المستخدم" };

  await prisma.message.create({ data: { senderId: user.id, recipientId, body } });
  return { ok: true };
}

export type InboxItem = {
  id: string;
  senderId: string;
  senderName: string;
  senderRoleLabel: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export async function getInbox(): Promise<InboxItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const msgs = await prisma.message.findMany({
    where: { recipientId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { sender: true },
  });

  return msgs.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    // Students always appear by their alias (never the real name).
    senderName: m.sender.role === "STUDENT" ? aliasOnly(m.sender) : m.sender.name,
    senderRoleLabel: ROLE_LABELS[m.sender.role] ?? m.sender.role,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    read: m.readAt !== null,
  }));
}

export async function getUnreadMessageCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  return prisma.message.count({ where: { recipientId: user.id, readAt: null } });
}

export async function markMessagesRead(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.message.updateMany({
    where: { recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}

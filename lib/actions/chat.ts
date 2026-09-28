"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { requireAnyRole } from "@/lib/guard";
import { publicName } from "@/lib/display";
import { ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@prisma/client";

const CHAT_ROLES = ["STUDENT", "SUPERVISOR", "ADMIN"] as const;

// Students appear by their alias; staff appear by their real name.
function displayName(author: { role: Role; name: string; alias: string | null; aliasDisabled: boolean }): string {
  return author.role === "STUDENT" ? publicName(author) : author.name;
}

export type ChatReplyRef = { authorName: string; body: string };

export type ChatMessageItem = {
  id: string;
  authorName: string;
  roleLabel: string;
  isStaff: boolean;
  mine: boolean;
  canDelete: boolean;
  canEdit: boolean;
  edited: boolean;
  replyTo: ChatReplyRef | null;
  body: string;
  createdAt: string;
};

export type ChatState = { open: boolean; canModerate: boolean; canPost: boolean };

export async function getChat(): Promise<{ state: ChatState; messages: ChatMessageItem[] } | null> {
  const user = await getCurrentUser();
  if (!user || !CHAT_ROLES.includes(user.role as (typeof CHAT_ROLES)[number])) return null;

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const open = settings?.chatOpen ?? true;
  const canModerate = user.role === "SUPERVISOR" || user.role === "ADMIN";
  const canPost = canModerate || open;

  const rows = await prisma.chatMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { author: true, replyTo: { include: { author: true } } },
  });

  const messages: ChatMessageItem[] = rows.reverse().map((m) => {
    const isStaff = m.author.role === "SUPERVISOR" || m.author.role === "ADMIN";
    const mine = m.authorId === user.id;
    return {
      id: m.id,
      authorName: displayName(m.author),
      roleLabel: ROLE_LABELS[m.author.role] ?? m.author.role,
      isStaff,
      mine,
      canDelete: mine || canModerate,
      canEdit: mine,
      edited: m.editedAt !== null,
      replyTo: m.replyTo
        ? { authorName: displayName(m.replyTo.author), body: m.replyTo.body.slice(0, 80) }
        : null,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    };
  });

  return { state: { open, canModerate, canPost }, messages };
}

export async function sendChatMessageAction(
  body: string,
  replyToId?: string
): Promise<{ error?: string; ok?: boolean }> {
  const user = await getCurrentUser();
  if (!user || !CHAT_ROLES.includes(user.role as (typeof CHAT_ROLES)[number])) {
    return { error: "لا تملك صلاحية الوصول للشات" };
  }

  const text = body.trim();
  if (!text) return { error: "الرسالة فارغة" };
  if (text.length > 1000) return { error: "الرسالة طويلة جدًا (الحد ١٠٠٠ حرف)" };

  const isStaff = user.role === "SUPERVISOR" || user.role === "ADMIN";
  if (!isStaff) {
    const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
    if (!(settings?.chatOpen ?? true)) return { error: "الشات مغلق حاليًا من قبل الإدارة" };

    // Basic anti-spam throttle: at most 5 messages per 10 seconds.
    const recent = await prisma.chatMessage.count({
      where: { authorId: user.id, createdAt: { gte: new Date(Date.now() - 10_000) } },
    });
    if (recent >= 5) return { error: "أنت ترسل بسرعة كبيرة. انتظر قليلًا ثم أعد المحاولة." };
  }

  // Only reference a reply target that actually exists.
  let validReplyTo: string | null = null;
  if (replyToId) {
    const target = await prisma.chatMessage.findUnique({ where: { id: replyToId }, select: { id: true } });
    if (target) validReplyTo = target.id;
  }

  await prisma.chatMessage.create({ data: { authorId: user.id, body: text, replyToId: validReplyTo } });
  return { ok: true };
}

export async function editChatMessageAction(id: string, body: string): Promise<{ error?: string; ok?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "يجب تسجيل الدخول" };

  const text = body.trim();
  if (!text) return { error: "الرسالة فارغة" };
  if (text.length > 1000) return { error: "الرسالة طويلة جدًا (الحد ١٠٠٠ حرف)" };

  const msg = await prisma.chatMessage.findUnique({ where: { id }, select: { authorId: true } });
  if (!msg) return { error: "الرسالة غير موجودة" };
  if (msg.authorId !== user.id) return { error: "يمكنك تعديل رسائلك فقط" };

  await prisma.chatMessage.update({ where: { id }, data: { body: text, editedAt: new Date() } });
  return { ok: true };
}

export async function deleteChatMessageAction(id: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "يجب تسجيل الدخول" };

  const msg = await prisma.chatMessage.findUnique({ where: { id }, select: { authorId: true } });
  if (!msg) return {};

  const isModerator = user.role === "SUPERVISOR" || user.role === "ADMIN";
  // A user may delete their own message; moderators may delete any.
  if (msg.authorId !== user.id && !isModerator) {
    return { error: "لا تملك صلاحية حذف هذه الرسالة" };
  }

  await prisma.chatMessage.delete({ where: { id } }).catch(() => {});
  return {};
}

export async function setChatOpenAction(open: boolean): Promise<{ error?: string }> {
  await requireAnyRole(["SUPERVISOR", "ADMIN"]);
  await prisma.settings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", chatOpen: open },
    update: { chatOpen: open },
  });
  return {};
}

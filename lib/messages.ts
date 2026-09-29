import { prisma } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/roles";
import { aliasOnly } from "@/lib/display";
import type { Role } from "@prisma/client";

export type Recipient = { id: string; name: string; roleLabel: string };

// Sentinel recipient id: broadcast to every student at once. Not a real user id
// (cuids never contain "__"), so it can't collide with an actual recipient.
export const ALL_STUDENTS = "__ALL_STUDENTS__";

// The contacts a user is allowed to start a new conversation with.
// - Student  → all supervisors + all other students (shown by alias)
// - Supervisor → all students
// - Admin    → any student/supervisor
export async function allowedRecipients(userId: string, role: Role): Promise<Recipient[]> {
  if (role === "STUDENT") {
    const sups = await prisma.user.findMany({ where: { role: "SUPERVISOR" }, orderBy: { name: "asc" } });
    // Other participating students, shown by their public alias only.
    const peers = await prisma.user.findMany({
      where: { role: "STUDENT", id: { not: userId } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, alias: true, aliasDisabled: true },
    });
    return [
      ...sups.map((s) => ({ id: s.id, name: s.name, roleLabel: ROLE_LABELS.SUPERVISOR })),
      ...peers.map((p) => ({ id: p.id, name: aliasOnly(p), roleLabel: ROLE_LABELS.STUDENT })),
    ];
  }

  if (role === "SUPERVISOR") {
    const students = await prisma.user.findMany({ where: { role: "STUDENT" }, orderBy: { name: "asc" } });
    return [
      { id: ALL_STUDENTS, name: "الجميع", roleLabel: "كل الطلاب" },
      ...students.map((s) => ({ id: s.id, name: s.name, roleLabel: ROLE_LABELS.STUDENT })),
    ];
  }

  if (role === "ADMIN") {
    const users = await prisma.user.findMany({
      where: { role: { in: ["STUDENT", "SUPERVISOR"] } },
      orderBy: { name: "asc" },
    });
    return [
      { id: ALL_STUDENTS, name: "الجميع", roleLabel: "كل الطلاب" },
      ...users.map((u) => ({ id: u.id, name: u.name, roleLabel: ROLE_LABELS[u.role] ?? u.role })),
    ];
  }

  return [];
}

// A user may send to anyone in their allowed list, or reply to anyone who has
// already messaged them (so a supervisor can answer a student, etc.).
export async function canSendTo(senderId: string, senderRole: Role, recipientId: string): Promise<boolean> {
  if (!recipientId || recipientId === senderId) return false;

  const allowed = await allowedRecipients(senderId, senderRole);
  if (allowed.some((r) => r.id === recipientId)) return true;

  const prior = await prisma.message.findFirst({
    where: { senderId: recipientId, recipientId: senderId },
    select: { id: true },
  });
  return !!prior;
}

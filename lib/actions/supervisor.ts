"use server";

import { prisma } from "@/lib/db";
import { requireRole, requireAnyRole } from "@/lib/guard";
import { applyPointsDelta, schedulePointsDelta } from "@/lib/points";
import { ALL_STUDENTS } from "@/lib/sentinels";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/actions/auth";
import type { Frequency } from "@prisma/client";

function revalidateTasks() {
  revalidatePath("/supervisor/tasks");
  revalidatePath("/admin");
  revalidatePath("/student/tasks");
}

export async function createTaskAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireAnyRole(["SUPERVISOR", "ADMIN"]);
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const points = Number(formData.get("points") || 0);
  const frequency = String(formData.get("frequency") || "DAILY") as Frequency;
  const requiresProof = formData.get("requiresProof") === "on";

  if (!title) return { error: "الرجاء إدخال عنوان المهمة" };
  if (!Number.isFinite(points) || points <= 0) return { error: "عدد النقاط يجب أن يكون رقمًا موجبًا" };

  await prisma.habitTask.create({
    data: { title, description: description || null, points, frequency, requiresProof, createdById: user.id },
  });

  revalidateTasks();
  return {};
}

export async function updateTaskAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireAnyRole(["SUPERVISOR", "ADMIN"]);
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const points = Number(formData.get("points") || 0);
  const frequency = String(formData.get("frequency") || "DAILY") as Frequency;
  const requiresProof = formData.get("requiresProof") === "on";

  if (!id) return { error: "مهمة غير صالحة" };
  if (!title) return { error: "الرجاء إدخال عنوان المهمة" };
  if (!Number.isFinite(points) || points <= 0) return { error: "عدد النقاط يجب أن يكون رقمًا موجبًا" };

  await prisma.habitTask.update({
    where: { id },
    data: { title, description: description || null, points, frequency, requiresProof },
  });

  revalidateTasks();
  return {};
}

export async function toggleTaskActiveAction(taskId: string) {
  await requireAnyRole(["SUPERVISOR", "ADMIN"]);
  const task = await prisma.habitTask.findUnique({ where: { id: taskId } });
  if (!task) return;
  await prisma.habitTask.update({ where: { id: taskId }, data: { active: !task.active } });
  revalidateTasks();
}

export async function deleteTaskAction(taskId: string) {
  await requireAnyRole(["SUPERVISOR", "ADMIN"]);
  await prisma.habitTask.delete({ where: { id: taskId } }).catch(() => {});
  revalidateTasks();
}

export async function reviewCompletionAction(completionId: string, approve: boolean, reason?: string) {
  const user = await requireRole("SUPERVISOR");
  const completion = await prisma.taskCompletion.findUnique({
    where: { id: completionId },
    include: { task: true },
  });
  if (!completion || completion.status !== "PENDING_REVIEW") return;

  const rejectionReason = (reason || "").trim().slice(0, 500) || null;

  if (approve) {
    await prisma.taskCompletion.update({
      where: { id: completionId },
      data: { status: "APPROVED", reviewedById: user.id, reviewedAt: new Date() },
    });
    await applyPointsDelta(
      completion.studentId,
      completion.task.points,
      `قبول إثبات مهمة: ${completion.task.title}`,
      user.id
    );
  } else {
    // Reject: mark the completion as rejected (it stays visible to the student
    // as "مرفوض"). The supervisor can later allow a fresh upload.
    await prisma.taskCompletion.update({
      where: { id: completionId },
      data: { status: "REJECTED", reviewedById: user.id, reviewedAt: new Date(), rejectionReason },
    });
    await prisma.notification.create({
      data: {
        title: "تم رفض إثبات مهمة",
        body:
          `تم رفض إثبات مهمة «${completion.task.title}».` +
          (rejectionReason ? ` السبب: ${rejectionReason}.` : "") +
          " انتظر إتاحة المشرف لإعادة رفع الإثبات.",
        targetRole: "USER",
        targetUserId: completion.studentId,
        createdById: user.id,
      },
    });
  }

  revalidatePath("/supervisor/progress");
  revalidatePath("/supervisor/review");
  revalidatePath(`/supervisor/students/${completion.studentId}`);
  revalidatePath("/student/tasks");
  revalidatePath("/student/completed");
  revalidatePath("/student/leaderboard");
  revalidatePath("/parent/rank");
  revalidatePath("/parent/tasks");
}

export async function adjustPointsAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("SUPERVISOR");
  const studentId = String(formData.get("studentId") || "");
  const operation = String(formData.get("operation") || "add");
  const amount = Number(formData.get("amount") || 0);
  const reason = String(formData.get("reason") || "").trim();

  if (!studentId) return { error: "الرجاء اختيار طالب" };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "الرجاء إدخال عدد نقاط موجب" };
  }
  if (!reason) return { error: "الرجاء إدخال سبب التعديل" };

  // "خصم" makes the change negative.
  const delta = operation === "deduct" ? -amount : amount;

  // Manual adjustments take effect after a delay (they don't show for the
  // student or on the leaderboard until then).
  if (studentId === ALL_STUDENTS) {
    const students = await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true } });
    if (students.length === 0) return { error: "لا يوجد طلاب" };
    for (const s of students) {
      await schedulePointsDelta(s.id, delta, reason, user.id);
    }
  } else {
    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== "STUDENT") return { error: "الطالب غير موجود" };
    await schedulePointsDelta(studentId, delta, reason, user.id);
    revalidatePath(`/supervisor/students/${studentId}`);
  }

  revalidatePath("/supervisor/progress");
  revalidatePath("/student/leaderboard");
  revalidatePath("/parent/rank");
  return {};
}

// Supervisor/admin: delete a student account (and all their data via cascade).
export async function deleteStudentAction(studentId: string): Promise<{ error?: string }> {
  await requireAnyRole(["SUPERVISOR", "ADMIN"]);
  if (!studentId) return { error: "طلب غير صالح" };

  const target = await prisma.user.findUnique({ where: { id: studentId } });
  if (!target) return { error: "الطالب غير موجود" };
  if (target.role !== "STUDENT") return { error: "يمكن حذف حسابات الطلاب فقط من هنا" };

  await prisma.user.delete({ where: { id: studentId } });
  revalidatePath("/supervisor/progress");
  revalidatePath("/admin");
  return {};
}

// Supervisor/admin: allow a student to re-upload proof for a rejected task.
// Removes the rejected completion so the task returns to "unfinished tasks".
export async function allowResubmitAction(completionId: string) {
  const user = await requireAnyRole(["SUPERVISOR", "ADMIN"]);
  const completion = await prisma.taskCompletion.findUnique({
    where: { id: completionId },
    include: { task: true },
  });
  if (!completion || completion.status !== "REJECTED") return;

  await prisma.taskCompletion.delete({ where: { id: completionId } });
  await prisma.notification.create({
    data: {
      title: "أُتيحت إعادة رفع الإثبات",
      body: `يمكنك الآن إعادة رفع إثبات مهمة «${completion.task.title}» من «المهام غير المنجزة».`,
      targetRole: "USER",
      targetUserId: completion.studentId,
      createdById: user.id,
    },
  });

  revalidatePath("/supervisor/progress");
  revalidatePath("/supervisor/review");
  revalidatePath(`/supervisor/students/${completion.studentId}`);
  revalidatePath("/student/tasks");
  revalidatePath("/student/completed");
}

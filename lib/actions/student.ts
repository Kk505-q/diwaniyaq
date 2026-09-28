"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guard";
import { getCurrentUser } from "@/lib/auth";
import { isAllowedProof } from "@/lib/uploads";
import { periodKeyFor } from "@/lib/dates";
import { applyPointsDelta } from "@/lib/points";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/actions/auth";

// Per-file and per-request caps kept under the platform's ~4.5MB request-body
// limit so uploads don't fail silently at the edge.
const MAX_PROOF_BYTES = 4 * 1024 * 1024;
const MAX_PROOF_TOTAL_BYTES = 4 * 1024 * 1024;
const MAX_PROOF_FILES = 10;

function totalSize(files: File[]) {
  return files.reduce((sum, f) => sum + f.size, 0);
}

export async function completeTaskAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("STUDENT");
  const taskId = String(formData.get("taskId") || "");

  const task = await prisma.habitTask.findUnique({ where: { id: taskId } });
  if (!task || !task.active) {
    return { error: "المهمة غير موجودة" };
  }

  const periodKey = periodKeyFor(task.frequency);
  const existing = await prisma.taskCompletion.findUnique({
    where: { taskId_studentId_periodKey: { taskId, studentId: user.id, periodKey } },
  });
  if (existing) {
    return { error: "تم إنجاز هذه المهمة مسبقًا لهذه الفترة" };
  }

  let proofFiles: { mimeType: string; data: Uint8Array }[] = [];
  if (task.requiresProof) {
    const files = formData.getAll("proof").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) {
      return { error: "هذه المهمة تتطلب إرفاق ملف إثبات" };
    }
    if (files.length > MAX_PROOF_FILES) {
      return { error: `الحد الأقصى ${MAX_PROOF_FILES} ملفات` };
    }
    if (totalSize(files) > MAX_PROOF_TOTAL_BYTES) {
      return { error: "إجمالي حجم الملفات كبير جدًا. ارفع ملفات أصغر، أو أضف الباقي لاحقًا من «المهام المنجزة»." };
    }
    for (const file of files) {
      if (file.size > MAX_PROOF_BYTES) {
        return { error: "حجم أحد الملفات كبير جدًا (الحد الأقصى 4 ميجابايت لكل ملف)" };
      }
      if (!isAllowedProof(file.type)) {
        return { error: "نوع الملف غير مدعوم. المسموح: صور (PNG/JPG/WEBP/GIF) أو PDF." };
      }
      proofFiles.push({
        mimeType: file.type || "application/octet-stream",
        data: new Uint8Array(await file.arrayBuffer()),
      });
    }
  }

  const status = task.requiresProof ? "PENDING_REVIEW" : "APPROVED";

  const completion = await prisma.taskCompletion.create({
    data: { taskId, studentId: user.id, periodKey, status },
  });

  for (const pf of proofFiles) {
    await prisma.proofFile.create({
      data: {
        completionId: completion.id,
        mimeType: pf.mimeType,
        data: pf.data as Uint8Array<ArrayBuffer>,
      },
    });
  }

  if (status === "APPROVED") {
    await applyPointsDelta(user.id, task.points, `إنجاز مهمة: ${task.title}`, user.id);
  }

  revalidatePath("/student/tasks");
  revalidatePath("/student/completed");
  revalidatePath("/student/leaderboard");
  revalidatePath("/supervisor/progress");
  return {};
}

// Add one or more proof files to an existing completion the student owns.
export async function addProofFilesAction(
  _prevState: { error?: string; ok?: boolean },
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireRole("STUDENT");
  const completionId = String(formData.get("completionId") || "");

  const completion = await prisma.taskCompletion.findUnique({
    where: { id: completionId },
    include: { proofFiles: { select: { id: true } } },
  });
  if (!completion || completion.studentId !== user.id) {
    return { error: "غير مصرح" };
  }

  const files = formData.getAll("proof").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "الرجاء اختيار ملف" };
  if (completion.proofFiles.length + files.length > MAX_PROOF_FILES) {
    return { error: `الحد الأقصى ${MAX_PROOF_FILES} ملفات لكل مهمة` };
  }
  if (totalSize(files) > MAX_PROOF_TOTAL_BYTES) {
    return { error: "إجمالي حجم الملفات كبير جدًا. ارفعها على دفعات أصغر." };
  }

  for (const file of files) {
    if (file.size > MAX_PROOF_BYTES) {
      return { error: "حجم أحد الملفات كبير جدًا (الحد الأقصى 4 ميجابايت لكل ملف)" };
    }
    if (!isAllowedProof(file.type)) {
      return { error: "نوع الملف غير مدعوم. المسموح: صور (PNG/JPG/WEBP/GIF) أو PDF." };
    }
    await prisma.proofFile.create({
      data: {
        completionId,
        mimeType: file.type || "application/octet-stream",
        data: (new Uint8Array(await file.arrayBuffer())) as Uint8Array<ArrayBuffer>,
      },
    });
  }

  revalidatePath("/student/completed");
  revalidatePath("/supervisor/progress");
  return { ok: true };
}

// Delete a single proof file. Allowed for the owning student, or supervisor/admin.
export async function deleteProofFileAction(proofFileId: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "يجب تسجيل الدخول" };

  const proof = await prisma.proofFile.findUnique({
    where: { id: proofFileId },
    include: { completion: { select: { studentId: true } } },
  });
  if (!proof) return {};

  const isStaff = user.role === "SUPERVISOR" || user.role === "ADMIN";
  if (proof.completion.studentId !== user.id && !isStaff) {
    return { error: "غير مصرح" };
  }

  await prisma.proofFile.delete({ where: { id: proofFileId } }).catch(() => {});
  revalidatePath("/student/completed");
  revalidatePath("/supervisor/progress");
  return {};
}

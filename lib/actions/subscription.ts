"use server";

import { prisma } from "@/lib/db";
import { requireAnyRole } from "@/lib/guard";
import { revalidatePath } from "next/cache";
import type { SubscriptionStatus } from "@prisma/client";

const VALUES: SubscriptionStatus[] = ["UNPAID", "HALF", "PAID"];

// Set a student's subscription (payment) status. Available to both the
// admin and supervisors.
export async function setSubscriptionAction(studentId: string, value: string) {
  await requireAnyRole(["ADMIN", "SUPERVISOR"]);

  if (!studentId || !VALUES.includes(value as SubscriptionStatus)) {
    return { error: "بيانات غير صالحة" };
  }

  const target = await prisma.user.findUnique({ where: { id: studentId } });
  if (!target || target.role !== "STUDENT") {
    return { error: "الطالب غير موجود" };
  }

  await prisma.user.update({
    where: { id: studentId },
    data: { subscription: value as SubscriptionStatus },
  });

  revalidatePath("/admin");
  revalidatePath("/supervisor/progress");
  return {};
}

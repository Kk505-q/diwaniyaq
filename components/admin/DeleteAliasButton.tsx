"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteStudentAliasAction } from "@/lib/actions/account";

// Supervisor/admin: permanently delete a student's alias.
export function DeleteAliasButton({ studentId, alias }: { studentId: string; alias: string | null }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (!alias) return null;

  function del() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    start(async () => {
      await deleteStudentAliasAction(studentId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={del}
      disabled={pending}
      className={`rounded-lg border px-2.5 py-1 text-xs font-bold disabled:opacity-50 ${
        confirming ? "border-danger bg-danger text-white" : "border-danger/30 text-danger"
      }`}
    >
      {pending ? "..." : confirming ? "تأكيد الحذف؟" : "حذف الاسم المستعار"}
    </button>
  );
}

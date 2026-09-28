"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteStudentAction } from "@/lib/actions/supervisor";

export function DeleteStudentButton({ studentId, name }: { studentId: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  function remove() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    start(async () => {
      await deleteStudentAction(studentId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={remove}
        disabled={pending}
        className={`rounded-lg border px-2.5 py-1 text-xs font-bold disabled:opacity-50 ${
          confirming ? "border-danger bg-danger text-white" : "border-danger/30 text-danger"
        }`}
      >
        {pending ? "..." : confirming ? `تأكيد حذف «${name}»؟` : "حذف"}
      </button>
      {confirming && !pending && (
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-border px-2.5 py-1 text-xs text-foreground/60"
        >
          إلغاء
        </button>
      )}
    </div>
  );
}

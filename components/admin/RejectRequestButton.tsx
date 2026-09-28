"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rejectPendingUserAction } from "@/lib/actions/admin";

export function RejectRequestButton({ userId, name }: { userId: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  function reject() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    start(async () => {
      await rejectPendingUserAction(userId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={reject}
        disabled={pending}
        className={`rounded-lg border px-3 py-1.5 text-sm font-bold disabled:opacity-50 ${
          confirming ? "border-danger bg-danger text-white" : "border-danger/30 text-danger"
        }`}
      >
        {pending ? "..." : confirming ? `تأكيد رفض «${name}»؟` : "رفض الطلب"}
      </button>
      {confirming && !pending && (
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground/60"
        >
          إلغاء
        </button>
      )}
    </div>
  );
}

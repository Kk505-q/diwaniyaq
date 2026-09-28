"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewCompletionAction } from "@/lib/actions/supervisor";

export function ReviewButtons({ completionId }: { completionId: string }) {
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  function approve() {
    startTransition(async () => {
      await reviewCompletionAction(completionId, true);
      router.refresh();
    });
  }

  function confirmReject() {
    startTransition(async () => {
      await reviewCompletionAction(completionId, false, reason);
      setRejecting(false);
      setReason("");
      router.refresh();
    });
  }

  if (rejecting) {
    return (
      <div className="space-y-2">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="سبب الرفض (اختياري) — سيظهر للطالب"
          className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            disabled={pending}
            onClick={confirmReject}
            className="rounded-lg bg-danger px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {pending ? "..." : "تأكيد الرفض"}
          </button>
          <button
            disabled={pending}
            onClick={() => {
              setRejecting(false);
              setReason("");
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        disabled={pending}
        onClick={approve}
        className="rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
      >
        قبول
      </button>
      <button
        disabled={pending}
        onClick={() => setRejecting(true)}
        className="rounded-lg bg-danger px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
      >
        رفض
      </button>
    </div>
  );
}

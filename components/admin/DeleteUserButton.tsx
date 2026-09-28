"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteUserAction } from "@/lib/actions/admin";

export function DeleteUserButton({ userId, name }: { userId: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    setError(null);
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const res = await deleteUserAction(userId);
      if (res?.error) {
        setError(res.error);
        setConfirming(false);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        <button
          onClick={onClick}
          disabled={pending}
          title={`حذف ${name}`}
          className={`rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50 ${
            confirming ? "border-danger bg-danger text-white" : "border-danger/30 text-danger"
          }`}
        >
          {confirming ? "تأكيد الحذف؟" : "حذف"}
        </button>
        {confirming && !pending && (
          <button
            onClick={() => setConfirming(false)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs"
          >
            إلغاء
          </button>
        )}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

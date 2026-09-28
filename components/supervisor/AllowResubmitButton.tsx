"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { allowResubmitAction } from "@/lib/actions/supervisor";

export function AllowResubmitButton({ completionId }: { completionId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function allow() {
    start(async () => {
      await allowResubmitAction(completionId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={allow}
      disabled={pending}
      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
    >
      {pending ? "..." : "إتاحة إعادة الرفع"}
    </button>
  );
}

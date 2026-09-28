"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSubscriptionAction } from "@/lib/actions/subscription";
import { SUBSCRIPTION_ADMIN_LABEL, SUBSCRIPTION_COLOR } from "@/lib/labels";

const OPTIONS: Array<keyof typeof SUBSCRIPTION_ADMIN_LABEL> = ["PAID", "HALF", "UNPAID"];

export function SubscriptionSelect({ studentId, value }: { studentId: string; value: string }) {
  const [current, setCurrent] = useState(value);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onChange(next: string) {
    const prev = current;
    setCurrent(next);
    startTransition(async () => {
      const res = await setSubscriptionAction(studentId, next);
      if (res?.error) setCurrent(prev);
      router.refresh();
    });
  }

  return (
    <select
      value={current}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border border-border px-2 py-1.5 text-xs font-bold disabled:opacity-50 ${SUBSCRIPTION_COLOR[current]}`}
    >
      {OPTIONS.map((o) => (
        <option key={o} value={o} className="bg-surface text-foreground">
          {SUBSCRIPTION_ADMIN_LABEL[o]}
        </option>
      ))}
    </select>
  );
}

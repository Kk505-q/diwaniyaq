"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAliasDisabledAction } from "@/lib/actions/account";

// Supervisor/admin control to cancel or restore a student's alias.
export function AliasToggle({
  studentId,
  disabled,
  alias,
}: {
  studentId: string;
  disabled: boolean;
  alias: string | null;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (!alias) {
    return <span className="text-xs text-foreground/30">لا يوجد اسم مستعار</span>;
  }

  function toggle() {
    start(async () => {
      await setAliasDisabledAction(studentId, !disabled);
      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`rounded-lg border px-2 py-1 text-xs font-bold disabled:opacity-50 ${
        disabled
          ? "border-success/30 text-success hover:bg-success/10"
          : "border-danger/30 text-danger hover:bg-danger/10"
      }`}
    >
      {pending ? "..." : disabled ? "تفعيل الاسم المستعار" : "إلغاء الاسم المستعار"}
    </button>
  );
}

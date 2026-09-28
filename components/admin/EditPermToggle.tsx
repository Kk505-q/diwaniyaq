"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setGlobalEditPermissionAction, setStudentEditPermissionAction } from "@/lib/actions/account";

// Open/close toggle for an edit permission. scope === "global" flips the
// everyone-setting; any other value is a student id (per-student setting).
export function EditPermToggle({
  field,
  scope,
  value,
  label,
}: {
  field: "alias" | "name";
  scope: "global" | string;
  value: boolean;
  label?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function toggle() {
    start(async () => {
      if (scope === "global") await setGlobalEditPermissionAction(field, !value);
      else await setStudentEditPermissionAction(scope, field, !value);
      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`rounded-lg border px-2.5 py-1 text-xs font-bold disabled:opacity-50 ${
        value ? "border-success/40 bg-success/10 text-success" : "border-border text-foreground/60"
      }`}
    >
      {label ? `${label}: ` : ""}
      {pending ? "..." : value ? "مفتوح" : "مغلق"}
    </button>
  );
}

"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { assignRoleAction } from "@/lib/actions/admin";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand px-4 py-1.5 text-sm font-bold text-white disabled:opacity-60"
    >
      {pending ? "..." : "حفظ"}
    </button>
  );
}

export function AssignRoleForm({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [state, formAction] = useActionState(assignRoleAction, initialState);
  const [role, setRole] = useState(currentRole === "PENDING" ? "STUDENT" : currentRole);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      {state.error && <p className="w-full text-xs text-danger">{state.error}</p>}
      <select
        name="role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="rounded-lg border border-border px-3 py-1.5 text-sm"
      >
        <option value="STUDENT">طالب</option>
        <option value="SUPERVISOR">مشرف</option>
        <option value="ADMIN">إدارة</option>
      </select>
      <SubmitButton />
    </form>
  );
}

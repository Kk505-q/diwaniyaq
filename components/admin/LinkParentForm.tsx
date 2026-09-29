"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { linkParentChildAction } from "@/lib/actions/admin";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
    >
      {pending ? "..." : "ربط"}
    </button>
  );
}

export function LinkParentForm({
  parents,
  students,
}: {
  parents: { id: string; name: string }[];
  students: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(linkParentChildAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface p-4">
      {state.error && <p className="w-full text-xs text-danger">{state.error}</p>}
      <div>
        <label className="mb-1 block text-xs text-foreground/50">ولي الأمر</label>
        <select name="parentId" required className="rounded-lg border border-border px-3 py-2 text-sm">
          <option value="">اختر</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-foreground/50">الطالب</label>
        <select name="studentId" required className="rounded-lg border border-border px-3 py-2 text-sm">
          <option value="">اختر</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <SubmitButton />
    </form>
  );
}

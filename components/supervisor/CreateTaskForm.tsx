"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createTaskAction } from "@/lib/actions/supervisor";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? "جارٍ الإضافة..." : "إضافة المهمة"}
    </button>
  );
}

export function CreateTaskForm() {
  const [state, formAction] = useActionState(createTaskAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <h3 className="font-bold">إضافة مهمة جديدة</h3>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <input
        name="title"
        required
        placeholder="عنوان المهمة"
        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
      />
      <textarea
        name="description"
        placeholder="الوصف (اختياري)"
        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="number"
          name="points"
          required
          min={1}
          defaultValue={10}
          className="w-24 rounded-lg border border-border px-3 py-2 text-sm"
        />
        <select name="frequency" defaultValue="DAILY" className="rounded-lg border border-border px-3 py-2 text-sm">
          <option value="DAILY">يومي</option>
          <option value="WEEKLY">أسبوعي</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="requiresProof" />
          يتطلب إثبات / ملف من الطالب
        </label>
      </div>
      <SubmitButton />
    </form>
  );
}

"use client";

import { useState, useTransition, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { updateTaskAction, toggleTaskActiveAction, deleteTaskAction } from "@/lib/actions/supervisor";
import type { ActionState } from "@/lib/actions/auth";
import { FREQ_LABEL } from "@/lib/labels";

type Task = {
  id: string;
  title: string;
  description: string | null;
  points: number;
  frequency: "DAILY" | "WEEKLY";
  requiresProof: boolean;
  active: boolean;
};

const initialState: ActionState = {};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
    >
      {pending ? "..." : "حفظ"}
    </button>
  );
}

export function TaskRow({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [state, formAction] = useActionState(updateTaskAction, initialState);

  function toggleActive() {
    startTransition(async () => {
      await toggleTaskActiveAction(task.id);
      router.refresh();
    });
  }

  function remove() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    startTransition(async () => {
      await deleteTaskAction(task.id);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <form action={formAction} className="space-y-2 rounded-xl border border-brand bg-surface p-4">
        <input type="hidden" name="id" value={task.id} />
        {state.error && <p className="text-xs text-danger">{state.error}</p>}
        <input
          name="title"
          defaultValue={task.title}
          required
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          placeholder="عنوان المهمة"
        />
        <textarea
          name="description"
          defaultValue={task.description ?? ""}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          placeholder="الوصف (اختياري)"
        />
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="number"
            name="points"
            defaultValue={task.points}
            required
            min={1}
            className="w-24 rounded-lg border border-border px-3 py-2 text-sm"
          />
          <select
            name="frequency"
            defaultValue={task.frequency}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            <option value="DAILY">يومي</option>
            <option value="WEEKLY">أسبوعي</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="requiresProof" defaultChecked={task.requiresProof} />
            يتطلب إثبات / ملف
          </label>
        </div>
        <div className="flex gap-2">
          <SaveButton />
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs"
          >
            إلغاء
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`flex flex-col justify-between gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-start ${
        !task.active ? "opacity-50" : ""
      }`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold">{task.title}</h3>
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
            {FREQ_LABEL[task.frequency]}
          </span>
          {task.requiresProof && (
            <span className="rounded-full bg-accent-gold/10 px-2 py-0.5 text-xs font-bold text-accent-gold">
              يتطلب إثبات
            </span>
          )}
          {!task.active && <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs">معطّلة</span>}
        </div>
        {task.description && <p className="mt-1 text-sm text-foreground/60">{task.description}</p>}
        <p className="mt-1 text-sm font-bold text-accent-gold">{task.points} نقطة</p>
      </div>
      <div className="flex shrink-0 flex-row gap-2">
        <button onClick={() => setEditing(true)} className="rounded-lg border border-border px-3 py-1.5 text-xs">
          تعديل
        </button>
        <button
          disabled={pending}
          onClick={toggleActive}
          className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-50"
        >
          {task.active ? "تعطيل" : "تفعيل"}
        </button>
        <button
          disabled={pending}
          onClick={remove}
          className={`rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50 ${
            confirmingDelete
              ? "border-danger bg-danger text-white"
              : "border-danger/30 text-danger"
          }`}
        >
          {confirmingDelete ? "تأكيد الحذف؟" : "حذف"}
        </button>
        {confirmingDelete && (
          <button
            disabled={pending}
            onClick={() => setConfirmingDelete(false)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-50"
          >
            إلغاء
          </button>
        )}
      </div>
    </div>
  );
}

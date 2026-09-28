"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { adjustPointsAction } from "@/lib/actions/supervisor";
import { ALL_STUDENTS } from "@/lib/sentinels";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand-navy py-2 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "جارٍ الحفظ..." : "تطبيق"}
    </button>
  );
}

export function AdjustPointsForm({
  students,
  fixedStudentId,
}: {
  students?: { id: string; name: string }[];
  fixedStudentId?: string;
}) {
  const [state, formAction] = useActionState(adjustPointsAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <h3 className="font-bold">إضافة / خصم نقاط</h3>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      {fixedStudentId ? (
        <input type="hidden" name="studentId" value={fixedStudentId} />
      ) : (
        <select name="studentId" required defaultValue="" className="w-full rounded-lg border border-border px-3 py-2 text-sm">
          <option value="" disabled>
            اختر الطالب
          </option>
          <option value={ALL_STUDENTS}>الجميع (كل الطلاب)</option>
          {students?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      <div className="flex gap-2">
        <select name="operation" defaultValue="add" className="rounded-lg border border-border px-3 py-2 text-sm">
          <option value="add">إضافة</option>
          <option value="deduct">خصم</option>
        </select>
        <input
          type="number"
          name="amount"
          required
          min={1}
          placeholder="عدد النقاط"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>

      <input
        type="text"
        name="reason"
        required
        placeholder="السبب"
        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
      />
      <p className="text-xs text-foreground/50">
        ملاحظة: النقاط المضافة/المخصومة يدويًا تظهر للطالب وفي الترتيب بعد ٥ ساعات.
      </p>
      <SubmitButton />
    </form>
  );
}

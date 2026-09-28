"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { sendNotificationAction } from "@/lib/actions/notifications";
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
      {pending ? "جارٍ الإرسال..." : "إرسال الإشعار"}
    </button>
  );
}

export function SendNotificationForm({ students }: { students: { id: string; name: string }[] }) {
  const [state, formAction] = useActionState(sendNotificationAction, initialState);
  const [targetType, setTargetType] = useState("ALL");

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-border bg-surface p-4">
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <input
        name="title"
        required
        placeholder="عنوان الإشعار"
        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
      />
      <textarea
        name="body"
        required
        placeholder="نص الإشعار"
        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
      />
      <select
        name="targetType"
        value={targetType}
        onChange={(e) => setTargetType(e.target.value)}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
      >
        <option value="ALL">الجميع</option>
        <option value="STUDENT">الطلاب</option>
        <option value="USER">طالب محدد</option>
      </select>
      {targetType === "USER" && (
        <select name="targetUserId" required className="w-full rounded-lg border border-border px-3 py-2 text-sm">
          <option value="">اختر الطالب</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}
      <SubmitButton />
    </form>
  );
}

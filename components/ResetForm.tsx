"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { resetPasswordAction, type PasswordActionState } from "@/lib/actions/password";

const initialState: PasswordActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand py-3 font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? "جارٍ الحفظ..." : "تعيين كلمة المرور الجديدة"}
    </button>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  if (state.success) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">{state.success}</div>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-brand px-6 py-3 font-bold text-white hover:bg-brand-dark"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.error && (
        <div className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">{state.error}</div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/70">كلمة المرور الجديدة</label>
        <input
          type="password"
          name="password"
          required
          minLength={6}
          dir="ltr"
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-left focus:border-brand focus:outline-none"
          placeholder="6 أحرف على الأقل"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/70">تأكيد كلمة المرور</label>
        <input
          type="password"
          name="confirm"
          required
          minLength={6}
          dir="ltr"
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-left focus:border-brand focus:outline-none"
          placeholder="أعد كتابة كلمة المرور"
        />
      </div>
      <SubmitButton />
    </form>
  );
}

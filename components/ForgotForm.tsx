"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { forgotPasswordAction, type PasswordActionState } from "@/lib/actions/password";

const initialState: PasswordActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand py-3 font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? "جارٍ الإرسال..." : "إرسال رابط إعادة التعيين"}
    </button>
  );
}

export function ForgotForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">{state.error}</div>
      )}
      {state.success && (
        <div className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">{state.success}</div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/70">البريد الإلكتروني</label>
        <input
          type="email"
          name="email"
          required
          dir="ltr"
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-left focus:border-brand focus:outline-none"
          placeholder="example@email.com"
        />
      </div>
      <SubmitButton />
      <p className="text-center text-sm text-foreground/60">
        <Link href="/login" className="font-semibold text-brand hover:underline">
          العودة لتسجيل الدخول
        </Link>
      </p>
    </form>
  );
}

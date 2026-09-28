"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { loginAction, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand py-3 font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? "جارٍ الدخول..." : "تسجيل الدخول"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">{state.error}</div>
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
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/70">كلمة المرور</label>
        <input
          type="password"
          name="password"
          required
          dir="ltr"
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-left focus:border-brand focus:outline-none"
          placeholder="••••••••"
        />
      </div>
      <div className="text-center">
        <Link href="/forgot" className="text-sm font-medium text-brand hover:underline">
          نسيت كلمة المرور؟
        </Link>
      </div>
      <SubmitButton />
      <p className="text-center text-sm text-foreground/60">
        ليس لديك حساب؟{" "}
        <Link href="/signup" className="font-semibold text-brand hover:underline">
          سجّل الآن
        </Link>
      </p>
    </form>
  );
}

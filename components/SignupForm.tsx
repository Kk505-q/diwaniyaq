"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signupAction, type ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand py-3 font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? "جارٍ الإنشاء..." : "إنشاء حساب"}
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">{state.error}</div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/70">الاسم الحقيقي كامل</label>
        <input
          type="text"
          name="name"
          required
          className="w-full rounded-xl border border-border bg-white px-4 py-3 focus:border-brand focus:outline-none"
          placeholder="اسمك الحقيقي الكامل"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/70">الاسم المستعار</label>
        <input
          type="text"
          name="alias"
          required
          className="w-full rounded-xl border border-border bg-white px-4 py-3 focus:border-brand focus:outline-none"
          placeholder="الاسم الذي يظهر للآخرين"
        />
        <p className="mt-1 text-xs text-foreground/50">
          إلزامي. هو الاسم الذي يظهر في لوحة الترتيب وفي الرسائل بدل اسمك الحقيقي.
        </p>
      </div>
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
          minLength={6}
          dir="ltr"
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-left focus:border-brand focus:outline-none"
          placeholder="6 أحرف على الأقل"
        />
      </div>
      <SubmitButton />
      <p className="text-center text-sm text-foreground/60">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          سجّل الدخول
        </Link>
      </p>
    </form>
  );
}

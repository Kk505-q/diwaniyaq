"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Avatar } from "@/components/Avatar";
import {
  updateProfileAction,
  updateAvatarAction,
  deleteAvatarAction,
  changePasswordAction,
  type AccountState,
} from "@/lib/actions/account";

const initial: AccountState = {};

function Save({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-lg bg-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
    >
      {pending ? "جارٍ الحفظ..." : label}
    </button>
  );
}

function Feedback({ state }: { state: AccountState }) {
  if (state.error) return <p className="text-sm text-danger">{state.error}</p>;
  if (state.success) return <p className="text-sm text-success">{state.success}</p>;
  return null;
}

export function AccountView({
  user,
  canEditName = true,
  canEditAlias = true,
  hasAvatar = false,
}: {
  user: { id: string; name: string; alias: string | null; email: string; role: string; subscription: string };
  canEditName?: boolean;
  canEditAlias?: boolean;
  hasAvatar?: boolean;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">حسابي</h2>
      <AvatarSection user={user} hasAvatar={hasAvatar} />
      <ProfileSection user={user} canEditName={canEditName} canEditAlias={canEditAlias} />
      <PasswordSection />
    </div>
  );
}

function AvatarSection({ user, hasAvatar }: { user: { id: string; name: string }; hasAvatar: boolean }) {
  const [state, formAction] = useActionState(updateAvatarAction, initial);
  const [version, setVersion] = useState<number>(0);
  const [deleteState, setDeleteState] = useState<AccountState>({});
  const [deleting, startDelete] = useTransition();
  const [fileError, setFileError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      setVersion(Date.now());
      setDeleteState({});
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    }
  }, [state, router]);

  function remove() {
    startDelete(async () => {
      const res = await deleteAvatarAction();
      setDeleteState(res);
      if (res.success) {
        setVersion(Date.now());
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
      <h3 className="font-bold">الصورة الشخصية</h3>
      <div className="flex flex-wrap items-center gap-4">
        <Avatar userId={user.id} name={user.name} size={64} version={version} />
        <form action={formAction} className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            name="avatar"
            accept="image/*"
            required
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFileError(f && f.size > 4 * 1024 * 1024 ? "حجم الصورة أكبر من ٤ ميجابايت. اختر صورة أصغر." : "");
            }}
            className="text-sm file:me-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:text-sm file:font-bold file:text-brand"
          />
          <Save label={hasAvatar ? "تغيير الصورة" : "رفع الصورة"} disabled={!!fileError} />
        </form>
        {hasAvatar && (
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            className="rounded-lg border border-danger/30 px-4 py-2 text-sm font-bold text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            {deleting ? "..." : "حذف الصورة"}
          </button>
        )}
      </div>
      {fileError && <p className="text-sm text-danger">{fileError}</p>}
      <Feedback state={state} />
      <Feedback state={deleteState} />
    </section>
  );
}

function ProfileSection({
  user,
  canEditName,
  canEditAlias,
}: {
  user: { name: string; alias: string | null; email: string; role: string };
  canEditName: boolean;
  canEditAlias: boolean;
}) {
  const [state, formAction] = useActionState(updateProfileAction, initial);
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state, router]);

  const lockedClass = "w-full cursor-not-allowed rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground/50";
  const editableClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const nothingEditable = !canEditName && !canEditAlias;

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <h3 className="font-bold">البيانات الشخصية</h3>
      <form action={formAction} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold">الاسم الحقيقي كامل</label>
          <input
            name="name"
            defaultValue={user.name}
            required={canEditName}
            disabled={!canEditName}
            className={canEditName ? editableClass : lockedClass}
          />
          {!canEditName && (
            <p className="text-xs text-foreground/50">تعديل الاسم مغلق حاليًا. للتعديل تواصل مع الإدارة.</p>
          )}
        </div>
        {user.role === "STUDENT" && (
          <div className="space-y-1">
            <label className="text-sm font-semibold">الاسم المستعار</label>
            <input
              name="alias"
              defaultValue={user.alias ?? ""}
              disabled={!canEditAlias}
              className={canEditAlias ? editableClass : lockedClass}
            />
            <p className="text-xs text-foreground/50">
              {canEditAlias
                ? "يظهر في لوحة الترتيب العامة بدل اسمك الحقيقي."
                : "تعديل الاسم المستعار مغلق حاليًا. للتعديل تواصل مع الإدارة."}
            </p>
          </div>
        )}
        <div className="space-y-1">
          <label className="text-sm font-semibold">البريد الإلكتروني</label>
          <input defaultValue={user.email} disabled dir="ltr" className={`${lockedClass} text-left`} />
          <p className="text-xs text-foreground/50">لا يمكن تغيير البريد الإلكتروني.</p>
        </div>
        <Feedback state={state} />
        {!nothingEditable && <Save label="حفظ البيانات" />}
      </form>
    </section>
  );
}

function PasswordSection() {
  const [state, formAction] = useActionState(changePasswordAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <h3 className="font-bold">تغيير كلمة المرور</h3>
      <p className="text-xs text-foreground/50">
        لتغيير كلمة المرور، أدخل كلمة المرور الحالية ثم الجديدة. أو استخدم رابط البريد أدناه إذا نسيتها.
      </p>
      <form ref={formRef} action={formAction} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold">كلمة المرور الحالية</label>
          <input
            type="password"
            name="current"
            required
            dir="ltr"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">كلمة المرور الجديدة</label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            dir="ltr"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">تأكيد كلمة المرور الجديدة</label>
          <input
            type="password"
            name="confirm"
            required
            minLength={6}
            dir="ltr"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm"
          />
        </div>
        <Feedback state={state} />
        <Save label="تغيير كلمة المرور" />
      </form>
      <div className="border-t border-border pt-3">
        <Link href="/forgot" className="text-sm font-semibold text-brand hover:underline">
          نسيت كلمة المرور؟ إرسال رابط عبر البريد
        </Link>
      </div>
    </section>
  );
}

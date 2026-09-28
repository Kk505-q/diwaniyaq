"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { completeTaskAction } from "@/lib/actions/student";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};
const MAX_FILE = 4 * 1024 * 1024;
const MAX_TOTAL = 4 * 1024 * 1024;

function SubmitButton({ requiresProof, disabled }: { requiresProof: boolean; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full rounded-lg bg-brand py-2 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? "جارٍ الحفظ..." : requiresProof ? "رفع الإثبات وإنجاز المهمة" : "تحديد كمنجز"}
    </button>
  );
}

export function TaskCompleteForm({ taskId, requiresProof }: { taskId: string; requiresProof: boolean }) {
  const [state, formAction] = useActionState(completeTaskAction, initialState);
  const [fileError, setFileError] = useState("");
  const [hasFiles, setHasFiles] = useState(false);

  function validateFiles(files: FileList | null) {
    setHasFiles(!!files && files.length > 0);
    if (!files || files.length === 0) {
      setFileError("");
      return;
    }
    let total = 0;
    for (const f of Array.from(files)) {
      total += f.size;
      if (f.size > MAX_FILE) {
        setFileError("حجم أحد الملفات أكبر من ٤ ميجابايت. اختر ملفًا أصغر.");
        return;
      }
    }
    if (total > MAX_TOTAL) {
      setFileError("إجمالي حجم الملفات أكبر من ٤ ميجابايت. قلّل عددها أو أضف الباقي لاحقًا.");
      return;
    }
    setFileError("");
  }

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="taskId" value={taskId} />
      {requiresProof && (
        <div className="space-y-1">
          <input
            type="file"
            name="proof"
            required
            multiple
            accept="image/*,.pdf"
            onChange={(e) => validateFiles(e.target.files)}
            className="block w-full text-xs text-foreground/70 file:ml-2 file:rounded-lg file:border-0 file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-semibold"
          />
          <p className="text-[11px] text-foreground/40">
            يمكنك اختيار أكثر من ملف (حتى ٤ ميجابايت). تستطيع إضافة أو حذف الملفات لاحقًا من «المهام المنجزة».
          </p>
          {fileError && <p className="text-xs text-danger">{fileError}</p>}
          {!hasFiles && <p className="text-[11px] text-foreground/40">إرفاق الإثبات إلزامي لإنجاز هذه المهمة.</p>}
        </div>
      )}
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
      <SubmitButton requiresProof={requiresProof} disabled={!!fileError || (requiresProof && !hasFiles)} />
    </form>
  );
}

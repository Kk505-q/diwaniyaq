"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { addProofFilesAction, deleteProofFileAction } from "@/lib/actions/student";
import { ProofLightbox } from "@/components/ProofLightbox";

type ProofFile = { id: string; mimeType: string };

const initial: { error?: string; ok?: boolean } = {};
const MAX_FILE = 4 * 1024 * 1024;
const MAX_TOTAL = 4 * 1024 * 1024;

function AddButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
    >
      {pending ? "جارٍ الرفع..." : "إضافة ملفات"}
    </button>
  );
}

export function ProofManager({ completionId, files }: { completionId: string; files: ProofFile[] }) {
  const [state, formAction] = useActionState(addProofFilesAction, initial);
  const [pending, startDelete] = useTransition();
  const [adding, setAdding] = useState(false);
  const [fileError, setFileError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function validateFiles(fl: FileList | null) {
    if (!fl || fl.length === 0) return setFileError("");
    let total = 0;
    for (const f of Array.from(fl)) {
      total += f.size;
      if (f.size > MAX_FILE) return setFileError("حجم أحد الملفات أكبر من ٤ ميجابايت.");
    }
    if (total > MAX_TOTAL) return setFileError("إجمالي الحجم أكبر من ٤ ميجابايت. أضفها على دفعات.");
    setFileError("");
  }

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setAdding(false);
      router.refresh();
    }
  }, [state, router]);

  function del(id: string) {
    startDelete(async () => {
      await deleteProofFileAction(id);
      router.refresh();
    });
  }

  return (
    <div className="mt-2 space-y-2">
      {files.length > 0 && <ProofLightbox files={files} onDelete={del} deleting={pending} />}

      {adding ? (
        <form ref={formRef} action={formAction} className="space-y-1">
          <input type="hidden" name="completionId" value={completionId} />
          <input
            type="file"
            name="proof"
            multiple
            required
            accept="image/*,.pdf"
            onChange={(e) => validateFiles(e.target.files)}
            className="block w-full text-xs text-foreground/70 file:ml-2 file:rounded-lg file:border-0 file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-semibold"
          />
          {fileError && <p className="text-xs text-danger">{fileError}</p>}
          {state.error && <p className="text-xs text-danger">{state.error}</p>}
          <div className="flex gap-2">
            <AddButton disabled={!!fileError} />
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs"
            >
              إلغاء
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-xs font-semibold text-brand hover:underline"
        >
          + إضافة ملف إثبات
        </button>
      )}
    </div>
  );
}

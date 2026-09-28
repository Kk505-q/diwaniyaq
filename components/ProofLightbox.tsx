"use client";

import { useEffect, useState } from "react";

type ProofFile = { id: string; mimeType: string };

// Shows proof files as thumbnails; clicking one opens an in-app viewer overlay
// with a clear close button (so the user isn't stuck on a raw file view).
// When `onDelete` is provided, each thumbnail gets a delete badge.
export function ProofLightbox({
  files,
  onDelete,
  deleting,
}: {
  files: ProofFile[];
  onDelete?: (id: string) => void;
  deleting?: boolean;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIdx(null);
    }
    if (openIdx !== null) {
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [openIdx]);

  if (files.length === 0) return null;

  const current = openIdx !== null ? files[openIdx] : null;

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {files.map((f, i) => (
          <div key={f.id} className="relative">
            <button
              onClick={() => setOpenIdx(i)}
              className="block h-24 w-24 overflow-hidden rounded-lg border border-border bg-background"
              aria-label={`عرض إثبات ${i + 1}`}
            >
              {f.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/proof/${f.id}`} alt={`إثبات ${i + 1}`} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center text-xs font-semibold text-brand">
                  <span className="text-2xl">📄</span>
                  إثبات {i + 1}
                </span>
              )}
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(f.id)}
                disabled={deleting}
                aria-label="حذف الملف"
                className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-danger text-xs font-bold text-white shadow disabled:opacity-50"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpenIdx(null)}
        >
          <button
            onClick={() => setOpenIdx(null)}
            className="absolute right-4 top-4 flex items-center gap-1 rounded-lg bg-white/15 px-3 py-2 text-sm font-bold text-white backdrop-blur hover:bg-white/25"
          >
            ✕ إغلاق
          </button>

          {files.length > 1 && openIdx !== null && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIdx((openIdx - 1 + files.length) % files.length);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-white hover:bg-white/25"
                aria-label="السابق"
              >
                ›
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIdx((openIdx + 1) % files.length);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-white hover:bg-white/25"
                aria-label="التالي"
              >
                ‹
              </button>
            </>
          )}

          <div onClick={(e) => e.stopPropagation()} className="flex max-h-full max-w-full flex-col items-center gap-3">
            {current.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/proof/${current.id}`}
                alt="إثبات"
                className="max-h-[80vh] max-w-full rounded-lg object-contain"
              />
            ) : (
              <iframe
                src={`/api/proof/${current.id}`}
                title="إثبات"
                className="h-[80vh] w-[90vw] rounded-lg bg-white"
              />
            )}
            <a
              href={`/api/proof/${current.id}`}
              target="_blank"
              rel="noopener"
              className="text-sm font-bold text-white/80 underline"
            >
              فتح في نافذة جديدة
            </a>
          </div>
        </div>
      )}
    </>
  );
}

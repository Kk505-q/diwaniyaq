"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function ChildSelector({ children }: { children: { id: string; name: string }[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (children.length <= 1) return null;

  const selectedId = searchParams.get("child") ?? children[0].id;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-3 sm:px-6">
      <span className="text-sm text-foreground/50">الابن:</span>
      {children.map((c) => (
        <Link
          key={c.id}
          href={`${pathname}?child=${c.id}`}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            c.id === selectedId ? "bg-brand text-white" : "border border-border text-foreground/70"
          }`}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}

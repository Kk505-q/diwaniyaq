"use client";

import { useState } from "react";
import { EditPermToggle } from "@/components/admin/EditPermToggle";
import { DeleteAliasButton } from "@/components/admin/DeleteAliasButton";
import { AliasToggle } from "@/components/AliasToggle";

type Student = {
  id: string;
  name: string;
  alias: string | null;
  aliasDisabled: boolean;
  canEditAlias: boolean;
  canEditName: boolean;
};

export function StudentNameList({ students }: { students: Student[] }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const filtered = term
    ? students.filter(
        (s) => s.name.toLowerCase().includes(term) || (s.alias ?? "").toLowerCase().includes(term)
      )
    : students;

  return (
    <div className="space-y-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحث باسم الطالب الحقيقي أو المستعار..."
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />

      <div className="space-y-2">
        {filtered.map((s) => (
          <div key={s.id} className="space-y-2 rounded-lg border border-border bg-surface p-3">
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="font-medium">{s.name}</span>
              <span className="text-foreground/30">←</span>
              {s.alias ? (
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                  {s.alias}
                  {s.aliasDisabled && <span className="font-normal text-danger"> (مخفي)</span>}
                </span>
              ) : (
                <span className="text-xs text-foreground/30">لا يوجد اسم مستعار</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-foreground/50">تعديل الاسم المستعار:</span>
              <EditPermToggle field="alias" scope={s.id} value={s.canEditAlias} />
              <span className="text-xs text-foreground/50">تعديل الاسم الحقيقي:</span>
              <EditPermToggle field="name" scope={s.id} value={s.canEditName} />
              <AliasToggle studentId={s.id} disabled={s.aliasDisabled} alias={s.alias} />
              <DeleteAliasButton studentId={s.id} alias={s.alias} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-foreground/50">
            {students.length === 0 ? "لا يوجد طلاب بعد" : "لا توجد نتائج مطابقة للبحث"}
          </p>
        )}
      </div>
    </div>
  );
}

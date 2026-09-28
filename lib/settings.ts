import { prisma } from "@/lib/db";

const SINGLETON = "singleton";

export type AppSettings = { allowAllEditAlias: boolean; allowAllEditName: boolean };

export async function getSettings(): Promise<AppSettings> {
  const s = await prisma.settings.findUnique({ where: { id: SINGLETON } });
  return {
    allowAllEditAlias: s?.allowAllEditAlias ?? false,
    allowAllEditName: s?.allowAllEditName ?? false,
  };
}

// Effective permission for a student to edit their own alias / real name:
// open when a supervisor/admin has opened it globally OR for that student.
export function canEditAlias(settings: AppSettings, user: { role: string; canEditAlias: boolean }): boolean {
  if (user.role !== "STUDENT") return true; // staff edit their own freely
  return settings.allowAllEditAlias || user.canEditAlias;
}

export function canEditName(settings: AppSettings, user: { role: string; canEditName: boolean }): boolean {
  if (user.role !== "STUDENT") return true;
  return settings.allowAllEditName || user.canEditName;
}

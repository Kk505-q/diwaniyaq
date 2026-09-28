import { prisma } from "@/lib/db";
import { dailyPeriodKey, weeklyPeriodKey } from "@/lib/dates";
import type { CompletionStatus } from "@prisma/client";

export type Streaks = { daily: number; weekly: number };

const LOOKBACK_DAYS = 400;
const LOOKBACK_WEEKS = 104;
// A task counts as "done" once submitted (whether awaiting review or approved).
const DONE_STATUSES: CompletionStatus[] = ["APPROVED", "PENDING_REVIEW"];

// Ordered period keys, newest first: index 0 = current period.
function lastDailyKeys(n: number): string[] {
  const keys: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    keys.push(dailyPeriodKey(d));
    d.setDate(d.getDate() - 1);
  }
  return keys;
}

function lastWeeklyKeys(n: number): string[] {
  const keys: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    keys.push(weeklyPeriodKey(d));
    d.setDate(d.getDate() - 7);
  }
  return keys;
}

// Count consecutive achieved periods. The current period (index 0) is given a
// grace: if it isn't achieved yet (the day/week isn't over), we start counting
// from the previous period so the streak doesn't reset mid-period.
function streakFrom(orderedKeys: string[], achieved: (key: string) => boolean): number {
  let i = achieved(orderedKeys[0]) ? 0 : 1;
  let count = 0;
  for (; i < orderedKeys.length; i++) {
    if (achieved(orderedKeys[i])) count++;
    else break;
  }
  return count;
}

type Row = { studentId: string; taskId: string; periodKey: string };

function buildIndex(rows: Row[]): Map<string, Map<string, Set<string>>> {
  const byStudent = new Map<string, Map<string, Set<string>>>();
  for (const r of rows) {
    let byKey = byStudent.get(r.studentId);
    if (!byKey) byStudent.set(r.studentId, (byKey = new Map()));
    let set = byKey.get(r.periodKey);
    if (!set) byKey.set(r.periodKey, (set = new Set()));
    set.add(r.taskId);
  }
  return byStudent;
}

// A day/week counts toward the streak only when ALL active tasks of that
// frequency were completed (status approved or awaiting review).
export async function computeStreaksForStudents(studentIds: string[]): Promise<Map<string, Streaks>> {
  const result = new Map<string, Streaks>();
  if (studentIds.length === 0) return result;

  const tasks = await prisma.habitTask.findMany({
    where: { active: true },
    select: { id: true, frequency: true },
  });
  const dailyTaskIds = tasks.filter((t) => t.frequency === "DAILY").map((t) => t.id);
  const weeklyTaskIds = tasks.filter((t) => t.frequency === "WEEKLY").map((t) => t.id);

  const dailyKeys = lastDailyKeys(LOOKBACK_DAYS);
  const weeklyKeys = lastWeeklyKeys(LOOKBACK_WEEKS);

  const [dailyRows, weeklyRows] = await Promise.all([
    dailyTaskIds.length > 0
      ? prisma.taskCompletion.findMany({
          where: {
            studentId: { in: studentIds },
            taskId: { in: dailyTaskIds },
            status: { in: DONE_STATUSES },
            periodKey: { in: dailyKeys },
          },
          select: { studentId: true, taskId: true, periodKey: true },
        })
      : Promise.resolve([] as Row[]),
    weeklyTaskIds.length > 0
      ? prisma.taskCompletion.findMany({
          where: {
            studentId: { in: studentIds },
            taskId: { in: weeklyTaskIds },
            status: { in: DONE_STATUSES },
            periodKey: { in: weeklyKeys },
          },
          select: { studentId: true, taskId: true, periodKey: true },
        })
      : Promise.resolve([] as Row[]),
  ]);

  const dailyIndex = buildIndex(dailyRows);
  const weeklyIndex = buildIndex(weeklyRows);

  for (const sid of studentIds) {
    const dailyByKey = dailyIndex.get(sid);
    const weeklyByKey = weeklyIndex.get(sid);

    const daily =
      dailyTaskIds.length === 0
        ? 0
        : streakFrom(dailyKeys, (k) => {
            const set = dailyByKey?.get(k);
            return !!set && dailyTaskIds.every((id) => set.has(id));
          });

    const weekly =
      weeklyTaskIds.length === 0
        ? 0
        : streakFrom(weeklyKeys, (k) => {
            const set = weeklyByKey?.get(k);
            return !!set && weeklyTaskIds.every((id) => set.has(id));
          });

    result.set(sid, { daily, weekly });
  }

  return result;
}

export async function computeStreaks(studentId: string): Promise<Streaks> {
  const m = await computeStreaksForStudents([studentId]);
  return m.get(studentId) ?? { daily: 0, weekly: 0 };
}

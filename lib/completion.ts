import { prisma } from "@/lib/db";
import { currentWeekDailyKeys, weeklyPeriodKey } from "@/lib/dates";

export type WeeklyCompletion = { achieved: number; max: number; percent: number };

// Weekly completion for a student: points earned this week from approved task
// completions, divided by the total points achievable in a full week.
// Daily tasks count 7 times a week, weekly tasks once.
export async function weeklyCompletion(studentId: string): Promise<WeeklyCompletion> {
  const tasks = await prisma.habitTask.findMany({ where: { active: true } });
  const dailyKeys = currentWeekDailyKeys();
  const weekKey = weeklyPeriodKey();

  let max = 0;
  for (const t of tasks) {
    max += t.frequency === "DAILY" ? t.points * 7 : t.points;
  }

  const completions = await prisma.taskCompletion.findMany({
    where: {
      studentId,
      status: "APPROVED",
      OR: [
        { task: { is: { frequency: "DAILY" } }, periodKey: { in: dailyKeys } },
        { task: { is: { frequency: "WEEKLY" } }, periodKey: weekKey },
      ],
    },
    include: { task: true },
  });

  let achieved = 0;
  for (const c of completions) achieved += c.task.points;

  const percent = max > 0 ? Math.min(100, Math.round((achieved / max) * 100)) : 0;
  return { achieved, max, percent };
}

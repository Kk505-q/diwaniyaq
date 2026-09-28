import { prisma } from "@/lib/db";
import { periodKeyFor } from "@/lib/dates";

export type TaskProgress = { total: number; remaining: number; done: number; percent: number };

// A student's completion for the current periods (daily tasks for today,
// weekly tasks for this week). A task counts as done once a completion exists.
export async function taskProgress(studentId: string): Promise<TaskProgress> {
  const tasks = await prisma.habitTask.findMany({ where: { active: true }, select: { id: true, frequency: true } });
  if (tasks.length === 0) return { total: 0, remaining: 0, done: 0, percent: 0 };

  const keys = tasks.map((t) => periodKeyFor(t.frequency));
  const completions = await prisma.taskCompletion.count({
    where: {
      studentId,
      OR: tasks.map((t, i) => ({ taskId: t.id, periodKey: keys[i] })),
    },
  });

  const total = tasks.length;
  const done = Math.min(completions, total);
  const remaining = total - done;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, remaining, done, percent };
}

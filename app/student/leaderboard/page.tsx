import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { Leaderboard } from "@/components/Leaderboard";
import { CompletionBar } from "@/components/CompletionBadge";
import { weeklyCompletion } from "@/lib/completion";
import { publicName } from "@/lib/display";
import { computeStreaksForStudents } from "@/lib/streaks";
import { flushDuePoints } from "@/lib/points";

export default async function StudentLeaderboardPage() {
  const user = await requireRole("STUDENT");
  await flushDuePoints();
  const raw = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { points: "desc" },
    select: { id: true, name: true, alias: true, aliasDisabled: true, points: true },
  });
  const streaks = await computeStreaksForStudents(raw.map((s) => s.id));
  const students = raw.map((s) => ({
    id: s.id,
    name: publicName(s),
    points: s.points,
    dailyStreak: streaks.get(s.id)?.daily ?? 0,
    weeklyStreak: streaks.get(s.id)?.weekly ?? 0,
  }));
  const rank = students.findIndex((s) => s.id === user.id) + 1;
  const weekly = await weeklyCompletion(user.id);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gradient-to-l from-brand to-brand-dark p-6 text-white">
        <div className="text-sm opacity-80">ترتيبك الحالي</div>
        <div className="mt-1 text-3xl font-bold">#{rank}</div>
        <div className="mt-2 text-sm opacity-90">{user.points} نقطة</div>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <CompletionBar percent={weekly.percent} />
        <p className="mt-2 text-xs text-foreground/50">
          كسبت {weekly.achieved} من أصل {weekly.max} نقطة ممكنة هذا الأسبوع.
        </p>
      </div>
      <h2 className="text-lg font-bold">ترتيب الطلاب</h2>
      <Leaderboard students={students} highlightId={user.id} />
    </div>
  );
}

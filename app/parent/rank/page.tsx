import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { getParentChildren } from "@/lib/parent";
import { Leaderboard } from "@/components/Leaderboard";
import { CompletionBar } from "@/components/CompletionBadge";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { weeklyCompletion } from "@/lib/completion";
import { publicName } from "@/lib/display";
import { computeStreaksForStudents } from "@/lib/streaks";
import { flushDuePoints } from "@/lib/points";

export default async function ParentRankPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const user = await requireRole("PARENT");
  await flushDuePoints();
  const kids = await getParentChildren(user.id);

  if (kids.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-foreground/60">
        لم يتم ربط أي طالب بحسابك بعد. الرجاء التواصل مع الإدارة.
      </div>
    );
  }

  const { child } = await searchParams;
  const selected = kids.find((k) => k.id === child) ?? kids[0];

  const raw = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { points: "desc" },
    select: { id: true, name: true, alias: true, aliasDisabled: true, points: true },
  });
  // The parent's own children keep their real name shown beside the alias.
  const ownChildren = new Map(kids.map((k) => [k.id, k.name]));
  const streaks = await computeStreaksForStudents(raw.map((s) => s.id));
  const students = raw.map((s) => ({
    id: s.id,
    name: publicName(s),
    points: s.points,
    subLabel: ownChildren.get(s.id),
    dailyStreak: streaks.get(s.id)?.daily ?? 0,
    weeklyStreak: streaks.get(s.id)?.weekly ?? 0,
  }));
  const rank = raw.findIndex((s) => s.id === selected.id) + 1;
  const weekly = await weeklyCompletion(selected.id);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gradient-to-l from-brand to-brand-dark p-6 text-white">
        <div className="text-sm opacity-80">ترتيب {selected.name}</div>
        <div className="mt-1 text-3xl font-bold">#{rank}</div>
        <div className="mt-2 text-sm opacity-90">{selected.points} نقطة</div>
      </div>
      <SubscriptionBadge status={selected.subscription} />
      <div className="rounded-xl border border-border bg-surface p-4">
        <CompletionBar percent={weekly.percent} />
        <p className="mt-2 text-xs text-foreground/50">
          أنجز {selected.name} {weekly.achieved} من أصل {weekly.max} نقطة ممكنة هذا الأسبوع.
        </p>
      </div>
      <h2 className="text-lg font-bold">ترتيب الطلاب</h2>
      <Leaderboard students={students} highlightId={selected.id} />
    </div>
  );
}

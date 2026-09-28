import { requireRole } from "@/lib/guard";
import { AppHeader } from "@/components/AppHeader";
import { NavTabs } from "@/components/NavTabs";
import { LogoBackground } from "@/components/LogoBackground";
import { getUnreadMessageCount } from "@/lib/actions/messages";
import { computeStreaks } from "@/lib/streaks";
import { flushDuePoints } from "@/lib/points";

const items = [
  { href: "/student/tasks", label: "المهام غير المنجزة" },
  { href: "/student/completed", label: "المهام المنجزة" },
  { href: "/student/leaderboard", label: "النقاط والترتيب" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await flushDuePoints();
  const user = await requireRole("STUDENT");
  const unread = await getUnreadMessageCount();
  const streaks = await computeStreaks(user.id);
  return (
    <div className="relative min-h-screen bg-background">
      <LogoBackground />
      <div className="relative z-10">
        <AppHeader
          id={user.id}
          name={user.name}
          role={user.role}
          points={user.points}
          items={items}
          unreadMessages={unread}
          dailyStreak={streaks.daily}
          weeklyStreak={streaks.weekly}
        />
        <NavTabs items={items} />
        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

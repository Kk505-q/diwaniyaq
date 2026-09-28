import { requireRole } from "@/lib/guard";
import { AppHeader } from "@/components/AppHeader";
import { NavTabs } from "@/components/NavTabs";
import { LogoBackground } from "@/components/LogoBackground";
import { getUnreadMessageCount } from "@/lib/actions/messages";

const items = [
  { href: "/supervisor/progress", label: "متابعة الطلاب" },
  { href: "/supervisor/review", label: "مراجعة الإثباتات" },
  { href: "/supervisor/tasks", label: "إدارة المهام والنقاط" },
  { href: "/supervisor/notifications", label: "الإشعارات" },
];

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("SUPERVISOR");
  const unread = await getUnreadMessageCount();
  return (
    <div className="relative min-h-screen bg-background">
      <LogoBackground />
      <div className="relative z-10">
        <AppHeader id={user.id} name={user.name} role={user.role} items={items} unreadMessages={unread} />
        <NavTabs items={items} />
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

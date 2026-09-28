import { requireRole } from "@/lib/guard";
import { AppHeader } from "@/components/AppHeader";
import { NavTabs } from "@/components/NavTabs";
import { LogoBackground } from "@/components/LogoBackground";
import { getUnreadMessageCount } from "@/lib/actions/messages";

const items = [
  { href: "/admin", label: "القبول والصلاحيات" },
  { href: "/admin/tasks", label: "إدارة المهام" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN");
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

import { Suspense } from "react";
import { requireRole } from "@/lib/guard";
import { AppHeader } from "@/components/AppHeader";
import { NavTabs } from "@/components/NavTabs";
import { ChildSelector } from "@/components/parent/ChildSelector";
import { LogoBackground } from "@/components/LogoBackground";
import { getParentChildren } from "@/lib/parent";
import { getUnreadMessageCount } from "@/lib/actions/messages";

const items = [
  { href: "/parent/rank", label: "ترتيب الابن" },
  { href: "/parent/tasks", label: "مهام الابن المنجزة" },
];

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("PARENT");
  const kids = await getParentChildren(user.id);
  const unread = await getUnreadMessageCount();

  return (
    <div className="relative min-h-screen bg-background">
      <LogoBackground />
      <div className="relative z-10">
        <AppHeader id={user.id} name={user.name} role={user.role} items={items} unreadMessages={unread} />
        <NavTabs items={items} />
        <Suspense fallback={null}>
          <ChildSelector children={kids} />
        </Suspense>
        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

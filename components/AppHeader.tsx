import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { NotificationBell } from "@/components/NotificationBell";
import { SideMenu } from "@/components/SideMenu";
import { Avatar } from "@/components/Avatar";
import { StreakBadges } from "@/components/StreakBadges";
import { ROLE_LABELS } from "@/lib/roles";
import type { NavItem } from "@/components/NavTabs";

export function AppHeader({
  id,
  name,
  role,
  points,
  items = [],
  unreadMessages = 0,
  dailyStreak = 0,
  weeklyStreak = 0,
}: {
  id: string;
  name: string;
  role: string;
  points?: number;
  items?: NavItem[];
  unreadMessages?: number;
  dailyStreak?: number;
  weeklyStreak?: number;
}) {
  const base = `/${role.toLowerCase()}`;

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <SideMenu
          items={items}
          messagesHref={`${base}/messages`}
          accountHref={`${base}/account`}
          chatHref={`${base}/chat`}
          unread={unreadMessages}
        />
        <Logo size={40} />
      </div>
      <div className="flex items-center gap-3">
        <StreakBadges daily={dailyStreak} weekly={weeklyStreak} />
        {typeof points === "number" && (
          <div className="hidden items-center gap-1 rounded-full bg-accent-gold/10 px-3 py-1 text-sm font-bold text-accent-gold sm:flex">
            <span>{points}</span>
            <span className="text-xs font-normal">نقطة</span>
          </div>
        )}
        <NotificationBell />
        <div className="hidden text-left sm:block">
          <div className="text-sm font-semibold">{name}</div>
          <div className="text-xs text-foreground/50">{ROLE_LABELS[role] ?? role}</div>
        </div>
        <Avatar userId={id} name={name} size={36} />
        <LogoutButton />
      </div>
    </header>
  );
}

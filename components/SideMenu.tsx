"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import type { NavItem } from "@/components/NavTabs";

export function SideMenu({
  items,
  messagesHref,
  accountHref,
  chatHref,
  unread,
}: {
  items: NavItem[];
  messagesHref: string;
  accountHref: string;
  chatHref?: string;
  unread: number;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Close the menu after navigating.
  useEffect(() => setOpen(false), [pathname]);

  const linkClass = (href: string) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      active ? "bg-brand/10 text-brand" : "text-foreground/80 hover:bg-background"
    }`;
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg border border-border p-2 text-foreground/70 hover:bg-background"
        aria-label="القائمة"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 max-w-[85vw] rounded-xl border border-border bg-surface p-2 shadow-lg">
          <div className="px-3 py-2 text-xs font-bold text-foreground/40">القائمة</div>
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}

          <div className="my-2 border-t border-border" />

          <Link href={messagesHref} className={linkClass(messagesHref)}>
            <span>الرسائل</span>
            {unread > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs text-white">
                {unread}
              </span>
            )}
          </Link>

          {chatHref && (
            <Link href={chatHref} className={linkClass(chatHref)}>
              الشات العام
            </Link>
          )}

          <Link href={accountHref} className={linkClass(accountHref)}>
            حسابي
          </Link>

          <div className="my-2 border-t border-border" />

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2.5 text-right text-sm font-medium text-danger hover:bg-background"
            >
              تسجيل الخروج
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

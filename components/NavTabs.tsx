"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; icon?: React.ReactNode };

export function NavTabs({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  // Pick the single most specific (longest) matching href so nested routes
  // like /admin/tasks don't also light up the /admin tab.
  const activeHref = items
    .filter((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-2 sm:px-4">
      {items.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              active
                ? "border-brand text-brand"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

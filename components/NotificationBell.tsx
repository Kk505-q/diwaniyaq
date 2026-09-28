"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getMyNotifications, markNotificationsRead } from "@/lib/actions/notifications";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const data = await getMyNotifications();
    setItems(data);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      await markNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={toggleOpen}
        className="relative rounded-lg border border-border p-2 text-foreground/70 hover:bg-background"
        aria-label="الإشعارات"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-2 w-80 max-w-[90vw] rounded-xl border border-border bg-surface shadow-lg">
          <div className="border-b border-border px-4 py-2 text-sm font-semibold">الإشعارات</div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-foreground/50">لا توجد إشعارات</div>
            )}
            {items.map((n) => (
              <div key={n.id} className="border-b border-border px-4 py-3 last:border-0">
                <div className="text-sm font-semibold">{n.title}</div>
                <div className="mt-1 text-sm text-foreground/70">{n.body}</div>
                <div className="mt-1 text-xs text-foreground/40">
                  {new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(
                    new Date(n.createdAt)
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

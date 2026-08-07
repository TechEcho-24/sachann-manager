"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getUnreadCount } from "@/actions/notification";
import { cn } from "@/lib/utils";

export function NotificationBell({ className }: { className?: string }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadCount() {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        console.error("Failed to load notifications count", err);
      }
    }

    loadCount();
    const interval = setInterval(loadCount, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/notifications"
      className={cn(
        "relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all duration-200 flex items-center justify-center cursor-pointer",
        className
      )}
      title="Notifications"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

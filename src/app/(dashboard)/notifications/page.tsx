"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  UserCheck,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  type SerializedNotification,
} from "@/actions/notification";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<SerializedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications({ page: 1, limit: 50 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  async function handleMarkAsRead(id: string) {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error("Failed to update notification");
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
      case "task_reassigned":
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      case "due_date_changed":
      case "task_due_soon":
      case "task_overdue":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "new_comment":
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case "status_changed":
      case "task_completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-brand-green" />;
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time task updates and assignment alerts
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={markingAll}
            onClick={handleMarkAll}
            className="rounded-xl h-9 text-xs gap-1.5"
          >
            {markingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-[75px] rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">No notifications yet</p>
          <p className="text-xs mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
              className={cn(
                "bg-card rounded-2xl border p-4 transition-all hover:shadow-sm flex items-start justify-between gap-3 cursor-pointer",
                !notif.isRead
                  ? "border-brand-green/30 bg-brand-green/[0.02]"
                  : "border-border opacity-75"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-muted/60 mt-0.5 shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs sm:text-sm text-foreground">
                      {notif.title}
                    </span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-green" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{notif.message}</p>
                  <p className="text-[10px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {notif.relatedTaskId && (
                <Link
                  href={`/tasks/${notif.relatedTaskId}`}
                  className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-brand-green hover:bg-brand-green/10 transition-colors"
                  title="View Task"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

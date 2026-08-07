"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { History, Activity } from "lucide-react";
import { getTaskActivity, type SerializedActivity } from "@/actions/task";

interface ActivityTimelineProps {
  taskId: string;
}

export function ActivityTimeline({ taskId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<SerializedActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const data = await getTaskActivity(taskId);
      setActivities(data);
    } catch (err) {
      console.error("Failed to load task activity", err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const formatActionMessage = (act: SerializedActivity) => {
    switch (act.action) {
      case "task_created":
        return `created the task`;
      case "task_edited":
        return `edited task title to "${act.newValue}"`;
      case "task_assigned":
      case "task_reassigned":
        return `reassigned task from ${act.previousValue || "none"} to ${act.newValue}`;
      case "due_date_changed":
        return `changed due date to ${act.newValue}`;
      case "priority_changed":
        return `changed priority from ${act.previousValue} to ${act.newValue}`;
      case "status_changed":
        return `updated status from "${act.previousValue}" to "${act.newValue}"`;
      case "comment_added":
        return `added a comment`;
      case "task_completed":
        return `marked task as completed`;
      case "task_deleted":
        return `deleted this task`;
      default:
        return `updated this task`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <History className="w-4 h-4 text-brand-green" />
        <span>Activity Log ({activities.length})</span>
      </div>

      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground">Loading activity...</div>
        ) : activities.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground bg-muted/40 rounded-xl border border-dashed border-border">
            No activity logged yet.
          </div>
        ) : (
          <div className="relative pl-4 border-l border-border space-y-4 my-2">
            {activities.map((act) => (
              <div key={act._id} className="relative text-xs">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-green border-2 border-background" />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-foreground">{act.performedBy?.name || "System"}</span>
                  <span className="text-muted-foreground">{formatActionMessage(act)}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

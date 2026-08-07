"use client";

import { useState } from "react";
import Link from "next/link";
import { format, isPast, isToday } from "date-fns";
import { Calendar, User, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { PriorityBadge } from "@/components/tasks/PriorityBadge";
import { cn } from "@/lib/utils";
import { updateTaskStatus, type SerializedTask } from "@/actions/task";
import { TASK_STATUSES, TASK_STATUS_LABELS, type TaskStatus } from "@/lib/constants";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TaskRowProps {
  task: SerializedTask;
  onStatusChange?: () => void;
}

export function TaskRow({ task, onStatusChange }: TaskRowProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task.status);

  const dueDate = new Date(task.dueDate);
  const isOverdue = !["done", "cancelled"].includes(currentStatus) && isPast(dueDate) && !isToday(dueDate);
  const isDueToday = !["done", "cancelled"].includes(currentStatus) && isToday(dueDate);
  const isCompleted = currentStatus === "done";

  const handleStatusSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    setUpdating(true);
    try {
      const res = await updateTaskStatus(task._id, newStatus);
      if (res.error) {
        toast.error(res.error);
        // revert
        e.target.value = currentStatus;
      } else {
        setCurrentStatus(newStatus);
        toast.success(`Task status updated to "${TASK_STATUS_LABELS[newStatus]}"`);
        if (onStatusChange) {
          onStatusChange();
        } else {
          router.refresh();
        }
      }
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className={cn(
        "group flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card hover:bg-muted/10 p-4 rounded-xl border border-border transition-all duration-200 shadow-sm",
        isOverdue && "border-rose-500/20 bg-rose-500/[0.01]",
        isCompleted && "bg-emerald-500/[0.01]"
      )}
    >
      {/* Left side: Checkbox + Title / Desc */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-1 flex-shrink-0">
          {updating ? (
            <Loader2 className="w-5 h-5 text-brand-green animate-spin" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <Link
            href={`/tasks/${task._id}`}
            className={cn(
              "font-semibold text-sm sm:text-base text-foreground hover:text-brand-green transition-colors block line-clamp-1",
              isCompleted && "line-through text-muted-foreground font-normal"
            )}
          >
            {task.title}
          </Link>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Right side: Meta options & dropdown */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-between md:justify-end">
        {/* Priority */}
        <PriorityBadge priority={task.priority} />

        {/* Due Date */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-lg">
          <Calendar className={cn("w-3.5 h-3.5", isOverdue ? "text-rose-500" : isDueToday ? "text-amber-500" : "")} />
          <span className={cn(isOverdue ? "text-rose-500 font-semibold" : isDueToday ? "text-amber-500 font-semibold" : "")}>
            {format(dueDate, "dd MMM yyyy")}
            {isOverdue && " (Overdue)"}
            {isDueToday && " (Today)"}
          </span>
        </div>

        {/* Assignee info */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-5 h-5 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-[10px]">
            {task.assignedTo?.name?.charAt(0) || "U"}
          </div>
          <span className="max-w-[100px] truncate" title={task.assignedTo?.name}>
            {task.assignedTo?.name || "Unassigned"}
          </span>
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={currentStatus}
            disabled={updating}
            onChange={handleStatusSelect}
            className={cn(
              "h-8 px-2 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green/20 cursor-pointer bg-background transition-colors",
              isCompleted && "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400",
              currentStatus === "todo" && "border-slate-300 text-slate-700 dark:text-slate-300",
              currentStatus === "in_progress" && "border-blue-300 text-blue-700 dark:text-blue-400",
              currentStatus === "in_review" && "border-amber-300 text-amber-700 dark:text-amber-400",
              currentStatus === "blocked" && "border-rose-300 text-rose-700 dark:text-rose-400",
              currentStatus === "cancelled" && "border-slate-200 text-slate-400 line-through"
            )}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {/* View arrow */}
        <Link href={`/tasks/${task._id}`} className="text-muted-foreground hover:text-foreground hidden sm:block">
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

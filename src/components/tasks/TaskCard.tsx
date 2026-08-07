"use client";

import Link from "next/link";
import { format, isPast, isToday } from "date-fns";
import { Calendar, User, MessageSquare, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/tasks/StatusBadge";
import { PriorityBadge } from "@/components/tasks/PriorityBadge";
import { cn } from "@/lib/utils";
import type { SerializedTask } from "@/actions/task";

interface TaskCardProps {
  task: SerializedTask;
  isEmployeeView?: boolean;
}

export function TaskCard({ task, isEmployeeView = false }: TaskCardProps) {
  const dueDate = new Date(task.dueDate);
  const isOverdue = !["done", "cancelled"].includes(task.status) && isPast(dueDate) && !isToday(dueDate);
  const isDueToday = !["done", "cancelled"].includes(task.status) && isToday(dueDate);

  return (
    <Link
      href={`/tasks/${task._id}`}
      className={cn(
        "block bg-card rounded-2xl border border-border p-4 transition-all duration-200 hover:border-brand-green/40 hover:shadow-md",
        isOverdue && "border-rose-500/30 bg-rose-500/[0.02]"
      )}
    >
      <div className="flex flex-col gap-3">
        {/* Top badges & status */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className={cn("w-3.5 h-3.5", isOverdue ? "text-rose-500" : isDueToday ? "text-amber-500" : "")} />
            <span className={cn(isOverdue ? "text-rose-500 font-semibold" : isDueToday ? "text-amber-500 font-semibold" : "")}>
              {format(dueDate, "dd MMM yyyy")}
              {isOverdue && " (Overdue)"}
              {isDueToday && " (Today)"}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 hover:text-brand-green transition-colors">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        {/* Bottom meta: Assignee & assigned by */}
        <div className="flex items-center justify-between border-t border-border/50 pt-2.5 mt-0.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-[10px]">
              {task.assignedTo?.name?.charAt(0) || "U"}
            </div>
            <span className="truncate max-w-[140px]">
              {task.assignedTo?.name || "Unassigned"}
            </span>
          </div>

          <div className="text-[11px] text-muted-foreground">
            By {task.assignedBy?.name || "Admin"}
          </div>
        </div>
      </div>
    </Link>
  );
}

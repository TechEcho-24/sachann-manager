"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isPast, isToday } from "date-fns";
import {
  Calendar,
  User as UserIcon,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/tasks/StatusBadge";
import { PriorityBadge } from "@/components/tasks/PriorityBadge";
import { CommentSection } from "@/components/tasks/CommentSection";
import { ActivityTimeline } from "@/components/tasks/ActivityTimeline";
import { updateTask, deleteTask, type SerializedTask } from "@/actions/task";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskDetailClientProps {
  task: SerializedTask;
  canEdit: boolean;
  canDelete: boolean;
  isAssignee: boolean;
  userRole: string;
}

export function TaskDetailClient({
  task,
  canEdit,
  canDelete,
  isAssignee,
  userRole,
}: TaskDetailClientProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task.status);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const dueDate = new Date(task.dueDate);
  const isOverdue =
    !["done", "cancelled"].includes(currentStatus) &&
    isPast(dueDate) &&
    !isToday(dueDate);
  const isDueToday =
    !["done", "cancelled"].includes(currentStatus) && isToday(dueDate);

  async function handleStatusChange(newStatus: TaskStatus) {
    if (newStatus === currentStatus) return;
    setStatusUpdating(true);
    try {
      const formData = new FormData();
      formData.set("status", newStatus);
      const res = await updateTask(task._id, formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        setCurrentStatus(newStatus);
        toast.success(`Status updated to ${TASK_STATUS_LABELS[newStatus]}`);
        router.refresh();
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to delete the task "${task.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await deleteTask(task._id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Task deleted successfully");
        router.push("/tasks");
        router.refresh();
      }
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-card rounded-2xl border border-border p-5 lg:p-7 shadow-sm space-y-6">
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={currentStatus} />
              <PriorityBadge priority={task.priority} />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">
              {task.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <Link href={`/tasks/${task._id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-9 text-xs gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Task
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={handleDelete}
                className="rounded-xl h-9 text-xs gap-1.5 text-rose-600 hover:bg-rose-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-sm text-foreground whitespace-pre-wrap">
            {task.description}
          </div>
        )}

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/50 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center font-bold">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-muted-foreground text-[11px]">Assigned To</p>
              <p className="font-semibold text-foreground">
                {task.assignedTo?.name || "Unassigned"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-muted-foreground text-[11px]">Due Date</p>
              <p
                className={cn(
                  "font-semibold",
                  isOverdue
                    ? "text-rose-500"
                    : isDueToday
                    ? "text-amber-500"
                    : "text-foreground"
                )}
              >
                {format(dueDate, "dd MMMM yyyy")}
                {isOverdue && " (Overdue)"}
                {isDueToday && " (Today)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-muted-foreground text-[11px]">Created By</p>
              <p className="font-semibold text-foreground">
                {task.assignedBy?.name || "Admin"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Status Update Section (Interactive for everyone assigned or managers) */}
        <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">
              Update Status:
            </p>
            {statusUpdating && (
              <span className="text-[11px] text-brand-green flex items-center gap-1 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                Updating...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {TASK_STATUSES.map((s) => (
              <button
                key={s}
                disabled={statusUpdating}
                onClick={() => handleStatusChange(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  currentStatus === s
                    ? "border-brand-green bg-brand-green text-white shadow-sm font-semibold"
                    : "border-border bg-card text-muted-foreground hover:border-brand-green/40 hover:text-foreground"
                )}
              >
                {TASK_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Comments & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comments Box */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <CommentSection taskId={task._id} currentUserRole={userRole} />
        </div>

        {/* Activity Timeline Box */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <ActivityTimeline taskId={task._id} />
        </div>
      </div>
    </div>
  );
}

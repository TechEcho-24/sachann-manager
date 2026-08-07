import { TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS, type TaskPriority } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const colors = TASK_PRIORITY_COLORS[priority] || TASK_PRIORITY_COLORS.medium;
  const label = TASK_PRIORITY_LABELS[priority] || priority;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border",
        colors.bg,
        colors.text,
        colors.border,
        priority === "critical" && "animate-pulse",
        className
      )}
    >
      {label}
    </span>
  );
}

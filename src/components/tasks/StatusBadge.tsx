import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, type TaskStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors = TASK_STATUS_COLORS[status] || TASK_STATUS_COLORS.todo;
  const label = TASK_STATUS_LABELS[status] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border",
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {label}
    </span>
  );
}

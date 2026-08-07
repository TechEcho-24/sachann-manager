import { CheckCircle2, Clock, AlertCircle, PlayCircle, ListTodo, AlertTriangle } from "lucide-react";
import type { TaskStats } from "@/actions/task";
import { cn } from "@/lib/utils";

interface TaskSummaryCardsProps {
  stats: TaskStats;
  title?: string;
}

export function TaskSummaryCards({ stats, title = "Task Overview" }: TaskSummaryCardsProps) {
  const cards = [
    {
      label: "Total Tasks",
      value: stats.total,
      icon: ListTodo,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "To Do",
      value: stats.todo,
      icon: Clock,
      color: "text-slate-500",
      bg: "bg-slate-500/10",
      border: "border-slate-500/20",
    },
    {
      label: "In Progress",
      value: stats.in_progress,
      icon: PlayCircle,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Blocked",
      value: stats.blocked,
      icon: AlertCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    {
      label: "Completed",
      value: stats.done,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "text-rose-600",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
  ];

  return (
    <div className="space-y-3">
      {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className={cn(
              "bg-card p-4 rounded-2xl border transition-all hover:shadow-sm flex flex-col justify-between gap-2",
              c.border
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">{c.label}</span>
              <div className={cn("p-1.5 rounded-lg", c.bg)}>
                <c.icon className={cn("w-4 h-4", c.color)} />
              </div>
            </div>
            <div className={cn("text-2xl font-bold", c.color)}>
              {c.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

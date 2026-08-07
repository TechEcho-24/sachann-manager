// Expense categories and payers as standalone constants
// These are separated from the Mongoose models to avoid importing Mongoose in client components

export const EXPENSE_CATEGORIES = [
  "Raw Materials",
  "Packaging",
  "Transportation",
  "Marketing",
  "Salaries",
  "Utilities",
  "Rent",
  "Equipment",
  "Technical Infra",
  "Miscellaneous",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYERS = ["Mummy", "Papa", "Anuj", "Anurag"] as const;
export type Payer = (typeof PAYERS)[number];

export const SALES_PLATFORMS = [
  "Amazon",
  "Flipkart",
  "Blinkit",
  "Offline",
  "Own Website",
  "Other",
] as const;

export type SalePlatform = (typeof SALES_PLATFORMS)[number];

// Task statuses
export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "blocked",
  "in_review",
  "done",
  "cancelled",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  in_review: "In Review",
  done: "Done",
  cancelled: "Cancelled",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  todo: { bg: "bg-slate-500/10", text: "text-slate-600", border: "border-slate-500/20" },
  in_progress: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" },
  blocked: { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-500/20" },
  in_review: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20" },
  done: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
  cancelled: { bg: "bg-gray-500/10", text: "text-gray-500", border: "border-gray-500/20" },
};

// Task priorities
export const TASK_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-slate-500/10", text: "text-slate-600", border: "border-slate-500/20" },
  medium: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" },
  high: { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-500/20" },
  critical: { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-500/20" },
};

"use client";

import { formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BudgetProgressProps {
  budgetAmount: number;
  totalExpenses: number;
  usedPercent: number;
}

export function BudgetProgress({
  budgetAmount,
  totalExpenses,
  usedPercent,
}: BudgetProgressProps) {
  if (budgetAmount === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground text-sm">
        <p>No budget set for this month</p>
        <a
          href="/budget"
          className="text-brand-green hover:underline text-sm mt-1 inline-block"
        >
          Set a budget →
        </a>
      </div>
    );
  }

  const remaining = budgetAmount - totalExpenses;
  const isOverBudget = remaining < 0;
  const clampedPercent = Math.min(usedPercent, 100);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Spent</p>
          <p className="text-xl font-bold text-foreground">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Budget</p>
          <p className="text-xl font-bold text-foreground">
            {formatCurrency(budgetAmount)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Progress
          value={clampedPercent}
          className={cn(
            "h-3 rounded-full",
            isOverBudget && "[&>div]:bg-red-500"
          )}
        />
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-xs font-medium",
              isOverBudget ? "text-red-500" : usedPercent > 80 ? "text-amber-600" : "text-brand-success"
            )}
          >
            {usedPercent.toFixed(0)}% used
          </span>
          <span
            className={cn(
              "text-xs font-medium",
              isOverBudget ? "text-red-500" : "text-muted-foreground"
            )}
          >
            {isOverBudget
              ? `${formatCurrency(Math.abs(remaining))} over`
              : `${formatCurrency(remaining)} left`}
          </span>
        </div>
      </div>
    </div>
  );
}

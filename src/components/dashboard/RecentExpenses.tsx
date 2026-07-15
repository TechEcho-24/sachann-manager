"use client";

import Link from "next/link";
import { formatCurrency, formatDate, CATEGORY_COLORS, PAYER_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import type { RecentExpense } from "@/actions/dashboard";

interface RecentExpensesProps {
  expenses: RecentExpense[];
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  if (expenses.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        <p>No expenses recorded yet</p>
        <Link
          href="/expenses/new"
          className="text-brand-green hover:underline text-sm mt-1 inline-block"
        >
          Add your first expense →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {expenses.map((expense) => {
        const catColors = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Miscellaneous;
        const payerColors = PAYER_COLORS[expense.paidBy] || { bg: "bg-muted", text: "text-muted-foreground" };

        return (
          <Link
            key={expense._id}
            href={`/expenses/${expense._id}`}
            className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/60 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  catColors.dot
                )}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {expense.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(expense.date)}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded",
                      payerColors.bg,
                      payerColors.text
                    )}
                  >
                    {expense.paidBy}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(expense.amount)}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        );
      })}

      <Link
        href="/expenses"
        className="flex items-center justify-center gap-1 py-2 text-xs font-medium text-brand-green hover:text-brand-green-light transition-colors"
      >
        View all expenses
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

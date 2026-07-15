"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IndianRupee,
  Receipt,
  TrendingUp,
  Target,
} from "lucide-react";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { PaidByChart } from "@/components/dashboard/PaidByChart";
import { RecentExpenses } from "@/components/dashboard/RecentExpenses";
import { BudgetProgress } from "@/components/dashboard/BudgetProgress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getDashboardData,
  getCategoryBreakdown,
  getPaidByBreakdown,
  getDailyExpenses,
  getRecentExpenses,
  type DashboardSummary,
  type CategoryBreakdown,
  type PaidByBreakdown,
  type DailyExpense,
  type RecentExpense,
} from "@/actions/dashboard";

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [paidBy, setPaidBy] = useState<PaidByBreakdown[]>([]);
  const [daily, setDaily] = useState<DailyExpense[]>([]);
  const [recent, setRecent] = useState<RecentExpense[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, catData, paidByData, dailyData, recentData] =
        await Promise.all([
          getDashboardData(month, year),
          getCategoryBreakdown(month, year),
          getPaidByBreakdown(month, year),
          getDailyExpenses(month, year),
          getRecentExpenses(5),
        ]);
      setSummary(summaryData);
      setCategories(catData);
      setPaidBy(paidByData);
      setDaily(dailyData);
      setRecent(recentData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleMonthChange(newMonth: number, newYear: number) {
    setMonth(newMonth);
    setYear(newYear);
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overview of your expenses
          </p>
        </div>
        <MonthSelector
          month={month}
          year={year}
          onChange={handleMonthChange}
        />
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-2xl" />
          ))}
        </div>
      ) : (
        summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            <SummaryCard
              title="Total Expenses"
              value={summary.totalExpenses}
              icon={IndianRupee}
              change={summary.percentChange}
              accentColor="green"
            />
            <SummaryCard
              title="Transactions"
              value={summary.transactionCount}
              icon={Receipt}
              isCurrency={false}
              accentColor="terracotta"
            />
            <SummaryCard
              title="Avg per Day"
              value={summary.averagePerDay}
              icon={TrendingUp}
              accentColor="mustard"
            />
            <SummaryCard
              title="Budget Left"
              value={Math.max(summary.budgetRemaining, 0)}
              icon={Target}
              accentColor={
                summary.budgetRemaining < 0
                  ? "terracotta"
                  : summary.budgetUsedPercent > 80
                  ? "mustard"
                  : "green"
              }
            />
          </div>
        )
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Daily Trend Chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Daily Spending Trend
          </h3>
          {loading ? (
            <Skeleton className="h-[240px] rounded-xl" />
          ) : (
            <TrendChart data={daily} />
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            By Category
          </h3>
          {loading ? (
            <Skeleton className="h-[260px] rounded-xl" />
          ) : (
            <CategoryChart data={categories} />
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Expenses */}
        <div className="lg:col-span-1 bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Recent Expenses
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : (
            <RecentExpenses expenses={recent} />
          )}
        </div>

        {/* Paid By Chart */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            By Payer
          </h3>
          {loading ? (
            <Skeleton className="h-[200px] rounded-xl" />
          ) : (
            <PaidByChart data={paidBy} />
          )}
        </div>

        {/* Budget Progress */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Budget Progress
          </h3>
          {loading ? (
            <Skeleton className="h-[120px] rounded-xl" />
          ) : summary ? (
            <BudgetProgress
              budgetAmount={summary.budgetAmount}
              totalExpenses={summary.totalExpenses}
              usedPercent={summary.budgetUsedPercent}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

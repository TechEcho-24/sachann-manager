"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  IndianRupee,
  Receipt,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
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
  getLifetimeStats,
  type DashboardSummary,
  type CategoryBreakdown,
  type PaidByBreakdown,
  type DailyExpense,
  type RecentExpense,
  type LifetimeStats,
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
  const [lifetime, setLifetime] = useState<LifetimeStats | null>(null);

  const profitMessages = useMemo(() => [
    { title: "Awesome! You're in Profit! 🎉", desc: "Your sales are exceeding your expenses by <bold>. Keep up the amazing work!" },
    { title: "Great going! 🚀", desc: "You've made a net profit of <bold>. Consistency is the key to success!" },
    { title: "Look at you go! 🌟", desc: "You are ahead by <bold>. Your hard work is paying off brilliantly!" },
    { title: "Profit Mode: ON 💰", desc: "You've successfully secured <bold> in profit. Keep scaling up!" }
  ], []);

  const lossMessages = useMemo(() => [
    { title: "You're behind by <bold>", desc: "Every big business takes time to build. Focus on growing those sales, you can do it! 💪" },
    { title: "Current Gap: <bold>", desc: "Don't stress, investments are necessary for growth. Keep pushing forward! 🌱" },
    { title: "You're down by <bold>", desc: "Every setback is a setup for a comeback. You've got this! ✨" },
    { title: "Investment Phase 📈", desc: "You are currently behind by <bold>. Rome wasn't built in a day, keep building!" }
  ], []);

  const randomMsgIndex = useMemo(() => Math.floor(Math.random() * 4), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, catData, paidByData, dailyData, recentData, lifetimeData] =
        await Promise.all([
          getDashboardData(month, year),
          getCategoryBreakdown(month, year),
          getPaidByBreakdown(month, year),
          getDailyExpenses(month, year),
          getRecentExpenses(5),
          getLifetimeStats(),
        ]);
      setSummary(summaryData);
      setCategories(catData);
      setPaidBy(paidByData);
      setDaily(dailyData);
      setRecent(recentData);
      setLifetime(lifetimeData);
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

  function getGreeting() {
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return "Good Morning SachAnn Family";
    if (hour >= 12 && hour < 17) return "Good Afternoon SachAnn Family";
    if (hour >= 17 && hour < 22) return "Good Evening SachAnn Family";
    return "Good Night SachAnn Family";
  }

  const greeting = getGreeting();

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            {greeting}!
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

      {/* Lifetime Stats */}
      {!loading && lifetime && (
        <div className="mb-6 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-medium text-slate-300 mb-1">Total Lifetime Spend</h2>
              <div className="flex flex-col gap-4">
                <div className="text-3xl sm:text-4xl font-bold">
                  ₹{lifetime.totalExpenses.toLocaleString("en-IN")}
                </div>
                <div className="flex flex-wrap gap-3">
                  {lifetime.payerBreakdown.slice(0, 4).map((p) => (
                    <div key={p.payer} className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs sm:text-sm">
                      <span className="text-slate-300 mr-1.5">{p.payer}:</span>
                      <span className="font-semibold">₹{p.total.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sm:border-l sm:border-slate-700 sm:pl-6">
              <h2 className="text-sm font-medium text-slate-300 mb-1">Total Lifetime Sales</h2>
              <div className="text-3xl sm:text-4xl font-bold text-blue-400">
                ₹{lifetime.totalSales.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
          
          {/* Net Profit/Loss Message */}
          {(() => {
            const net = lifetime.totalSales - lifetime.totalExpenses;
            const formattedAmount = `₹${Math.abs(net).toLocaleString("en-IN")}`;
            
            if (net >= 0) {
              const msg = profitMessages[randomMsgIndex];
              const parts = msg.desc.split("<bold>");
              
              return (
                <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg flex-shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-emerald-300">
                      {msg.title.includes("<bold>") ? (
                        <>
                          {msg.title.split("<bold>")[0]}
                          {formattedAmount}
                          {msg.title.split("<bold>")[1]}
                        </>
                      ) : msg.title}
                    </h3>
                    <p className="text-xs sm:text-sm opacity-90 mt-0.5">
                      {parts[0]}<span className="font-bold">{formattedAmount}</span>{parts[1]}
                    </p>
                  </div>
                </div>
              );
            } else {
              const msg = lossMessages[randomMsgIndex];
              const parts = msg.desc.split("<bold>");
              
              return (
                <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
                  <div className="p-2 bg-rose-500/20 rounded-lg flex-shrink-0">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-rose-300">
                      {msg.title.includes("<bold>") ? (
                        <>
                          {msg.title.split("<bold>")[0]}
                          {formattedAmount}
                          {msg.title.split("<bold>")[1]}
                        </>
                      ) : msg.title}
                    </h3>
                    <p className="text-xs sm:text-sm opacity-90 mt-0.5">
                      {parts[0]}<span className="font-bold">{formattedAmount}</span>{parts[1]}
                    </p>
                  </div>
                </div>
              );
            }
          })()}
        </div>
      )}

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-2xl" />
          ))}
        </div>
      ) : (
        summary && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
            <SummaryCard
              title="Total Expenses"
              value={summary.totalExpenses}
              icon={IndianRupee}
              change={summary.percentChange}
              accentColor="green"
            />
            <SummaryCard
              title="Total Sales"
              value={summary.totalSales || 0}
              icon={TrendingUp}
              accentColor="blue"
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

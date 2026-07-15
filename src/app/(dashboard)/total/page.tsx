"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FileBarChart, TrendingUp, IndianRupee } from "lucide-react";
import { getLifetimeStats, type LifetimeStats } from "@/actions/dashboard";

export default function TotalSpendPage() {
  const [loading, setLoading] = useState(true);
  const [lifetime, setLifetime] = useState<LifetimeStats | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLifetimeStats();
      setLifetime(data);
    } catch (error) {
      console.error("Failed to fetch lifetime stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">
          Total Spend (All Time)
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of lifetime expenses by category and payer
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[400px] rounded-2xl" />
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
        </div>
      ) : lifetime ? (
        <div className="space-y-6">
          {/* Total Summary */}
          <div className="bg-gradient-to-r from-brand-green to-emerald-700 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-100 mb-1">
                Grand Total Spent
              </p>
              <h2 className="text-4xl font-bold">
                {formatCurrency(lifetime.totalExpenses)}
              </h2>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <IndianRupee className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown Table */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FileBarChart className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-base font-semibold text-foreground">
                  By Category
                </h3>
              </div>
              {lifetime.categoryBreakdown.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-medium text-muted-foreground py-2">
                          Category
                        </th>
                        <th className="text-right text-xs font-medium text-muted-foreground py-2">
                          Amount
                        </th>
                        <th className="text-right text-xs font-medium text-muted-foreground py-2">
                          Share
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lifetime.categoryBreakdown.map((item) => {
                        const percentage =
                          lifetime.totalExpenses > 0
                            ? (item.total / lifetime.totalExpenses) * 100
                            : 0;
                        return (
                          <tr
                            key={item.category}
                            className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3 text-sm font-medium text-foreground">
                              {item.category}
                            </td>
                            <td className="py-3 text-sm text-right font-semibold text-foreground">
                              {formatCurrency(item.total)}
                            </td>
                            <td className="py-3 text-sm text-right text-muted-foreground">
                              {percentage.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No expense data available
                </p>
              )}
            </div>

            {/* Payer Breakdown Table */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-base font-semibold text-foreground">
                  By Payer
                </h3>
              </div>
              {lifetime.payerBreakdown.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-medium text-muted-foreground py-2">
                          Paid By
                        </th>
                        <th className="text-right text-xs font-medium text-muted-foreground py-2">
                          Amount
                        </th>
                        <th className="text-right text-xs font-medium text-muted-foreground py-2">
                          Share
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lifetime.payerBreakdown.map((item) => {
                        const percentage =
                          lifetime.totalExpenses > 0
                            ? (item.total / lifetime.totalExpenses) * 100
                            : 0;
                        return (
                          <tr
                            key={item.payer}
                            className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3 text-sm font-medium text-foreground">
                              {item.payer}
                            </td>
                            <td className="py-3 text-sm text-right font-semibold text-foreground">
                              {formatCurrency(item.total)}
                            </td>
                            <td className="py-3 text-sm text-right text-muted-foreground">
                              {percentage.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No expense data available
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

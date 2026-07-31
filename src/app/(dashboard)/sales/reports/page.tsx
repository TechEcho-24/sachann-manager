"use client";

import { useState, useEffect, useCallback } from "react";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, FileBarChart, IndianRupee, Receipt, Star } from "lucide-react";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { SalesTrendChart } from "@/components/sales/SalesTrendChart";
import { PlatformChart } from "@/components/sales/PlatformChart";
import { getSalesReports, type SalesReport } from "@/actions/sale";

export default function SalesReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<SalesReport | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSalesReports(month, year);
      setReport(data);
    } catch (error) {
      console.error("Failed to fetch sales report:", error);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Sales Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monthly sales analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            <SummaryCard
              title="Total Sales"
              value={report.totalSales}
              icon={IndianRupee}
              change={report.percentChange}
              accentColor="blue"
            />
            <SummaryCard
              title="Transactions"
              value={report.transactionCount}
              icon={Receipt}
              isCurrency={false}
              accentColor="green"
            />
            <SummaryCard
              title="Avg Daily Sales"
              value={report.averagePerDay}
              icon={TrendingUp}
              accentColor="mustard"
            />
            <SummaryCard
              title="Top Platform"
              value={report.platformBreakdown[0]?.total || 0}
              icon={Star}
              changeLabel={report.platformBreakdown[0]?.platform || "N/A"}
              accentColor="terracotta"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Daily Trend Chart */}
            <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Daily Sales Trend
              </h3>
              <SalesTrendChart data={report.dailySales} />
            </div>

            {/* Platform Breakdown */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Platform Breakdown
              </h3>
              <PlatformChart data={report.platformBreakdown} />
            </div>
          </div>

          {/* Platform Breakdown Table */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileBarChart className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Platform Breakdown
              </h3>
            </div>
            {report.platformBreakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground py-2">
                        Platform
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground py-2">
                        Amount
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground py-2">
                        Transactions
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground py-2">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.platformBreakdown.map((item) => (
                      <tr
                        key={item.platform}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-2.5 text-sm font-medium text-foreground">
                          {item.platform}
                        </td>
                        <td className="py-2.5 text-sm text-right font-semibold text-foreground">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="py-2.5 text-sm text-right text-muted-foreground">
                          {item.count}
                        </td>
                        <td className="py-2.5 text-sm text-right text-muted-foreground">
                          {item.percentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No data for this month
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

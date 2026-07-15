"use client";

import { useState, useEffect, useCallback } from "react";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, FileBarChart } from "lucide-react";
import { getMonthlyReport, exportExpensesToCSV, type MonthlyReport } from "@/actions/reports";
import { toast } from "sonner";

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMonthlyReport(month, year);
      setReport(data);
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await exportExpensesToCSV(month, year);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sachann-expenses-${getMonthName(month)}-${year}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    } catch {
      toast.error("Failed to export CSV");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monthly expense analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting || loading}
            className="rounded-xl gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl border border-border p-5">
              <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(report.totalExpenses)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {report.transactionCount} transactions
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5">
              <p className="text-sm text-muted-foreground mb-1">
                Average Expense
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(report.averageExpense)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                per transaction
              </p>
            </div>
            {report.highestExpense && (
              <div className="bg-card rounded-2xl border border-border p-5">
                <p className="text-sm text-muted-foreground mb-1">
                  Highest Expense
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(report.highestExpense.amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {report.highestExpense.title}
                </p>
              </div>
            )}
          </div>

          {/* Category Breakdown Table */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileBarChart className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Category Breakdown
              </h3>
            </div>
            {report.categoryBreakdown.length > 0 ? (
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
                        Count
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground py-2">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.categoryBreakdown.map((item) => (
                      <tr
                        key={item.category}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-2.5 text-sm font-medium text-foreground">
                          {item.category}
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

          {/* Payer Breakdown Table */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Payer Breakdown
              </h3>
            </div>
            {report.payerBreakdown.length > 0 ? (
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
                        Count
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground py-2">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.payerBreakdown.map((item) => (
                      <tr
                        key={item.paidBy}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-2.5 text-sm font-medium text-foreground">
                          {item.paidBy}
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

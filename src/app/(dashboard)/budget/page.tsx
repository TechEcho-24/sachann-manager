"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getMonthName, getShortMonthName, cn } from "@/lib/utils";
import { getAllBudgets, setBudget, type SerializedBudget } from "@/actions/budget";
import { Loader2, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function BudgetPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<SerializedBudget[]>([]);
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllBudgets(year);
      setBudgets(data);
    } catch (error) {
      console.error("Failed to fetch budgets:", error);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  async function handleSave(month: number) {
    if (!editAmount) return;
    setSaving(true);

    const formData = new FormData();
    formData.set("month", month.toString());
    formData.set("year", year.toString());
    formData.set("amount", editAmount);

    try {
      const result = await setBudget(formData);
      if (result.error) {
        toast.error(result.error);
        setSaving(false);
        return;
      }
      toast.success(`Budget set for ${getMonthName(month)} ${year}`);
      setEditingMonth(null);
      setEditAmount("");
      fetchBudgets();
    } catch {
      toast.error("Failed to save budget");
    } finally {
      setSaving(false);
    }
  }

  function getBudgetForMonth(month: number): SerializedBudget | undefined {
    return budgets.find((b) => b.month === month);
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Budget
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Set and manage monthly budgets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYear(year - 1)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold min-w-[50px] text-center">
            {year}
          </span>
          <button
            onClick={() => setYear(year + 1)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Budget Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
            const budget = getBudgetForMonth(month);
            const isEditing = editingMonth === month;
            const isCurrentMonth =
              month === now.getMonth() + 1 && year === now.getFullYear();

            return (
              <div
                key={month}
                className={cn(
                  "bg-card rounded-2xl border p-4 transition-all",
                  isCurrentMonth
                    ? "border-brand-green/40 shadow-sm"
                    : "border-border"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isCurrentMonth ? "text-brand-green" : "text-foreground"
                    )}
                  >
                    {getShortMonthName(month)}
                  </span>
                  {isCurrentMonth && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-green/10 text-brand-green">
                      Current
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                        ₹
                      </span>
                      <Input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        placeholder="0"
                        className="h-9 text-sm rounded-lg pl-6"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => handleSave(month)}
                        disabled={saving || !editAmount}
                        className="h-7 text-xs rounded-lg flex-1 bg-brand-green hover:bg-brand-green-light text-white"
                      >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingMonth(null);
                          setEditAmount("");
                        }}
                        className="h-7 text-xs rounded-lg"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {budget ? (
                      <p className="text-lg font-bold text-foreground mb-2">
                        {formatCurrency(budget.amount)}
                      </p>
                    ) : (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Wallet className="w-4 h-4 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Not set</p>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setEditingMonth(month);
                        setEditAmount(budget?.amount.toString() || "");
                      }}
                      className="text-xs text-brand-green hover:underline"
                    >
                      {budget ? "Edit" : "Set budget"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

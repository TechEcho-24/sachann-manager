"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryBadge } from "@/components/expenses/CategoryBadge";
import { PayerBadge } from "@/components/expenses/PayerBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getExpenses, type PaginatedExpenses } from "@/actions/expense";
import { EXPENSE_CATEGORIES, PAYERS } from "@/lib/constants";

export default function ExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaginatedExpenses | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getExpenses({
        search: search || undefined,
        category: category || undefined,
        paidBy: paidBy || undefined,
        isArchived: showArchived,
        page,
        limit: 20,
      });
      setData(result);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setLoading(false);
    }
  }, [search, category, paidBy, showArchived, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchExpenses, 300);
    return () => clearTimeout(debounce);
  }, [fetchExpenses]);

  function clearFilters() {
    setSearch("");
    setCategory("");
    setPaidBy("");
    setShowArchived(false);
    setPage(1);
  }

  const hasActiveFilters = search || category || paidBy || showArchived;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Expenses
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `${data.total} expense${data.total !== 1 ? "s" : ""}` : "Loading..."}
          </p>
        </div>
        <Link href="/expenses/new">
          <Button className="h-10 rounded-xl bg-brand-green hover:bg-brand-green-light text-white gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
          </Button>
        </Link>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search expenses..."
            className="h-10 rounded-xl pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "h-10 w-10 rounded-xl flex-shrink-0",
            hasActiveFilters && "border-brand-green text-brand-green"
          )}
        >
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Filters</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-brand-green hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Category</p>
            <div className="flex flex-wrap gap-1.5">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(category === cat ? "" : cat);
                    setPage(1);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                    category === cat
                      ? "border-brand-green bg-brand-green text-white"
                      : "border-border text-muted-foreground hover:border-brand-green/40"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Paid By</p>
            <div className="flex flex-wrap gap-1.5">
              {PAYERS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPaidBy(paidBy === p ? "" : p);
                    setPage(1);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                    paidBy === p
                      ? "border-brand-green bg-brand-green text-white"
                      : "border-border text-muted-foreground hover:border-brand-green/40"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => {
                setShowArchived(e.target.checked);
                setPage(1);
              }}
              className="rounded accent-brand-green"
            />
            <span className="text-xs text-muted-foreground">
              Show archived expenses
            </span>
          </label>
        </div>
      )}

      {/* Active filter tags */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {category && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-green/10 text-brand-green text-xs font-medium">
              {category}
              <button onClick={() => setCategory("")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {paidBy && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-terracotta/10 text-brand-terracotta text-xs font-medium">
              {paidBy}
              <button onClick={() => setPaidBy("")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Expense List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : data && data.expenses.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                    Title
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                    Amount
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                    Category
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                    Paid By
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.expenses.map((expense) => (
                  <tr
                    key={expense._id}
                    className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/expenses/${expense._id}`}
                        className="text-sm font-medium text-foreground hover:text-brand-green transition-colors"
                      >
                        {expense.title}
                      </Link>
                      {expense.vendor && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {expense.vendor}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(expense.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <CategoryBadge category={expense.category} />
                    </td>
                    <td className="px-5 py-3.5">
                      <PayerBadge payer={expense.paidBy} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {formatDate(expense.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-2">
            {data.expenses.map((expense) => (
              <Link
                key={expense._id}
                href={`/expenses/${expense._id}`}
                className="block bg-card rounded-2xl border border-border p-4 card-hover"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {expense.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(expense.date)}
                      {expense.vendor && ` • ${expense.vendor}`}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-foreground ml-3">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CategoryBadge category={expense.category} />
                  <PayerBadge payer={expense.paidBy} />
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-xl"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                disabled={page === data.totalPages}
                className="rounded-xl"
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            {hasActiveFilters ? "No matching expenses" : "No expenses yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {hasActiveFilters
              ? "Try adjusting your search or filters"
              : "Start tracking your expenses by adding your first one"}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={clearFilters} className="rounded-xl">
              Clear filters
            </Button>
          ) : (
            <Link href="/expenses/new">
              <Button className="rounded-xl bg-brand-green hover:bg-brand-green-light text-white gap-2">
                <Plus className="w-4 h-4" />
                Add Expense
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

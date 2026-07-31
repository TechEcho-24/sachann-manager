"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getSales, type PaginatedSales } from "@/actions/sale";
import { SALES_PLATFORMS } from "@/lib/constants";

export default function SalesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaginatedSales | null>(null);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSales({
        search: search || undefined,
        platform: platform || undefined,
        isArchived: showArchived,
        page,
        limit: 20,
      });
      setData(result);
    } catch (error) {
      console.error("Failed to fetch sales:", error);
    } finally {
      setLoading(false);
    }
  }, [search, platform, showArchived, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchSales, 300);
    return () => clearTimeout(debounce);
  }, [fetchSales]);

  function clearFilters() {
    setSearch("");
    setPlatform("");
    setShowArchived(false);
    setPage(1);
  }

  const hasActiveFilters = search || platform || showArchived;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Sales
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `${data.total} sale${data.total !== 1 ? "s" : ""}` : "Loading..."}
          </p>
        </div>
        <Link href="/sales/new">
          <Button className="h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Sale</span>
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
            placeholder="Search sales..."
            className="h-10 rounded-xl pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "h-10 w-10 rounded-xl flex-shrink-0",
            hasActiveFilters && "border-blue-600 text-blue-600"
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
                className="text-xs text-blue-600 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Platform</p>
            <div className="flex flex-wrap gap-1.5">
              {SALES_PLATFORMS.map((plat) => (
                <button
                  key={plat}
                  onClick={() => {
                    setPlatform(platform === plat ? "" : plat);
                    setPage(1);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                    platform === plat
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-border text-muted-foreground hover:border-blue-600/40"
                  )}
                >
                  {plat}
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
              className="rounded accent-blue-600"
            />
            <span className="text-xs text-muted-foreground">
              Show archived sales
            </span>
          </label>
        </div>
      )}

      {/* Active filter tags */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {platform && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600/10 text-blue-600 text-xs font-medium">
              {platform}
              <button onClick={() => setPlatform("")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Sales List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : data && data.sales.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                    Amount
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                    Platform
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                    Date
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.sales.map((sale) => (
                  <tr
                    key={sale._id}
                    className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/sales/${sale._id}/edit`}
                        className="text-sm font-semibold text-foreground hover:text-blue-600 transition-colors"
                      >
                        {formatCurrency(sale.amount)}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium">
                      {sale.platform}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {formatDate(sale.date)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground max-w-[200px] truncate">
                      {sale.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-2">
            {data.sales.map((sale) => (
              <Link
                key={sale._id}
                href={`/sales/${sale._id}/edit`}
                className="block bg-card rounded-2xl border border-border p-4 card-hover"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {sale.platform}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(sale.date)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-foreground ml-3 text-blue-600">
                    {formatCurrency(sale.amount)}
                  </span>
                </div>
                {sale.notes && (
                  <p className="text-xs text-muted-foreground truncate">
                    {sale.notes}
                  </p>
                )}
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
            {hasActiveFilters ? "No matching sales" : "No sales yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {hasActiveFilters
              ? "Try adjusting your search or filters"
              : "Start tracking your sales by adding your first one"}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={clearFilters} className="rounded-xl">
              Clear filters
            </Button>
          ) : (
            <Link href="/sales/new">
              <Button className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white gap-2">
                <Plus className="w-4 h-4" />
                Add Sale
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

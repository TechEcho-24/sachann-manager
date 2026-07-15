"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { DailyExpense } from "@/actions/dashboard";

interface TrendChartProps {
  data: DailyExpense[];
}

export function TrendChart({ data }: TrendChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-[240px] w-full animate-pulse bg-muted rounded-xl" />;
  }

  if (data.every((d) => d.total === 0)) {
    return (
      <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
        No expense data for this month
      </div>
    );
  }

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1F4D3A" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#1F4D3A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) =>
              val >= 1000 ? `₹${(val / 1000).toFixed(0)}K` : `₹${val}`
            }
          />
          <Tooltip
            formatter={(value: any) => [formatCurrency(Number(value) || 0), "Total"]}
            labelFormatter={(label) => `Day ${label}`}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: "13px",
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#1F4D3A"
            strokeWidth={2}
            fill="url(#colorTotal)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

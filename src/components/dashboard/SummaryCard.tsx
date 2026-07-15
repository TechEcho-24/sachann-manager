"use client";

import { cn, formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  prefix?: string;
  isCurrency?: boolean;
  accentColor?: "green" | "terracotta" | "mustard" | "muted";
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel = "vs last month",
  isCurrency = true,
  accentColor = "green",
}: SummaryCardProps) {
  const accentStyles = {
    green: "bg-brand-green/8 text-brand-green",
    terracotta: "bg-brand-terracotta/8 text-brand-terracotta",
    mustard: "bg-brand-mustard/8 text-amber-700",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 card-hover">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <div
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-xl",
            accentStyles[accentColor]
          )}
        >
          <Icon className="w-[18px] h-[18px]" />
        </div>
      </div>

      <p className="text-2xl font-bold text-foreground tracking-tight">
        {isCurrency ? formatCurrency(value) : value.toLocaleString("en-IN")}
      </p>

      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          {change > 0 ? (
            <div className="flex items-center gap-0.5 text-red-500">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">
                +{Math.abs(change).toFixed(1)}%
              </span>
            </div>
          ) : change < 0 ? (
            <div className="flex items-center gap-0.5 text-brand-success">
              <TrendingDown className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">
                {Math.abs(change).toFixed(1)}%
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-0.5 text-muted-foreground">
              <Minus className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">0%</span>
            </div>
          )}
          <span className="text-xs text-muted-foreground">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}

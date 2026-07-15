"use client";

import { cn, PAYER_COLORS } from "@/lib/utils";

interface PayerBadgeProps {
  payer: string;
  size?: "sm" | "md";
}

export function PayerBadge({ payer, size = "sm" }: PayerBadgeProps) {
  const colors = PAYER_COLORS[payer] || { bg: "bg-muted", text: "text-muted-foreground" };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        colors.bg,
        colors.text,
        size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1"
      )}
    >
      {payer}
    </span>
  );
}

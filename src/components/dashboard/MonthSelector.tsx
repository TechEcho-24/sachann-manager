"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthName } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MonthSelectorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthSelector({ month, year, onChange }: MonthSelectorProps) {
  const [isCurrentMonth] = useState(() => {
    const now = new Date();
    return month === now.getMonth() + 1 && year === now.getFullYear();
  });

  function goToPrevMonth() {
    if (month === 1) {
      onChange(12, year - 1);
    } else {
      onChange(month - 1, year);
    }
  }

  function goToNextMonth() {
    if (month === 12) {
      onChange(1, year + 1);
    } else {
      onChange(month + 1, year);
    }
  }

  function goToCurrentMonth() {
    const now = new Date();
    onChange(now.getMonth() + 1, now.getFullYear());
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={goToPrevMonth}
        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="text-center min-w-[140px]">
        <span className="text-sm font-semibold text-foreground">
          {getMonthName(month)} {year}
        </span>
      </div>

      <button
        onClick={goToNextMonth}
        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {!isCurrentMonth && (
        <Button
          variant="outline"
          size="sm"
          onClick={goToCurrentMonth}
          className="ml-2 text-xs h-7 rounded-lg"
        >
          Today
        </Button>
      )}
    </div>
  );
}

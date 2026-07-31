"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SALES_PLATFORMS } from "@/lib/constants";
import { cn, formatDateForInput } from "@/lib/utils";
import { createSale, updateSale, type SerializedSale } from "@/actions/sale";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SaleFormProps {
  sale?: SerializedSale;
}

export function SaleForm({ sale }: SaleFormProps) {
  const router = useRouter();
  const isEditing = !!sale;

  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(sale?.platform || "");
  const [dateMode, setDateMode] = useState<"current" | "custom">(
    sale ? "custom" : "current"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Set date
    if (dateMode === "current") {
      formData.set("date", formatDateForInput(new Date()));
    }

    // Set platform
    formData.set("platform", selectedPlatform);

    try {
      const result = isEditing
        ? await updateSale(sale._id, formData)
        : await createSale(formData);

      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      toast.success(
        isEditing ? "Sale updated successfully" : "Sale added successfully"
      );
      router.push("/sales");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-sm font-medium">
          Amount <span className="text-red-400">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
            ₹
          </span>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={sale?.amount}
            placeholder="0.00"
            required
            className="h-11 rounded-xl pl-7"
          />
        </div>
      </div>

      {/* Platform */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Platform <span className="text-red-400">*</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {SALES_PLATFORMS.map((plat) => (
            <button
              key={plat}
              type="button"
              onClick={() => setSelectedPlatform(plat)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-150",
                selectedPlatform === plat
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-blue-600/40 hover:text-foreground"
              )}
            >
              {plat}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Date <span className="text-red-400">*</span>
        </Label>
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => setDateMode("current")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-medium border transition-all",
              dateMode === "current"
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-border bg-card text-muted-foreground hover:border-blue-600/40"
            )}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setDateMode("custom")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-medium border transition-all",
              dateMode === "custom"
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-border bg-card text-muted-foreground hover:border-blue-600/40"
            )}
          >
            Custom Date
          </button>
        </div>
        {dateMode === "custom" && (
          <Input
            name="date"
            type="date"
            defaultValue={
              sale
                ? formatDateForInput(new Date(sale.date))
                : formatDateForInput(new Date())
            }
            required
            className="h-11 rounded-xl"
          />
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">
          Notes (Optional)
        </Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={sale?.notes}
          placeholder="Any additional notes about this sale..."
          rows={3}
          className="rounded-xl resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={isLoading || !selectedPlatform}
          className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEditing ? "Updating..." : "Saving..."}
            </>
          ) : isEditing ? (
            "Update Sale"
          ) : (
            "Save Sale"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="h-11 rounded-xl"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

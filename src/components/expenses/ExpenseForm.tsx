"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReceiptUpload } from "@/components/expenses/ReceiptUpload";
import { EXPENSE_CATEGORIES, PAYERS } from "@/lib/constants";
import { cn, formatDateForInput } from "@/lib/utils";
import { createExpense, updateExpense, type SerializedExpense } from "@/actions/expense";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ExpenseFormProps {
  expense?: SerializedExpense;
}

export function ExpenseForm({ expense }: ExpenseFormProps) {
  const router = useRouter();
  const isEditing = !!expense;

  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(
    !!(expense?.vendor || expense?.invoiceNumber || expense?.description)
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [removeReceipt, setRemoveReceipt] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(expense?.category || "");
  const [selectedPayer, setSelectedPayer] = useState(expense?.paidBy || "");
  const [dateMode, setDateMode] = useState<"current" | "custom">(
    expense ? "custom" : "current"
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

    // Set category and paidBy
    formData.set("category", selectedCategory);
    formData.set("paidBy", selectedPayer);

    // Handle receipt
    if (receiptFile) {
      formData.set("receipt", receiptFile);
    }
    if (removeReceipt) {
      formData.set("removeReceipt", "true");
    }

    try {
      const result = isEditing
        ? await updateExpense(expense._id, formData)
        : await createExpense(formData);

      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      toast.success(
        isEditing ? "Expense updated successfully" : "Expense added successfully"
      );
      router.push("/expenses");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Title <span className="text-red-400">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          defaultValue={expense?.title}
          placeholder="e.g., Bought raw mango pulp"
          required
          className="h-11 rounded-xl"
        />
      </div>

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
            defaultValue={expense?.amount}
            placeholder="0.00"
            required
            className="h-11 rounded-xl pl-7"
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Category <span className="text-red-400">*</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-150",
                selectedCategory === cat
                  ? "border-brand-green bg-brand-green text-white shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-brand-green/40 hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Paid By */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Paid By <span className="text-red-400">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {PAYERS.map((payer) => (
            <button
              key={payer}
              type="button"
              onClick={() => setSelectedPayer(payer)}
              className={cn(
                "px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-150 text-center",
                selectedPayer === payer
                  ? "border-brand-green bg-brand-green/10 text-brand-green shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-brand-green/40 hover:text-foreground"
              )}
            >
              {payer}
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
                ? "border-brand-green bg-brand-green text-white"
                : "border-border bg-card text-muted-foreground hover:border-brand-green/40"
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
                ? "border-brand-green bg-brand-green text-white"
                : "border-border bg-card text-muted-foreground hover:border-brand-green/40"
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
              expense
                ? formatDateForInput(expense.date)
                : formatDateForInput(new Date())
            }
            required
            className="h-11 rounded-xl"
          />
        )}
      </div>

      {/* Additional Details Toggle */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {showDetails ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        Additional Details
        <span className="text-xs text-muted-foreground">(optional)</span>
      </button>

      {showDetails && (
        <div className="space-y-4 pl-0 border-l-2 border-border/60 ml-0 rounded-none">
          <div className="space-y-2">
            <Label htmlFor="vendor" className="text-sm font-medium">
              Vendor
            </Label>
            <Input
              id="vendor"
              name="vendor"
              defaultValue={expense?.vendor}
              placeholder="e.g., Fresh Fruits Co."
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceNumber" className="text-sm font-medium">
              Invoice Number
            </Label>
            <Input
              id="invoiceNumber"
              name="invoiceNumber"
              defaultValue={expense?.invoiceNumber}
              placeholder="e.g., INV-2024-001"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={expense?.description}
              placeholder="Any additional notes about this expense..."
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>
        </div>
      )}

      {/* Receipt Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Receipt</Label>
        <ReceiptUpload
          onFileSelect={setReceiptFile}
          currentReceipt={
            expense?.receipt && !removeReceipt
              ? { secureUrl: expense.receipt.secureUrl, bytes: expense.receipt.bytes }
              : null
          }
          onRemoveExisting={
            expense?.receipt
              ? () => {
                  setRemoveReceipt(true);
                }
              : undefined
          }
        />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={isLoading || !selectedCategory || !selectedPayer}
          className="h-11 px-8 rounded-xl bg-brand-green hover:bg-brand-green-light text-white font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEditing ? "Updating..." : "Saving..."}
            </>
          ) : isEditing ? (
            "Update Expense"
          ) : (
            "Save Expense"
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

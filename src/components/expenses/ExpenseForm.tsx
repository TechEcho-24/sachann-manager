"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReceiptUpload, type ExistingReceipt } from "@/components/expenses/ReceiptUpload";
import { EXPENSE_CATEGORIES, PAYERS } from "@/lib/constants";
import { cn, formatDateForInput } from "@/lib/utils";
import { createExpense, updateExpense, type SerializedExpense } from "@/actions/expense";
import { Loader2, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { toast } from "sonner";

interface ExpenseFormProps {
  expense?: SerializedExpense;
}

export function ExpenseForm({ expense }: ExpenseFormProps) {
  const router = useRouter();
  const isEditing = !!expense;

  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(
    !!(
      expense?.vendor ||
      expense?.invoiceNumber ||
      expense?.description ||
      expense?.location
    )
  );

  const [receipts, setReceipts] = useState<File[]>([]);
  const [existingReceipts, setExistingReceipts] = useState<ExistingReceipt[]>(
    expense?.receipts || []
  );

  const [selectedCategory, setSelectedCategory] = useState(expense?.category || "");
  const [selectedPayer, setSelectedPayer] = useState(expense?.paidBy || "");
  const [dateMode, setDateMode] = useState<"current" | "custom">(
    expense ? "custom" : "current"
  );

  // Location State
  const initialLoc = expense?.location;
  const [locationType, setLocationType] = useState<"auto" | "manual">(
    initialLoc?.type || "auto"
  );
  const [areaName, setAreaName] = useState(initialLoc?.areaName || "");
  const [mapLink, setMapLink] = useState(initialLoc?.mapLink || "");
  const [lat, setLat] = useState<number | undefined>(initialLoc?.lat);
  const [lng, setLng] = useState<number | undefined>(initialLoc?.lng);
  const [isLocating, setIsLocating] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        setMapLink(`https://www.google.com/maps?q=${latitude},${longitude}`);
        toast.success("Location acquired");
        setIsLocating(false);
      },
      (error) => {
        console.error("Location error:", error);
        toast.error("Failed to get location. Please allow location access.");
        setIsLocating(false);
      }
    );
  };

  const handleRemoveExistingReceipt = (index: number) => {
    const newExisting = [...existingReceipts];
    newExisting.splice(index, 1);
    setExistingReceipts(newExisting);
  };

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

    // Handle multiple receipts
    if (receipts.length > 0) {
      receipts.forEach((r) => formData.append("receipts", r));
    }
    
    formData.set("existingReceipts", JSON.stringify(existingReceipts));

    // Handle Location
    if (showDetails) {
      const locationData = { type: locationType, areaName, mapLink, lat, lng };
      if (locationData.mapLink || locationData.areaName || locationData.lat) {
        formData.set("location", JSON.stringify(locationData));
      }
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
                ? formatDateForInput(new Date(expense.date))
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
        <div className="space-y-6 pl-0 border-l-2 border-border/60 ml-0 rounded-none">
          {/* Location Section */}
          <div className="space-y-3 pt-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLocationType("auto")}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-150",
                  locationType === "auto"
                    ? "border-brand-green bg-brand-green/10 text-brand-green"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                Current Location
              </button>
              <button
                type="button"
                onClick={() => setLocationType("manual")}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-150",
                  locationType === "manual"
                    ? "border-brand-green bg-brand-green/10 text-brand-green"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                Manual Entry
              </button>
            </div>

            {locationType === "auto" ? (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="rounded-xl"
                >
                  {isLocating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4 mr-2" />
                  )}
                  {lat && lng ? "Update Location" : "Get Current Location"}
                </Button>
                {lat && lng && (
                  <span className="text-xs text-brand-green flex-1">
                    Location acquired
                  </span>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="areaName" className="text-xs text-muted-foreground">Area Name</Label>
                  <Input
                    id="areaName"
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    placeholder="e.g., Connaught Place"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mapLink" className="text-xs text-muted-foreground">Map Link</Label>
                  <Input
                    id="mapLink"
                    value={mapLink}
                    onChange={(e) => setMapLink(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Vendor */}
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

      {/* Receipts Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Receipts</Label>
        <ReceiptUpload
          files={receipts}
          onFilesChange={setReceipts}
          existingReceipts={existingReceipts}
          onRemoveExisting={handleRemoveExistingReceipt}
          maxFiles={5}
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

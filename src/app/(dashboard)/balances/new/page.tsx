"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PAYERS } from "@/lib/constants";
import { createReimbursement } from "@/actions/reimbursement";

export default function NewReimbursementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await createReimbursement(formData);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Reimbursement recorded successfully!");
        router.push("/balances");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save reimbursement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/balances"
          className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Record Reimbursement
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Log a payment made to a user to clear their pending balance.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              required
              step="0.01"
              min="0.01"
              placeholder="e.g. 5000"
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
            />
          </div>

          {/* Paid To */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Paid To <span className="text-red-500">*</span>
            </label>
            <select
              name="paidTo"
              required
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
            >
              <option value="">Select person</option>
              {PAYERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
            />
          </div>

          {/* Payment Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Mode</label>
            <select
              name="paymentMode"
              className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
            >
              <option value="">Select mode (Optional)</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Any reference or description..."
            className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all resize-none"
          />
        </div>

        {/* Actions */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
          <Link
            href="/balances"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-green hover:bg-brand-green-light transition-colors shadow-sm disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Record
          </button>
        </div>
      </form>
    </div>
  );
}

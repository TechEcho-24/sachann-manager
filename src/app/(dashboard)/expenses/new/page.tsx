import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewExpensePage() {
  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/expenses"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to expenses
        </Link>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">
          Add Expense
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Record a new expense for tracking
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 lg:p-8">
        <ExpenseForm />
      </div>
    </div>
  );
}

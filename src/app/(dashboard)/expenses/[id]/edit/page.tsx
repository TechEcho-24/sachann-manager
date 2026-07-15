import { notFound } from "next/navigation";
import Link from "next/link";
import { getExpenseById } from "@/actions/expense";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ArrowLeft } from "lucide-react";

interface EditExpensePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExpensePage({
  params,
}: EditExpensePageProps) {
  const { id } = await params;
  const expense = await getExpenseById(id);

  if (!expense) {
    notFound();
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/expenses/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to expense
        </Link>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">
          Edit Expense
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Update expense details
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 lg:p-8">
        <ExpenseForm expense={expense} />
      </div>
    </div>
  );
}

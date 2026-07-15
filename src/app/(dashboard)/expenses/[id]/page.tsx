import { notFound } from "next/navigation";
import Link from "next/link";
import { getExpenseById } from "@/actions/expense";
import { formatCurrency, formatDate, formatFileSize } from "@/lib/utils";
import { CategoryBadge } from "@/components/expenses/CategoryBadge";
import { PayerBadge } from "@/components/expenses/PayerBadge";
import { ExpenseActions } from "@/components/expenses/ExpenseActions";
import {
  ArrowLeft,
  Calendar,
  Building,
  FileText,
  ImageIcon,
} from "lucide-react";

interface ExpenseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExpenseDetailPage({
  params,
}: ExpenseDetailPageProps) {
  const { id } = await params;
  const expense = await getExpenseById(id);

  if (!expense) {
    notFound();
  }

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
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">
              {expense.title}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <CategoryBadge category={expense.category} size="md" />
              <PayerBadge payer={expense.paidBy} size="md" />
              {expense.isArchived && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  Archived
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl lg:text-3xl font-bold text-foreground">
              {formatCurrency(expense.amount)}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(expense.date)}
              </p>
            </div>
          </div>

          {expense.vendor && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
              <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Vendor</p>
                <p className="text-sm font-medium text-foreground">
                  {expense.vendor}
                </p>
              </div>
            </div>
          )}

          {expense.invoiceNumber && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Invoice</p>
                <p className="text-sm font-medium text-foreground">
                  {expense.invoiceNumber}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {expense.description && (
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-sm text-foreground leading-relaxed">
              {expense.description}
            </p>
          </div>
        )}

        {/* Receipt */}
        {expense.receipt && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Receipt • {expense.receipt.format.toUpperCase()} •{" "}
                {formatFileSize(expense.receipt.bytes)}
              </p>
            </div>
            <div className="rounded-xl overflow-hidden border border-border bg-muted/20 max-w-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={expense.receipt.secureUrl}
                alt="Receipt"
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <ExpenseActions expenseId={expense._id} isArchived={expense.isArchived} />
      </div>
    </div>
  );
}

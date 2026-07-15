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
  MapPin,
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

        {/* Location */}
        {expense.location && (
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-1">Location</p>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              {expense.location.areaName ? (
                <span>{expense.location.areaName}</span>
              ) : (
                <span>GPS Location</span>
              )}
              {expense.location.mapLink && (
                <a
                  href={expense.location.mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-green hover:underline ml-2"
                >
                  View on Map
                </a>
              )}
            </div>
          </div>
        )}

        {/* Receipts */}
        {expense.receipts && expense.receipts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Receipts ({expense.receipts.length})
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {expense.receipts.map((receipt, idx) => (
                <div key={receipt.publicId} className="rounded-xl overflow-hidden border border-border bg-muted/20">
                  <a href={receipt.secureUrl} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={receipt.secureUrl}
                      alt={`Receipt ${idx + 1}`}
                      className="w-full h-auto max-h-[400px] object-cover hover:opacity-90 transition-opacity"
                    />
                  </a>
                  <div className="p-2 text-center border-t border-border bg-background/50">
                    <p className="text-xs text-muted-foreground">
                      {receipt.format.toUpperCase()} • {formatFileSize(receipt.bytes)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <ExpenseActions expenseId={expense._id} isArchived={expense.isArchived} />
      </div>
    </div>
  );
}

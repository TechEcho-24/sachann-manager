import { notFound } from "next/navigation";
import { SaleForm } from "@/components/sales/SaleForm";
import { getSaleById } from "@/actions/sale";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ArchiveSaleButton } from "./ArchiveSaleButton";
import { DeleteSaleButton } from "./DeleteSaleButton";

export default async function EditSalePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sale = await getSaleById(id);

  if (!sale) {
    notFound();
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6 space-y-4">
        <Link
          href="/sales"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Sales
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Sale</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Update sale details or change its status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ArchiveSaleButton
              id={sale._id}
              isArchived={sale.isArchived}
            />
            <DeleteSaleButton id={sale._id} />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 lg:p-6 shadow-sm">
        <SaleForm sale={sale} />
      </div>
    </div>
  );
}

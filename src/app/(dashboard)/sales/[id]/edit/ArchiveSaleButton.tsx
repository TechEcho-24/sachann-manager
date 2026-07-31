"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { toggleArchiveSale } from "@/actions/sale";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ArchiveSaleButton({
  id,
  isArchived,
}: {
  id: string;
  isArchived: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setIsLoading(true);
    try {
      const result = await toggleArchiveSale(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.isArchived ? "Sale archived" : "Sale unarchived"
      );
      router.refresh();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className="gap-2 rounded-xl h-9"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isArchived ? (
        <ArchiveRestore className="w-4 h-4" />
      ) : (
        <Archive className="w-4 h-4" />
      )}
      {isArchived ? "Unarchive" : "Archive"}
    </Button>
  );
}

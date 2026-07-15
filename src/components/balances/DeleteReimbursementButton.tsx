"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteReimbursement } from "@/actions/reimbursement";

interface DeleteReimbursementButtonProps {
  id: string;
}

export function DeleteReimbursementButton({ id }: DeleteReimbursementButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this reimbursement? This cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteReimbursement(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Reimbursement deleted");
      }
    } catch (error) {
      toast.error("Failed to delete reimbursement");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50"
      title="Delete reimbursement"
    >
      {isDeleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}

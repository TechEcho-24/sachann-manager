"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { deleteExpense, toggleArchiveExpense } from "@/actions/expense";
import { Pencil, Trash2, Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ExpenseActionsProps {
  expenseId: string;
  isArchived: boolean;
}

export function ExpenseActions({ expenseId, isArchived }: ExpenseActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteExpense(expenseId);
      if (result.error) {
        toast.error(result.error);
        setIsDeleting(false);
        return;
      }
      toast.success("Expense deleted");
      router.push("/expenses");
      router.refresh();
    } catch {
      toast.error("Failed to delete expense");
      setIsDeleting(false);
    }
  }

  async function handleArchiveToggle() {
    setIsArchiving(true);
    try {
      const result = await toggleArchiveExpense(expenseId);
      if (result.error) {
        toast.error(result.error);
        setIsArchiving(false);
        return;
      }
      toast.success(result.isArchived ? "Expense archived" : "Expense unarchived");
      router.refresh();
    } catch {
      toast.error("Failed to update expense");
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <div className="flex items-center gap-2 pt-4 border-t border-border">
      <Link href={`/expenses/${expenseId}/edit`}>
        <Button variant="outline" className="rounded-xl gap-2">
          <Pencil className="w-4 h-4" />
          Edit
        </Button>
      </Link>

      <Button
        variant="outline"
        onClick={handleArchiveToggle}
        disabled={isArchiving}
        className="rounded-xl gap-2"
      >
        {isArchiving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isArchived ? (
          <ArchiveRestore className="w-4 h-4" />
        ) : (
          <Archive className="w-4 h-4" />
        )}
        {isArchived ? "Unarchive" : "Archive"}
      </Button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger
          render={
            <Button
              variant="outline"
              className="rounded-xl gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
            />
          }
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </DialogTrigger>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be
              undone and will also remove the receipt image if attached.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

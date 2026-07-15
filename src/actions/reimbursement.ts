"use server";

import connectDB from "@/lib/db";
import Reimbursement from "@/models/Reimbursement";
import Expense from "@/models/Expense";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface PayerBalance {
  payer: string;
  totalSpent: number;
  totalReimbursed: number;
  balanceDue: number;
}

export async function getBalances(): Promise<PayerBalance[]> {
  await connectDB();

  // 1. Get total lifetime expenses per payer
  const expenses = await Expense.aggregate([
    { $match: { isArchived: false } },
    { $group: { _id: "$paidBy", totalSpent: { $sum: "$amount" } } },
  ]);

  // 2. Get total reimbursements per payer
  const reimbursements = await Reimbursement.aggregate([
    { $match: { isArchived: false } },
    { $group: { _id: "$paidTo", totalReimbursed: { $sum: "$amount" } } },
  ]);

  // Merge the results
  const balancesMap = new Map<string, PayerBalance>();

  // Add expenses to map
  for (const exp of expenses) {
    balancesMap.set(exp._id, {
      payer: exp._id,
      totalSpent: exp.totalSpent,
      totalReimbursed: 0,
      balanceDue: exp.totalSpent,
    });
  }

  // Add reimbursements to map and calculate balance
  for (const reimb of reimbursements) {
    if (balancesMap.has(reimb._id)) {
      const existing = balancesMap.get(reimb._id)!;
      existing.totalReimbursed = reimb.totalReimbursed;
      existing.balanceDue = existing.totalSpent - existing.totalReimbursed;
    } else {
      balancesMap.set(reimb._id, {
        payer: reimb._id,
        totalSpent: 0,
        totalReimbursed: reimb.totalReimbursed,
        balanceDue: 0 - reimb.totalReimbursed,
      });
    }
  }

  return Array.from(balancesMap.values()).sort((a, b) => b.balanceDue - a.balanceDue);
}

export async function getReimbursements(limit: number = 50) {
  await connectDB();
  
  const records = await Reimbursement.find({ isArchived: false })
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .populate("createdBy", "name")
    .lean();

  return records.map((r: any) => ({
    _id: r._id.toString(),
    amount: r.amount,
    paidTo: r.paidTo,
    date: r.date.toISOString(),
    paymentMode: r.paymentMode || "",
    notes: r.notes || "",
    createdBy: r.createdBy?.name || "Admin",
  }));
}

export async function createReimbursement(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    await connectDB();

    const amount = parseFloat(formData.get("amount") as string);
    const paidTo = formData.get("paidTo") as string;
    const dateStr = formData.get("date") as string;
    const paymentMode = formData.get("paymentMode") as string;
    const notes = formData.get("notes") as string;

    if (!amount || amount <= 0) return { error: "Amount must be greater than 0" };
    if (!paidTo) return { error: "Paid To is required" };

    await Reimbursement.create({
      amount,
      paidTo,
      date: dateStr ? new Date(dateStr) : new Date(),
      paymentMode,
      notes,
      createdBy: session.user.id,
    });

    revalidatePath("/balances");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to create reimbursement:", error);
    return { error: error.message || "Failed to create reimbursement" };
  }
}

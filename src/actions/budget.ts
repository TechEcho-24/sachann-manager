"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Budget from "@/models/Budget";
import { budgetSchema } from "@/lib/validators";
import { auth } from "@/lib/auth";

export interface SerializedBudget {
  _id: string;
  month: number;
  year: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export async function setBudget(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const rawData = {
    month: Number(formData.get("month")),
    year: Number(formData.get("year")),
    amount: formData.get("amount") as string,
  };

  const result = budgetSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    await connectDB();

    const budget = await Budget.findOneAndUpdate(
      { month: result.data.month, year: result.data.year },
      { amount: result.data.amount },
      { upsert: true, new: true }
    );

    revalidatePath("/budget");
    revalidatePath("/dashboard");

    return {
      success: true,
      budget: {
        _id: budget._id.toString(),
        month: budget.month,
        year: budget.year,
        amount: budget.amount,
        createdAt: budget.createdAt.toISOString(),
        updatedAt: budget.updatedAt.toISOString(),
      },
    };
  } catch {
    return { error: "Failed to set budget. Please try again." };
  }
}

export async function getBudget(
  month: number,
  year: number
): Promise<SerializedBudget | null> {
  await connectDB();

  const budget = await Budget.findOne({ month, year }).lean();
  if (!budget) return null;

  return {
    _id: (budget._id as unknown as { toString(): string }).toString(),
    month: budget.month,
    year: budget.year,
    amount: budget.amount,
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
  };
}

export async function getAllBudgets(
  year: number
): Promise<SerializedBudget[]> {
  await connectDB();

  const budgets = await Budget.find({ year }).sort({ month: 1 }).lean();

  return budgets.map((b) => ({
    _id: (b._id as unknown as { toString(): string }).toString(),
    month: b.month,
    year: b.year,
    amount: b.amount,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));
}

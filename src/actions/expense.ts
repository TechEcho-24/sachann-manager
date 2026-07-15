"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Expense, { type IExpense, type ILocation } from "@/models/Expense";
import { expenseSchema } from "@/lib/validators";
import { auth } from "@/lib/auth";
import { uploadReceiptImage, deleteReceiptImage } from "@/lib/cloudinary";

export interface ExpenseFilters {
  search?: string;
  category?: string;
  paidBy?: string;
  startDate?: string;
  endDate?: string;
  isArchived?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedExpenses {
  expenses: SerializedExpense[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SerializedExpense {
  _id: string;
  title: string;
  amount: number;
  category: string;
  paidBy: string;
  date: string;
  description?: string;
  vendor?: string;
  invoiceNumber?: string;
  receipts?: {
    publicId: string;
    secureUrl: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
  }[];
  location?: {
    type: "auto" | "manual";
    areaName?: string;
    mapLink?: string;
    lat?: number;
    lng?: number;
  };
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

function serializeExpense(expense: IExpense): SerializedExpense {
  return {
    _id: expense._id.toString(),
    title: expense.title,
    amount: expense.amount,
    category: expense.category,
    paidBy: expense.paidBy,
    date: expense.date.toISOString(),
    description: expense.description,
    vendor: expense.vendor,
    invoiceNumber: expense.invoiceNumber,
    receipts: expense.receipts?.map((r) => ({
      publicId: r.publicId,
      secureUrl: r.secureUrl,
      width: r.width,
      height: r.height,
      format: r.format,
      bytes: r.bytes,
    })) || [],
    location: expense.location
      ? {
          type: expense.location.type,
          areaName: expense.location.areaName,
          mapLink: expense.location.mapLink,
          lat: expense.location.lat,
          lng: expense.location.lng,
        }
      : undefined,
    isArchived: expense.isArchived,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

export async function createExpense(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const rawData = {
    title: (formData.get("title") as string) || "",
    amount: (formData.get("amount") as string) || "",
    category: (formData.get("category") as string) || "",
    paidBy: (formData.get("paidBy") as string) || "",
    date: (formData.get("date") as string) || "",
    description: (formData.get("description") as string) || "",
    vendor: (formData.get("vendor") as string) || "",
    invoiceNumber: (formData.get("invoiceNumber") as string) || "",
  };

  const result = expenseSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    await connectDB();

    const expenseData: Record<string, unknown> = {
      ...result.data,
      date: new Date(result.data.date),
    };

    // Handle Location
    const locationStr = formData.get("location") as string;
    if (locationStr) {
      try {
        expenseData.location = JSON.parse(locationStr);
      } catch (e) {
        console.error("Failed to parse location", e);
      }
    }

    // Handle multiple receipts
    const receiptFiles = formData.getAll("receipts") as File[];
    const uploadedReceipts = [];

    for (const file of receiptFiles) {
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadResult = await uploadReceiptImage(buffer, file.name);

        uploadedReceipts.push({
          publicId: uploadResult.public_id,
          secureUrl: uploadResult.secure_url,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
        });
      }
    }

    expenseData.receipts = uploadedReceipts;

    const expense = await Expense.create(expenseData);

    revalidatePath("/expenses");
    revalidatePath("/dashboard");

    return { success: true, expense: serializeExpense(expense) };
  } catch (error) {
    console.error("Failed to create expense:", error);
    return { error: "Failed to create expense. Please try again." };
  }
}

export async function updateExpense(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const rawData = {
    title: (formData.get("title") as string) || "",
    amount: (formData.get("amount") as string) || "",
    category: (formData.get("category") as string) || "",
    paidBy: (formData.get("paidBy") as string) || "",
    date: (formData.get("date") as string) || "",
    description: (formData.get("description") as string) || "",
    vendor: (formData.get("vendor") as string) || "",
    invoiceNumber: (formData.get("invoiceNumber") as string) || "",
  };

  const result = expenseSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    await connectDB();

    const expense = await Expense.findById(id);
    if (!expense) {
      return { error: "Expense not found" };
    }

    const updateData: Record<string, unknown> = {
      ...result.data,
      date: new Date(result.data.date),
    };

    // Handle Location
    const locationStr = formData.get("location") as string;
    if (locationStr) {
      try {
        updateData.location = JSON.parse(locationStr);
      } catch (e) {
        console.error("Failed to parse location", e);
      }
    } else {
      updateData.$unset = { location: 1 };
    }

    // Handle Receipts
    const rawExistingReceipts = formData.get("existingReceipts") as string;
    const existingReceipts = rawExistingReceipts ? JSON.parse(rawExistingReceipts) : [];

    // Delete receipts that are no longer in existingReceipts
    if (expense.receipts && expense.receipts.length > 0) {
      const existingPublicIds = existingReceipts.map((r: any) => r.publicId);
      const receiptsToDelete = expense.receipts.filter(
        (r) => !existingPublicIds.includes(r.publicId)
      );
      
      for (const r of receiptsToDelete) {
        if (r.publicId) {
          try {
            await deleteReceiptImage(r.publicId);
          } catch (e) {
            console.error("Failed to delete removed receipt from cloudinary", e);
          }
        }
      }
    }

    // Upload new receipts
    const newReceipts = formData.getAll("receipts") as File[];
    const uploadedReceipts = [];

    for (const file of newReceipts) {
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadResult = await uploadReceiptImage(buffer, file.name);

        uploadedReceipts.push({
          publicId: uploadResult.public_id,
          secureUrl: uploadResult.secure_url,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
        });
      }
    }

    updateData.receipts = [...existingReceipts, ...uploadedReceipts];

    await Expense.findByIdAndUpdate(id, updateData, { new: true });

    revalidatePath("/expenses");
    revalidatePath(`/expenses/${id}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to update expense:", error);
    return { error: "Failed to update expense. Please try again." };
  }
}

export async function deleteExpense(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    await connectDB();

    const expense = await Expense.findById(id);
    if (!expense) {
      return { error: "Expense not found" };
    }

    // Delete all receipts from Cloudinary
    if (expense.receipts && expense.receipts.length > 0) {
      for (const r of expense.receipts) {
        if (r.publicId) {
          try {
            await deleteReceiptImage(r.publicId);
          } catch (e) {
            console.error("Failed to delete receipt", e);
          }
        }
      }
    }

    // Fallback if there's a legacy single receipt
    if ((expense as any).receipt) {
       try {
         await deleteReceiptImage((expense as any).receipt.publicId);
       } catch (e) {}
    }

    await Expense.findByIdAndDelete(id);

    revalidatePath("/expenses");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return { error: "Failed to delete expense. Please try again." };
  }
}

export async function toggleArchiveExpense(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    await connectDB();

    const expense = await Expense.findById(id);
    if (!expense) {
      return { error: "Expense not found" };
    }

    expense.isArchived = !expense.isArchived;
    await expense.save();

    revalidatePath("/expenses");
    revalidatePath(`/expenses/${id}`);
    revalidatePath("/dashboard");

    return { success: true, isArchived: expense.isArchived };
  } catch (error) {
    console.error("Failed to toggle archive:", error);
    return { error: "Failed to update expense. Please try again." };
  }
}

export async function getExpenses(
  filters: ExpenseFilters = {}
): Promise<PaginatedExpenses> {
  await connectDB();

  const {
    search,
    category,
    paidBy,
    startDate,
    endDate,
    isArchived = false,
    page = 1,
    limit = 20,
    sortBy = "date",
    sortOrder = "desc",
  } = filters;

  const query: Record<string, unknown> = { isArchived };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { vendor: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { invoiceNumber: { $regex: search, $options: "i" } },
    ];
  }

  if (category) {
    query.category = category;
  }

  if (paidBy) {
    query.paidBy = paidBy;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      (query.date as Record<string, unknown>).$gte = new Date(startDate);
    }
    if (endDate) {
      (query.date as Record<string, unknown>).$lte = new Date(
        endDate + "T23:59:59.999Z"
      );
    }
  }

  const skip = (page - 1) * limit;
  const sort: Record<string, 1 | -1> = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  const [expenses, total] = await Promise.all([
    Expense.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Expense.countDocuments(query),
  ]);

  return {
    expenses: expenses.map((e) =>
      serializeExpense(e as unknown as IExpense)
    ),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getExpenseById(
  id: string
): Promise<SerializedExpense | null> {
  await connectDB();

  const expense = await Expense.findById(id).lean();
  if (!expense) return null;

  return serializeExpense(expense as unknown as IExpense);
}

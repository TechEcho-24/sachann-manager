"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Sale, { type ISale } from "@/models/Sale";
import { saleSchema } from "@/lib/validators";
import { auth } from "@/lib/auth";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export interface SaleFilters {
  search?: string;
  platform?: string;
  startDate?: string;
  endDate?: string;
  isArchived?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedSales {
  sales: SerializedSale[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SerializedSale {
  _id: string;
  amount: number;
  platform: string;
  date: string;
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

function serializeSale(sale: ISale): SerializedSale {
  return {
    _id: sale._id.toString(),
    amount: sale.amount,
    platform: sale.platform,
    date: sale.date.toISOString(),
    notes: sale.notes,
    isArchived: sale.isArchived,
    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString(),
  };
}

export async function createSale(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const rawData = {
    amount: (formData.get("amount") as string) || "",
    platform: (formData.get("platform") as string) || "",
    date: (formData.get("date") as string) || "",
    notes: (formData.get("notes") as string) || "",
  };

  const result = saleSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    await connectDB();

    const saleData = {
      ...result.data,
      date: new Date(result.data.date),
    };

    const sale = await Sale.create(saleData);

    revalidatePath("/sales");
    revalidatePath("/sales/reports");
    revalidatePath("/dashboard");

    return { success: true, sale: serializeSale(sale) };
  } catch (error) {
    console.error("Failed to create sale:", error);
    return { error: "Failed to create sale. Please try again." };
  }
}

export async function updateSale(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const rawData = {
    amount: (formData.get("amount") as string) || "",
    platform: (formData.get("platform") as string) || "",
    date: (formData.get("date") as string) || "",
    notes: (formData.get("notes") as string) || "",
  };

  const result = saleSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    await connectDB();

    const sale = await Sale.findById(id);
    if (!sale) {
      return { error: "Sale not found" };
    }

    const updateData = {
      ...result.data,
      date: new Date(result.data.date),
    };

    await Sale.findByIdAndUpdate(id, updateData, { new: true });

    revalidatePath("/sales");
    revalidatePath(`/sales/${id}`);
    revalidatePath("/sales/reports");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to update sale:", error);
    return { error: "Failed to update sale. Please try again." };
  }
}

export async function deleteSale(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    await connectDB();

    const sale = await Sale.findById(id);
    if (!sale) {
      return { error: "Sale not found" };
    }

    await Sale.findByIdAndDelete(id);

    revalidatePath("/sales");
    revalidatePath("/sales/reports");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete sale:", error);
    return { error: "Failed to delete sale. Please try again." };
  }
}

export async function toggleArchiveSale(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    await connectDB();

    const sale = await Sale.findById(id);
    if (!sale) {
      return { error: "Sale not found" };
    }

    sale.isArchived = !sale.isArchived;
    await sale.save();

    revalidatePath("/sales");
    revalidatePath(`/sales/${id}`);
    revalidatePath("/sales/reports");
    revalidatePath("/dashboard");

    return { success: true, isArchived: sale.isArchived };
  } catch (error) {
    console.error("Failed to toggle archive:", error);
    return { error: "Failed to update sale. Please try again." };
  }
}

export async function getSales(
  filters: SaleFilters = {}
): Promise<PaginatedSales> {
  await connectDB();

  const {
    search,
    platform,
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
      { notes: { $regex: search, $options: "i" } },
      { platform: { $regex: search, $options: "i" } },
    ];
  }

  if (platform) {
    query.platform = platform;
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

  const [sales, total] = await Promise.all([
    Sale.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Sale.countDocuments(query),
  ]);

  return {
    sales: sales.map((s) => serializeSale(s as unknown as ISale)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getSaleById(
  id: string
): Promise<SerializedSale | null> {
  await connectDB();

  const sale = await Sale.findById(id).lean();
  if (!sale) return null;

  return serializeSale(sale as unknown as ISale);
}

export interface SalesReport {
  totalSales: number;
  transactionCount: number;
  averagePerDay: number;
  platformBreakdown: { platform: string; total: number; count: number; percentage: number }[];
  dailySales: { date: string; day: number; total: number }[];
  previousMonthTotal: number;
  percentChange: number;
}

export async function getSalesReports(month: number, year: number): Promise<SalesReport> {
  await connectDB();

  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));
  const prevStartDate = startOfMonth(subMonths(startDate, 1));
  const prevEndDate = endOfMonth(subMonths(startDate, 1));
  const daysInMonth = endDate.getDate();

  const [currentMonthAgg, prevMonthAgg, platformAgg, dailyAgg] = await Promise.all([
    Sale.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate }, isArchived: false } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      { $match: { date: { $gte: prevStartDate, $lte: prevEndDate }, isArchived: false } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Sale.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate }, isArchived: false } },
      { $group: { _id: "$platform", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Sale.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate }, isArchived: false } },
      { $group: { _id: { $dayOfMonth: "$date" }, total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const totalSales = currentMonthAgg[0]?.total || 0;
  const transactionCount = currentMonthAgg[0]?.count || 0;
  const previousMonthTotal = prevMonthAgg[0]?.total || 0;

  const percentChange =
    previousMonthTotal === 0
      ? totalSales > 0
        ? 100
        : 0
      : ((totalSales - previousMonthTotal) / previousMonthTotal) * 100;

  const platformBreakdown = platformAgg.map((item) => ({
    platform: item._id,
    total: item.total,
    count: item.count,
    percentage: totalSales > 0 ? (item.total / totalSales) * 100 : 0,
  }));

  const dailySales: { date: string; day: number; total: number }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const found = dailyAgg.find((r) => r._id === day);
    dailySales.push({
      date: `${day}`,
      day,
      total: found?.total || 0,
    });
  }

  return {
    totalSales,
    transactionCount,
    averagePerDay: transactionCount > 0 ? totalSales / daysInMonth : 0,
    platformBreakdown,
    dailySales,
    previousMonthTotal,
    percentChange,
  };
}

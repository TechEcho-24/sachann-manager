"use server";

import connectDB from "@/lib/db";
import Expense from "@/models/Expense";
import { startOfMonth, endOfMonth } from "date-fns";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface MonthlyReport {
  month: number;
  year: number;
  totalExpenses: number;
  transactionCount: number;
  averageExpense: number;
  highestExpense: {
    title: string;
    amount: number;
    category: string;
    date: string;
  } | null;
  categoryBreakdown: {
    category: string;
    total: number;
    count: number;
    percentage: number;
  }[];
  payerBreakdown: {
    paidBy: string;
    total: number;
    count: number;
    percentage: number;
  }[];
  dailyTotals: { day: number; total: number }[];
}

export async function getMonthlyReport(
  month: number,
  year: number
): Promise<MonthlyReport> {
  await connectDB();

  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  const matchStage = {
    $match: {
      date: { $gte: startDate, $lte: endDate },
      isArchived: false,
    },
  };

  const [summary, categoryAgg, payerAgg, dailyAgg, highestExpense] =
    await Promise.all([
      Expense.aggregate([
        matchStage,
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
            count: { $sum: 1 },
            avg: { $avg: "$amount" },
          },
        },
      ]),
      Expense.aggregate([
        matchStage,
        { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Expense.aggregate([
        matchStage,
        { $group: { _id: "$paidBy", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Expense.aggregate([
        matchStage,
        { $group: { _id: { $dayOfMonth: "$date" }, total: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
      ]),
      Expense.findOne({
        date: { $gte: startDate, $lte: endDate },
        isArchived: false,
      })
        .sort({ amount: -1 })
        .select("title amount category date")
        .lean(),
    ]);

  const totalExpenses = summary[0]?.total || 0;

  return {
    month,
    year,
    totalExpenses,
    transactionCount: summary[0]?.count || 0,
    averageExpense: summary[0]?.avg || 0,
    highestExpense: highestExpense
      ? {
          title: highestExpense.title,
          amount: highestExpense.amount,
          category: highestExpense.category,
          date: highestExpense.date.toISOString(),
        }
      : null,
    categoryBreakdown: categoryAgg.map((item) => ({
      category: item._id,
      total: item.total,
      count: item.count,
      percentage: totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0,
    })),
    payerBreakdown: payerAgg.map((item) => ({
      paidBy: item._id,
      total: item.total,
      count: item.count,
      percentage: totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0,
    })),
    dailyTotals: dailyAgg.map((item) => ({
      day: item._id,
      total: item.total,
    })),
  };
}

export async function exportExpensesToCSV(
  month: number,
  year: number
): Promise<string> {
  await connectDB();

  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  const expenses = await Expense.find({
    date: { $gte: startDate, $lte: endDate },
    isArchived: false,
  })
    .sort({ date: 1 })
    .lean();

  const headers = [
    "Date",
    "Title",
    "Amount (₹)",
    "Category",
    "Paid By",
    "Vendor",
    "Invoice Number",
    "Description",
    "Has Receipt",
  ];

  const rows = expenses.map((e) => [
    formatDate(e.date),
    `"${e.title.replace(/"/g, '""')}"`,
    formatCurrency(e.amount),
    e.category,
    e.paidBy,
    e.vendor ? `"${e.vendor.replace(/"/g, '""')}"` : "",
    e.invoiceNumber || "",
    e.description ? `"${e.description.replace(/"/g, '""')}"` : "",
    (e.receipts && e.receipts.length > 0) ? "Yes" : "No",
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

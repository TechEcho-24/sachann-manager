"use server";

import connectDB from "@/lib/db";
import Expense from "@/models/Expense";
import Budget from "@/models/Budget";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export interface DashboardSummary {
  totalExpenses: number;
  transactionCount: number;
  averagePerDay: number;
  budgetAmount: number;
  budgetRemaining: number;
  budgetUsedPercent: number;
  previousMonthTotal: number;
  percentChange: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface PaidByBreakdown {
  paidBy: string;
  total: number;
  count: number;
  percentage: number;
}

export interface DailyExpense {
  date: string;
  day: number;
  total: number;
}

export interface RecentExpense {
  _id: string;
  title: string;
  amount: number;
  category: string;
  paidBy: string;
  date: string;
}

export async function getDashboardData(
  month: number,
  year: number
): Promise<DashboardSummary> {
  await connectDB();

  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));
  const prevStartDate = startOfMonth(subMonths(startDate, 1));
  const prevEndDate = endOfMonth(subMonths(startDate, 1));

  const daysInMonth = endDate.getDate();

  const [currentMonthAgg, prevMonthAgg, budget] = await Promise.all([
    Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          isArchived: false,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      {
        $match: {
          date: { $gte: prevStartDate, $lte: prevEndDate },
          isArchived: false,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]),
    Budget.findOne({ month, year }),
  ]);

  const totalExpenses = currentMonthAgg[0]?.total || 0;
  const transactionCount = currentMonthAgg[0]?.count || 0;
  const previousMonthTotal = prevMonthAgg[0]?.total || 0;
  const budgetAmount = budget?.amount || 0;

  const percentChange =
    previousMonthTotal === 0
      ? totalExpenses > 0
        ? 100
        : 0
      : ((totalExpenses - previousMonthTotal) / previousMonthTotal) * 100;

  return {
    totalExpenses,
    transactionCount,
    averagePerDay: transactionCount > 0 ? totalExpenses / daysInMonth : 0,
    budgetAmount,
    budgetRemaining: budgetAmount - totalExpenses,
    budgetUsedPercent: budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0,
    previousMonthTotal,
    percentChange,
  };
}

export async function getCategoryBreakdown(
  month: number,
  year: number
): Promise<CategoryBreakdown[]> {
  await connectDB();

  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  const result = await Expense.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        isArchived: false,
      },
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const grandTotal = result.reduce((sum, item) => sum + item.total, 0);

  return result.map((item) => ({
    category: item._id,
    total: item.total,
    count: item.count,
    percentage: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
  }));
}

export async function getPaidByBreakdown(
  month: number,
  year: number
): Promise<PaidByBreakdown[]> {
  await connectDB();

  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  const result = await Expense.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        isArchived: false,
      },
    },
    {
      $group: {
        _id: "$paidBy",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const grandTotal = result.reduce((sum, item) => sum + item.total, 0);

  return result.map((item) => ({
    paidBy: item._id,
    total: item.total,
    count: item.count,
    percentage: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
  }));
}

export async function getDailyExpenses(
  month: number,
  year: number
): Promise<DailyExpense[]> {
  await connectDB();

  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  const result = await Expense.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        isArchived: false,
      },
    },
    {
      $group: {
        _id: { $dayOfMonth: "$date" },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill all days of the month
  const daysInMonth = endDate.getDate();
  const dailyData: DailyExpense[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const found = result.find((r) => r._id === day);
    dailyData.push({
      date: `${day}`,
      day,
      total: found?.total || 0,
    });
  }

  return dailyData;
}

export async function getRecentExpenses(
  limit: number = 5
): Promise<RecentExpense[]> {
  await connectDB();

  const expenses = await Expense.find({ isArchived: false })
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .select("title amount category paidBy date")
    .lean();

  return expenses.map((e) => ({
    _id: (e._id as unknown as { toString(): string }).toString(),
    title: e.title,
    amount: e.amount,
    category: e.category,
    paidBy: e.paidBy,
    date: e.date.toISOString(),
  }));
}

import { z } from "zod";
import { EXPENSE_CATEGORIES, PAYERS } from "@/lib/constants";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const expenseSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0"),
  category: z.enum(EXPENSE_CATEGORIES, {
    message: "Please select a valid category",
  }),
  paidBy: z.enum(PAYERS, {
    message: "Please select a valid payer",
  }),
  date: z.string().min(1, "Date is required"),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
  vendor: z.string().max(200, "Vendor name cannot be more than 200 characters").optional().or(z.literal("")),
  invoiceNumber: z.string().max(100, "Invoice number cannot be more than 100 characters").optional().or(z.literal("")),
  location: z.object({
    type: z.enum(["auto", "manual"]),
    areaName: z.string().optional(),
    mapLink: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional()
  }).optional()
});

export const budgetSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  amount: z.coerce.number().min(0, "Budget amount cannot be negative"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

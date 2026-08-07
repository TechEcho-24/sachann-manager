import { z } from "zod";
import { EXPENSE_CATEGORIES, PAYERS, SALES_PLATFORMS } from "@/lib/constants";

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

export const saleSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  platform: z.enum(SALES_PLATFORMS, {
    message: "Please select a valid platform",
  }),
  date: z.string().min(1, "Date is required"),
  notes: z
    .string()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type SaleInput = z.infer<typeof saleSchema>;

// User management validators
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const createUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        passwordRegex,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm the password"),
    role: z.enum(["admin", "admin_manager", "manager", "employee"] as const, {
      message: "Please select a valid role",
    }),
    isActive: z.boolean().optional().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "admin_manager", "manager", "employee"] as const, {
    message: "Please select a valid role",
  }),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        passwordRegex,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm the password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(300, "Title too long"),
  description: z.string().max(5000, "Description too long").optional().or(z.literal("")),
  assignedTo: z.string().min(1, "Please assign this task to someone"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["low", "medium", "high", "critical"] as const, {
    message: "Please select a valid priority",
  }),
  status: z.enum(["todo", "in_progress", "blocked", "in_review", "done", "cancelled"] as const).optional().default("todo"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type TaskInput = z.infer<typeof taskSchema>;

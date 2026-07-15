// Expense categories and payers as standalone constants
// These are separated from the Mongoose models to avoid importing Mongoose in client components

export const EXPENSE_CATEGORIES = [
  "Raw Materials",
  "Packaging",
  "Transportation",
  "Marketing",
  "Salaries",
  "Utilities",
  "Rent",
  "Equipment",
  "Miscellaneous",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYERS = ["Mummy", "Papa", "Anuj", "Anurag"] as const;
export type Payer = (typeof PAYERS)[number];

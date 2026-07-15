import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as Indian Rupees (₹)
 * Uses Indian numbering system (lakhs, crores)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number in compact form (e.g., ₹1.5L, ₹2.3Cr)
 */
export function formatCompactCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format date for form inputs (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

/**
 * Get month name
 */
export function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return months[month - 1] || "";
}

/**
 * Get short month name
 */
export function getShortMonthName(month: number): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return months[month - 1] || "";
}

/**
 * Category color mapping for consistent visual identity
 */
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "Raw Materials": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Packaging": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  "Transportation": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "Marketing": { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  "Salaries": { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  "Utilities": { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
  "Rent": { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  "Equipment": { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  "Miscellaneous": { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" },
};

/**
 * Chart colors for Recharts
 */
export const CHART_COLORS = [
  "#1F4D3A", // Forest Green
  "#C86B45", // Terracotta
  "#D8A93A", // Golden Mustard
  "#2E7D55", // Success Green
  "#66736C", // Muted
  "#7C3AED", // Violet
  "#0891B2", // Cyan
  "#EA580C", // Orange
  "#DB2777", // Pink
];

/**
 * Payer color mapping
 */
export const PAYER_COLORS: Record<string, { bg: string; text: string }> = {
  Company: { bg: "bg-brand-green/10", text: "text-brand-green" },
  Anuj: { bg: "bg-brand-terracotta/10", text: "text-brand-terracotta" },
  Cash: { bg: "bg-brand-mustard/10", text: "text-amber-700" },
};

/**
 * Calculate percentage change between two values
 */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format file size from bytes
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

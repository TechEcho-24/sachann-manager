import mongoose, { Schema, Document, Model } from "mongoose";
import {
  EXPENSE_CATEGORIES,
  PAYERS,
  type ExpenseCategory,
  type Payer,
} from "@/lib/constants";

export { EXPENSE_CATEGORIES, PAYERS, type ExpenseCategory, type Payer };

export interface IReceiptImage {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface ILocation {
  type: "auto" | "manual";
  areaName?: string;
  mapLink?: string;
  lat?: number;
  lng?: number;
}

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidBy: Payer;
  date: Date;
  description?: string;
  vendor?: string;
  invoiceNumber?: string;
  receipts?: IReceiptImage[];
  location?: ILocation;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptImageSchema = new Schema<IReceiptImage>(
  {
    publicId: { type: String, required: true },
    secureUrl: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    format: { type: String, required: true },
    bytes: { type: Number, required: true },
  },
  { _id: false }
);

const ExpenseSchema = new Schema<IExpense>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: EXPENSE_CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
    },
    paidBy: {
      type: String,
      required: [true, "Paid by is required"],
      enum: {
        values: PAYERS,
        message: "{VALUE} is not a valid payer",
      },
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    vendor: {
      type: String,
      trim: true,
      maxlength: [200, "Vendor name cannot be more than 200 characters"],
    },
    invoiceNumber: {
      type: String,
      trim: true,
      maxlength: [100, "Invoice number cannot be more than 100 characters"],
    },
    receipts: {
      type: [ReceiptImageSchema],
      default: [],
    },
    location: {
      type: {
        type: String,
        enum: ["auto", "manual"],
      },
      areaName: String,
      mapLink: String,
      lat: Number,
      lng: Number,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ paidBy: 1 });
ExpenseSchema.index({ isArchived: 1 });
ExpenseSchema.index({ date: -1, isArchived: 1 });
ExpenseSchema.index({ category: 1, date: -1 });

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;

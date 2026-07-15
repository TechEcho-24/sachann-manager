import mongoose, { Schema, Document, Model } from "mongoose";
import { EXPENSE_CATEGORIES, PAYERS } from "@/lib/constants";

export type DraftStatus = "collecting" | "awaiting-confirmation" | "saved" | "cancelled";

export interface IExpenseDraft extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  conversationId: string;

  // Collected fields
  expenseName?: string;
  amount?: number;
  category?: string;
  paidBy?: string;
  dateMode?: "current" | "custom";
  customDateTime?: Date;

  // Optional fields
  purchasedFrom?: string;
  location?: string;
  notes?: string;
  receipts?: {
    publicId: string;
    secureUrl: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
  }[];

  // Current step in the flow
  currentStep: string;
  status: DraftStatus;
  idempotencyKey: string;

  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseDraftSchema = new Schema<IExpenseDraft>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
    },
    expenseName: String,
    amount: Number,
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
    },
    paidBy: {
      type: String,
      enum: PAYERS,
    },
    dateMode: {
      type: String,
      enum: ["current", "custom"],
      default: "current",
    },
    customDateTime: Date,
    purchasedFrom: String,
    location: String,
    notes: String,
    receipts: [
      {
        publicId: String,
        secureUrl: String,
        width: Number,
        height: Number,
        format: String,
        bytes: Number,
      }
    ],
    currentStep: {
      type: String,
      default: "name",
    },
    status: {
      type: String,
      enum: ["collecting", "awaiting-confirmation", "saved", "cancelled"],
      default: "collecting",
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

const ExpenseDraft: Model<IExpenseDraft> =
  mongoose.models.ExpenseDraft ||
  mongoose.model<IExpenseDraft>("ExpenseDraft", ExpenseDraftSchema);

export default ExpenseDraft;

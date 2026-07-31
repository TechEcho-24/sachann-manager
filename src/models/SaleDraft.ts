import mongoose, { Schema, Document, Model } from "mongoose";
import { SALES_PLATFORMS, type SalePlatform } from "@/lib/constants";

export interface ISaleDraft extends Document {
  userId: string;
  conversationId: string;
  amount?: number;
  platform?: SalePlatform;
  date?: Date;
  dateMode?: "current" | "custom";
  notes?: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const SaleDraftSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    conversationId: { type: String, required: true },
    amount: { type: Number },
    platform: { type: String, enum: Object.values(SALES_PLATFORMS) },
    date: { type: Date },
    dateMode: { type: String, enum: ["current", "custom"] },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const SaleDraft: Model<ISaleDraft> =
  mongoose.models.SaleDraft || mongoose.model<ISaleDraft>("SaleDraft", SaleDraftSchema);

export default SaleDraft;

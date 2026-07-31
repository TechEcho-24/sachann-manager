import mongoose, { Schema, Document, Model } from "mongoose";
import { SALES_PLATFORMS, type SalePlatform } from "@/lib/constants";

export interface ISale extends Document {
  amount: number;
  platform: SalePlatform;
  date: Date;
  notes?: string;
  isArchived: boolean;
  metadata?: {
    idempotencyKey?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema: Schema = new Schema(
  {
    amount: { type: Number, required: true },
    platform: { type: String, required: true, enum: Object.values(SALES_PLATFORMS) },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    isArchived: { type: Boolean, default: false },
    metadata: {
      idempotencyKey: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for search
SaleSchema.index({ notes: "text", platform: "text" });

const Sale: Model<ISale> = mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);

export default Sale;

import mongoose, { Schema, Document, Model } from "mongoose";
import { PAYERS, type Payer } from "@/lib/constants";

export interface IReimbursement extends Document {
  _id: mongoose.Types.ObjectId;
  amount: number;
  paidTo: Payer;
  date: Date;
  paymentMode?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReimbursementSchema = new Schema<IReimbursement>(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    paidTo: {
      type: String,
      required: [true, "Paid to is required"],
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
    paymentMode: {
      type: String,
      trim: true,
      maxlength: [100, "Payment mode cannot be more than 100 characters"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot be more than 500 characters"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
ReimbursementSchema.index({ date: -1 });
ReimbursementSchema.index({ paidTo: 1 });
ReimbursementSchema.index({ isArchived: 1 });

const Reimbursement: Model<IReimbursement> =
  mongoose.models.Reimbursement ||
  mongoose.model<IReimbursement>("Reimbursement", ReimbursementSchema);

export default Reimbursement;

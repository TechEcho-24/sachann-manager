import mongoose, { Schema, Document, Model } from "mongoose";
import { TASK_STATUSES, TASK_PRIORITIES, type TaskStatus, type TaskPriority } from "@/lib/constants";

export interface ITaskAttachment {
  publicId: string;
  secureUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  assignedTo: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  dueDate: Date;
  priority: TaskPriority;
  status: TaskStatus;
  attachments: ITaskAttachment[];
  isDeleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskAttachmentSchema = new Schema<ITaskAttachment>(
  {
    publicId: { type: String, required: true },
    secureUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [300, "Title too long"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Description too long"],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned user is required"],
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    priority: {
      type: String,
      required: true,
      enum: {
        values: TASK_PRIORITIES,
        message: "{VALUE} is not a valid priority",
      },
      default: "medium",
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: TASK_STATUSES,
        message: "{VALUE} is not a valid status",
      },
      default: "todo",
    },
    attachments: {
      type: [TaskAttachmentSchema],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ isDeleted: 1 });
TaskSchema.index({ assignedTo: 1, isDeleted: 1 });

const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

export default Task;

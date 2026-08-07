import mongoose, { Schema, Document, Model } from "mongoose";

export const NOTIFICATION_TYPES = [
  "task_assigned",
  "task_reassigned",
  "due_date_changed",
  "priority_changed",
  "status_changed",
  "new_comment",
  "task_due_soon",
  "task_overdue",
  "task_completed",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedTaskId?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: NOTIFICATION_TYPES,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedTaskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;

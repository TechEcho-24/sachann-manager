import mongoose, { Schema, Document, Model } from "mongoose";

export const ACTIVITY_ACTIONS = [
  "task_created",
  "task_edited",
  "task_assigned",
  "task_reassigned",
  "due_date_changed",
  "priority_changed",
  "status_changed",
  "attachment_uploaded",
  "attachment_removed",
  "comment_added",
  "task_completed",
  "task_deleted",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export interface ITaskActivity extends Document {
  _id: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  action: ActivityAction;
  previousValue?: string;
  newValue?: string;
  performedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const TaskActivitySchema = new Schema<ITaskActivity>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ACTIVITY_ACTIONS,
    },
    previousValue: String,
    newValue: String,
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

TaskActivitySchema.index({ taskId: 1, createdAt: -1 });

const TaskActivity: Model<ITaskActivity> =
  mongoose.models.TaskActivity || mongoose.model<ITaskActivity>("TaskActivity", TaskActivitySchema);

export default TaskActivity;

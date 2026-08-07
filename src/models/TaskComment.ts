import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITaskComment extends Document {
  _id: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskCommentSchema = new Schema<ITaskComment>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      maxlength: [2000, "Comment too long"],
    },
  },
  {
    timestamps: true,
  }
);

TaskCommentSchema.index({ taskId: 1, createdAt: -1 });

const TaskComment: Model<ITaskComment> =
  mongoose.models.TaskComment || mongoose.model<ITaskComment>("TaskComment", TaskCommentSchema);

export default TaskComment;

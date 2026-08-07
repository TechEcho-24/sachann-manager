"use server";

import connectDB from "@/lib/db";
import Task from "@/models/Task";
import TaskComment from "@/models/TaskComment";
import Notification, { type NotificationType } from "@/models/Notification";
import TaskActivity, { type ActivityAction } from "@/models/TaskActivity";
import User from "@/models/User";
import { requireRole } from "@/lib/auth-guard";
import { taskSchema } from "@/lib/validators";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, type TaskStatus, type TaskPriority } from "@/lib/constants";
import mongoose from "mongoose";
import type { UserRole } from "@/lib/roles";

// --- Serialized Types ---

export interface SerializedTask {
  _id: string;
  title: string;
  description?: string;
  assignedTo: { _id: string; name: string; email: string; role: string };
  assignedBy: { _id: string; name: string };
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  attachments: {
    publicId: string;
    secureUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string;
    uploadedAt: string;
  }[];
  isDeleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTasks {
  tasks: SerializedTask[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SerializedComment {
  _id: string;
  taskId: string;
  user: { _id: string; name: string; role: string };
  text: string;
  createdAt: string;
}

export interface SerializedActivity {
  _id: string;
  action: string;
  previousValue?: string;
  newValue?: string;
  performedBy: { _id: string; name: string };
  createdAt: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  blocked: number;
  in_review: number;
  done: number;
  cancelled: number;
  overdue: number;
}

// --- Helpers ---

function serializeTask(task: any): SerializedTask {
  return {
    _id: task._id.toString(),
    title: task.title,
    description: task.description,
    assignedTo: task.assignedTo
      ? { _id: task.assignedTo._id.toString(), name: task.assignedTo.name, email: task.assignedTo.email, role: task.assignedTo.role || "employee" }
      : { _id: "", name: "Unknown", email: "", role: "employee" },
    assignedBy: task.assignedBy
      ? { _id: task.assignedBy._id.toString(), name: task.assignedBy.name }
      : { _id: "", name: "Unknown" },
    dueDate: task.dueDate.toISOString(),
    priority: task.priority,
    status: task.status,
    attachments: (task.attachments || []).map((a: any) => ({
      publicId: a.publicId,
      secureUrl: a.secureUrl,
      fileName: a.fileName,
      fileType: a.fileType,
      fileSize: a.fileSize,
      uploadedBy: a.uploadedBy?.toString() || "",
      uploadedAt: a.uploadedAt?.toISOString() || "",
    })),
    isDeleted: task.isDeleted,
    completedAt: task.completedAt?.toISOString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedTaskId?: string;
}) {
  try {
    await Notification.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      type: data.type,
      title: data.title,
      message: data.message,
      relatedTaskId: data.relatedTaskId ? new mongoose.Types.ObjectId(data.relatedTaskId) : undefined,
    });
  } catch (e) {
    console.error("Failed to create notification:", e);
  }
}

async function logActivity(data: {
  taskId: string;
  action: ActivityAction;
  previousValue?: string;
  newValue?: string;
  performedBy: string;
}) {
  try {
    await TaskActivity.create({
      taskId: new mongoose.Types.ObjectId(data.taskId),
      action: data.action,
      previousValue: data.previousValue,
      newValue: data.newValue,
      performedBy: new mongoose.Types.ObjectId(data.performedBy),
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}

// --- CRUD ---

export async function getTasks(params: {
  search?: string;
  assignedTo?: string;
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedTasks> {
  const guard = await requireRole(["admin_manager", "manager", "employee"]);
  if ("error" in guard) return { tasks: [], total: 0, page: 1, totalPages: 0 };

  await connectDB();

  const { search, assignedTo, status, priority, page = 1, limit = 20 } = params;

  const filter: any = { isDeleted: false };

  // Employee can only see their own tasks
  if (guard.user.role === "employee") {
    filter.assignedTo = new mongoose.Types.ObjectId(guard.user.userId);
  } else if (assignedTo) {
    filter.assignedTo = new mongoose.Types.ObjectId(assignedTo);
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const total = await Task.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  const tasks = await Task.find(filter)
    .populate("assignedTo", "name email role")
    .populate("assignedBy", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    tasks: tasks.map(serializeTask),
    total,
    page,
    totalPages,
  };
}

export async function getTaskById(id: string): Promise<SerializedTask | null> {
  const guard = await requireRole(["admin_manager", "manager", "employee"]);
  if ("error" in guard) return null;

  await connectDB();

  const task = await Task.findById(id)
    .populate("assignedTo", "name email role")
    .populate("assignedBy", "name")
    .lean();

  if (!task || task.isDeleted) return null;

  // Employee can only see their own tasks
  if (guard.user.role === "employee" && task.assignedTo._id.toString() !== guard.user.userId) {
    return null;
  }

  return serializeTask(task);
}

export async function createTask(formData: FormData) {
  const guard = await requireRole(["admin_manager", "manager"]);
  if ("error" in guard) return { error: guard.error };

  const data = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    assignedTo: formData.get("assignedTo") as string,
    dueDate: formData.get("dueDate") as string,
    priority: formData.get("priority") as string,
    status: (formData.get("status") as string) || "todo",
  };

  const result = taskSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    await connectDB();

    const task = await Task.create({
      title: data.title,
      description: data.description || undefined,
      assignedTo: new mongoose.Types.ObjectId(data.assignedTo),
      assignedBy: new mongoose.Types.ObjectId(guard.user.userId),
      dueDate: new Date(data.dueDate),
      priority: data.priority as TaskPriority,
      status: (data.status || "todo") as TaskStatus,
    });

    // Log activity
    await logActivity({
      taskId: task._id.toString(),
      action: "task_created",
      newValue: data.title,
      performedBy: guard.user.userId,
    });

    // Notify assigned user
    const assignee = await User.findById(data.assignedTo).select("name").lean();
    await createNotification({
      userId: data.assignedTo,
      type: "task_assigned",
      title: "New Task Assigned",
      message: `"${data.title}" has been assigned to you by ${guard.user.name}.`,
      relatedTaskId: task._id.toString(),
    });

    return { success: true, taskId: task._id.toString() };
  } catch {
    return { error: "Failed to create task. Please try again." };
  }
}

export async function updateTask(id: string, formData: FormData) {
  const guard = await requireRole(["admin_manager", "manager", "employee"]);
  if ("error" in guard) return { error: guard.error };

  await connectDB();

  const task = await Task.findById(id);
  if (!task || task.isDeleted) return { error: "Task not found." };

  // Employee can only update status of their own tasks
  if (guard.user.role === "employee") {
    if (task.assignedTo.toString() !== guard.user.userId) {
      return { error: "You can only update your own tasks." };
    }

    const newStatus = formData.get("status") as TaskStatus;
    if (!newStatus) return { error: "Status is required." };

    const oldStatus = task.status;
    task.status = newStatus;

    if (newStatus === "done" && oldStatus !== "done") {
      task.completedAt = new Date();
    }

    await task.save();

    await logActivity({
      taskId: id,
      action: "status_changed",
      previousValue: TASK_STATUS_LABELS[oldStatus as TaskStatus],
      newValue: TASK_STATUS_LABELS[newStatus],
      performedBy: guard.user.userId,
    });

    // Notify managers about status change
    const managers = await User.find({ role: { $in: ["admin_manager", "manager"] }, isActive: true }).select("_id").lean();
    for (const mgr of managers) {
      await createNotification({
        userId: mgr._id.toString(),
        type: "status_changed",
        title: "Task Status Updated",
        message: `"${task.title}" status changed from ${TASK_STATUS_LABELS[oldStatus as TaskStatus]} to ${TASK_STATUS_LABELS[newStatus]} by ${guard.user.name}.`,
        relatedTaskId: id,
      });
    }

    return { success: true };
  }

  // Manager / Admin+Manager can edit everything
  const data = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    assignedTo: formData.get("assignedTo") as string,
    dueDate: formData.get("dueDate") as string,
    priority: formData.get("priority") as string,
    status: formData.get("status") as string,
  };

  // Track changes
  if (data.title && data.title !== task.title) {
    await logActivity({ taskId: id, action: "task_edited", previousValue: task.title, newValue: data.title, performedBy: guard.user.userId });
    task.title = data.title;
  }

  if (data.description !== undefined) {
    task.description = data.description || undefined;
  }

  if (data.assignedTo && data.assignedTo !== task.assignedTo.toString()) {
    const prevUser = await User.findById(task.assignedTo).select("name").lean();
    const newUser = await User.findById(data.assignedTo).select("name").lean();

    await logActivity({
      taskId: id,
      action: "task_reassigned",
      previousValue: prevUser?.name || "Unknown",
      newValue: newUser?.name || "Unknown",
      performedBy: guard.user.userId,
    });

    // Notify new assignee
    await createNotification({
      userId: data.assignedTo,
      type: "task_reassigned",
      title: "Task Reassigned to You",
      message: `"${task.title}" has been reassigned to you by ${guard.user.name}.`,
      relatedTaskId: id,
    });

    task.assignedTo = new mongoose.Types.ObjectId(data.assignedTo);
  }

  if (data.dueDate) {
    const newDue = new Date(data.dueDate);
    if (newDue.toISOString() !== task.dueDate.toISOString()) {
      await logActivity({ taskId: id, action: "due_date_changed", previousValue: task.dueDate.toISOString().split("T")[0], newValue: data.dueDate, performedBy: guard.user.userId });

      await createNotification({
        userId: task.assignedTo.toString(),
        type: "due_date_changed",
        title: "Due Date Changed",
        message: `Due date for "${task.title}" changed to ${data.dueDate}.`,
        relatedTaskId: id,
      });

      task.dueDate = newDue;
    }
  }

  if (data.priority && data.priority !== task.priority) {
    await logActivity({ taskId: id, action: "priority_changed", previousValue: TASK_PRIORITY_LABELS[task.priority as TaskPriority], newValue: TASK_PRIORITY_LABELS[data.priority as TaskPriority], performedBy: guard.user.userId });

    await createNotification({
      userId: task.assignedTo.toString(),
      type: "priority_changed",
      title: "Priority Changed",
      message: `Priority for "${task.title}" changed to ${TASK_PRIORITY_LABELS[data.priority as TaskPriority]}.`,
      relatedTaskId: id,
    });

    task.priority = data.priority as TaskPriority;
  }

  if (data.status && data.status !== task.status) {
    const oldStatus = task.status;
    await logActivity({ taskId: id, action: "status_changed", previousValue: TASK_STATUS_LABELS[oldStatus as TaskStatus], newValue: TASK_STATUS_LABELS[data.status as TaskStatus], performedBy: guard.user.userId });
    task.status = data.status as TaskStatus;

    if (data.status === "done" && oldStatus !== "done") {
      task.completedAt = new Date();
    }
  }

  await task.save();
  return { success: true };
}

export async function deleteTask(id: string) {
  const guard = await requireRole(["admin_manager", "manager"]);
  if ("error" in guard) return { error: guard.error };

  try {
    await connectDB();

    const task = await Task.findById(id);
    if (!task) return { error: "Task not found." };

    task.isDeleted = true;
    await task.save();

    await logActivity({
      taskId: id,
      action: "task_deleted",
      newValue: task.title,
      performedBy: guard.user.userId,
    });

    return { success: true };
  } catch {
    return { error: "Failed to delete task." };
  }
}

// --- Comments ---

export async function getTaskComments(taskId: string): Promise<SerializedComment[]> {
  const guard = await requireRole(["admin_manager", "manager", "employee"]);
  if ("error" in guard) return [];

  await connectDB();

  // Employee check
  if (guard.user.role === "employee") {
    const task = await Task.findById(taskId).select("assignedTo").lean();
    if (!task || task.assignedTo.toString() !== guard.user.userId) return [];
  }

  const comments = await TaskComment.find({ taskId })
    .populate("userId", "name role")
    .sort({ createdAt: 1 })
    .lean();

  return comments.map((c: any) => ({
    _id: c._id.toString(),
    taskId: c.taskId.toString(),
    user: {
      _id: c.userId._id.toString(),
      name: c.userId.name,
      role: c.userId.role || "employee",
    },
    text: c.text,
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function addTaskComment(taskId: string, text: string) {
  const guard = await requireRole(["admin_manager", "manager", "employee"]);
  if ("error" in guard) return { error: guard.error };

  if (!text?.trim()) return { error: "Comment text is required." };

  await connectDB();

  // Employee check
  if (guard.user.role === "employee") {
    const task = await Task.findById(taskId).select("assignedTo").lean();
    if (!task || task.assignedTo.toString() !== guard.user.userId) {
      return { error: "You can only comment on your own tasks." };
    }
  }

  try {
    const comment = await TaskComment.create({
      taskId: new mongoose.Types.ObjectId(taskId),
      userId: new mongoose.Types.ObjectId(guard.user.userId),
      text: text.trim(),
    });

    await logActivity({
      taskId,
      action: "comment_added",
      newValue: text.trim().substring(0, 100),
      performedBy: guard.user.userId,
    });

    // Notify task assignee (if commenter is not the assignee)
    const task = await Task.findById(taskId).select("assignedTo title").lean();
    if (task && task.assignedTo.toString() !== guard.user.userId) {
      await createNotification({
        userId: task.assignedTo.toString(),
        type: "new_comment",
        title: "New Comment",
        message: `${guard.user.name} commented on "${task.title}": "${text.trim().substring(0, 80)}..."`,
        relatedTaskId: taskId,
      });
    }

    return { success: true, commentId: comment._id.toString() };
  } catch {
    return { error: "Failed to add comment." };
  }
}

// --- Activity ---

export async function getTaskActivity(taskId: string): Promise<SerializedActivity[]> {
  const guard = await requireRole(["admin_manager", "manager", "employee"]);
  if ("error" in guard) return [];

  await connectDB();

  // Employee check
  if (guard.user.role === "employee") {
    const task = await Task.findById(taskId).select("assignedTo").lean();
    if (!task || task.assignedTo.toString() !== guard.user.userId) return [];
  }

  const activities = await TaskActivity.find({ taskId })
    .populate("performedBy", "name")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return activities.map((a: any) => ({
    _id: a._id.toString(),
    action: a.action,
    previousValue: a.previousValue,
    newValue: a.newValue,
    performedBy: {
      _id: a.performedBy._id.toString(),
      name: a.performedBy.name,
    },
    createdAt: a.createdAt.toISOString(),
  }));
}

// --- Stats ---

export async function getTaskStats(userId?: string): Promise<TaskStats> {
  await connectDB();

  const match: any = { isDeleted: false };
  if (userId) {
    match.assignedTo = new mongoose.Types.ObjectId(userId);
  }

  const now = new Date();

  const [statusCounts, overdueCount] = await Promise.all([
    Task.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Task.countDocuments({
      ...match,
      status: { $nin: ["done", "cancelled"] },
      dueDate: { $lt: now },
    }),
  ]);

  const stats: TaskStats = {
    total: 0,
    todo: 0,
    in_progress: 0,
    blocked: 0,
    in_review: 0,
    done: 0,
    cancelled: 0,
    overdue: overdueCount,
  };

  for (const s of statusCounts) {
    const key = s._id as keyof TaskStats;
    if (key in stats) {
      (stats as any)[key] = s.count;
    }
    stats.total += s.count;
  }

  return stats;
}

export async function getTeamProgress(): Promise<{
  employees: {
    _id: string;
    name: string;
    total: number;
    done: number;
    inProgress: number;
    overdue: number;
  }[];
}> {
  const guard = await requireRole(["admin_manager", "manager"]);
  if ("error" in guard) return { employees: [] };

  await connectDB();

  const now = new Date();

  const employees = await User.find({
    isActive: true,
  }).select("name role").lean();

  const result = [];

  for (const emp of employees) {
    const match = { assignedTo: emp._id, isDeleted: false };
    const [total, done, inProgress, overdue] = await Promise.all([
      Task.countDocuments(match),
      Task.countDocuments({ ...match, status: "done" }),
      Task.countDocuments({ ...match, status: "in_progress" }),
      Task.countDocuments({ ...match, status: { $nin: ["done", "cancelled"] }, dueDate: { $lt: now } }),
    ]);

    result.push({
      _id: emp._id.toString(),
      name: emp.name,
      total,
      done,
      inProgress,
      overdue,
    });
  }

  return { employees: result.sort((a, b) => b.total - a.total) };
}

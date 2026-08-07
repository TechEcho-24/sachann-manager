"use server";

import connectDB from "@/lib/db";
import Notification from "@/models/Notification";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";

export interface SerializedNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  relatedTaskId?: string;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(params: {
  page?: number;
  limit?: number;
}): Promise<{ notifications: SerializedNotification[]; total: number; unreadCount: number }> {
  const session = await auth();
  if (!session?.user?.id) return { notifications: [], total: 0, unreadCount: 0 };

  await connectDB();

  const userId = new mongoose.Types.ObjectId(session.user.id);
  const { page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId }),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    notifications: notifications.map((n: any) => ({
      _id: n._id.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      relatedTaskId: n.relatedTaskId?.toString(),
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
    total,
    unreadCount,
  };
}

export async function getUnreadCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;

  await connectDB();
  return Notification.countDocuments({
    userId: new mongoose.Types.ObjectId(session.user.id),
    isRead: false,
  });
}

export async function markAsRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await connectDB();
  await Notification.findOneAndUpdate(
    { _id: id, userId: new mongoose.Types.ObjectId(session.user.id) },
    { isRead: true }
  );

  return { success: true };
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await connectDB();
  await Notification.updateMany(
    { userId: new mongoose.Types.ObjectId(session.user.id), isRead: false },
    { isRead: true }
  );

  return { success: true };
}

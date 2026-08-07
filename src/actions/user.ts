"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import { requireRole } from "@/lib/auth-guard";
import { createUserSchema, updateUserSchema, resetPasswordSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";
import type { UserRole } from "@/lib/roles";

export interface SerializedUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsers {
  users: SerializedUser[];
  total: number;
  page: number;
  totalPages: number;
}

function serializeUser(user: any): SerializedUser {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role || "admin",
    isActive: user.isActive ?? true,
    mustChangePassword: user.mustChangePassword ?? false,
    lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function getUsers(params: {
  search?: string;
  role?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedUsers> {
  const guard = await requireRole(["admin_manager"]);
  if ("error" in guard) {
    return { users: [], total: 0, page: 1, totalPages: 0 };
  }

  await connectDB();

  const { search, role, isActive, page = 1, limit = 20 } = params;

  const filter: any = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (role) {
    filter.role = role;
  }

  if (isActive === "true") {
    filter.isActive = true;
  } else if (isActive === "false") {
    filter.isActive = false;
  }

  const total = await User.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    users: users.map(serializeUser),
    total,
    page,
    totalPages,
  };
}

export async function getUserById(id: string): Promise<SerializedUser | null> {
  const guard = await requireRole(["admin_manager"]);
  if ("error" in guard) return null;

  await connectDB();
  const user = await User.findById(id).select("-password").lean();
  if (!user) return null;
  return serializeUser(user);
}

export async function createUser(formData: FormData) {
  const guard = await requireRole(["admin_manager"]);
  if ("error" in guard) return { error: guard.error };

  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    role: formData.get("role") as string,
    isActive: formData.get("isActive") === "true",
  };

  const result = createUserSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    await connectDB();

    // Check unique email
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      return { error: "A user with this email already exists." };
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      role: data.role as UserRole,
      isActive: data.isActive,
      mustChangePassword: false,
    });

    return { success: true, userId: user._id.toString() };
  } catch {
    return { error: "Failed to create user. Please try again." };
  }
}

export async function updateUser(id: string, formData: FormData) {
  const guard = await requireRole(["admin_manager"]);
  if ("error" in guard) return { error: guard.error };

  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    role: formData.get("role") as string,
  };

  const result = updateUserSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    await connectDB();

    // Check unique email (excluding current user)
    const existing = await User.findOne({
      email: data.email.toLowerCase(),
      _id: { $ne: id },
    });
    if (existing) {
      return { error: "A user with this email already exists." };
    }

    await User.findByIdAndUpdate(id, {
      name: data.name,
      email: data.email.toLowerCase(),
      role: data.role,
    });

    return { success: true };
  } catch {
    return { error: "Failed to update user. Please try again." };
  }
}

export async function toggleUserActive(id: string) {
  const guard = await requireRole(["admin_manager"]);
  if ("error" in guard) return { error: guard.error };

  try {
    await connectDB();

    // Self-protection
    if (id === guard.user.userId) {
      return { error: "You cannot deactivate your own account." };
    }

    const user = await User.findById(id);
    if (!user) return { error: "User not found." };

    user.isActive = !user.isActive;
    await user.save();

    return { success: true, isActive: user.isActive };
  } catch {
    return { error: "Failed to update user status." };
  }
}

export async function deleteUser(id: string) {
  const guard = await requireRole(["admin_manager"]);
  if ("error" in guard) return { error: guard.error };

  try {
    await connectDB();

    if (id === guard.user.userId) {
      return { error: "You cannot delete your own account." };
    }

    const user = await User.findById(id);
    if (!user) return { error: "User not found." };

    // Soft delete — deactivate instead of removing
    user.isActive = false;
    await user.save();

    return { success: true };
  } catch {
    return { error: "Failed to delete user." };
  }
}

export async function resetUserPassword(id: string, formData: FormData) {
  const guard = await requireRole(["admin_manager"]);
  if ("error" in guard) return { error: guard.error };

  const data = {
    newPassword: formData.get("newPassword") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = resetPasswordSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    await connectDB();

    const user = await User.findById(id);
    if (!user) return { error: "User not found." };

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(data.newPassword, salt);
    user.mustChangePassword = false;
    await user.save();

    return { success: true };
  } catch {
    return { error: "Failed to reset password." };
  }
}

/**
 * Get list of active employees (and optionally managers) for task assignment dropdowns
 */
export async function getAssignableUsers(): Promise<{ _id: string; name: string; email: string; role: UserRole }[]> {
  await connectDB();

  const users = await User.find({
    isActive: true,
  })
    .select("name email role")
    .sort({ name: 1 })
    .lean();

  return users.map((u: any) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role as UserRole,
  }));
}

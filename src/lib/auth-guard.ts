"use server";

import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import type { UserRole } from "@/lib/roles";

export interface AuthUser {
  userId: string;
  role: UserRole;
  name: string;
  email: string;
}

/**
 * Server-side auth guard. Checks that the user is authenticated
 * and has one of the allowed roles.
 * Returns the user info or an error string.
 */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<{ user: AuthUser } | { error: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized. Please log in." };
  }

  await connectDB();
  const user = await User.findById(session.user.id).select("role isActive name email").lean();

  if (!user) {
    return { error: "User not found." };
  }

  if (!user.isActive) {
    return { error: "Your account has been deactivated. Contact your administrator." };
  }

  const role = (user.role || "admin") as UserRole; // Fallback for old users without role

  if (!allowedRoles.includes(role)) {
    return { error: "You do not have permission to perform this action." };
  }

  return {
    user: {
      userId: user._id.toString(),
      role,
      name: user.name,
      email: user.email,
    },
  };
}

/**
 * Get current authenticated user info (no role restriction).
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  await connectDB();
  const user = await User.findById(session.user.id).select("role isActive name email").lean();

  if (!user || !user.isActive) {
    return null;
  }

  return {
    userId: user._id.toString(),
    role: (user.role || "admin") as UserRole,
    name: user.name,
    email: user.email,
  };
}

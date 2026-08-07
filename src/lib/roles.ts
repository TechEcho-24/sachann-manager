// Role definitions and permission utilities
// These are separated from Mongoose models to avoid importing Mongoose in client components

export const USER_ROLES = ["admin", "admin_manager", "manager", "employee"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  admin_manager: "Super Admin",
  manager: "Manager",
  employee: "Employee",
};

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  admin: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20" },
  admin_manager: { bg: "bg-violet-500/10", text: "text-violet-600", border: "border-violet-500/20" },
  manager: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" },
  employee: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
};

// Role groups for permission checks
export const FINANCIAL_ROLES: UserRole[] = ["admin", "admin_manager"];
export const TASK_ROLES: UserRole[] = ["admin_manager", "manager", "employee"];
export const TASK_MANAGEMENT_ROLES: UserRole[] = ["admin_manager", "manager"];
export const USER_MGMT_ROLES: UserRole[] = ["admin_manager"];

// Permission helpers
export function canAccessFinancials(role: UserRole): boolean {
  return FINANCIAL_ROLES.includes(role);
}

export function canAccessTasks(role: UserRole): boolean {
  return TASK_ROLES.includes(role);
}

export function canManageUsers(role: UserRole): boolean {
  return USER_MGMT_ROLES.includes(role);
}

export function canManageTasks(role: UserRole): boolean {
  return TASK_MANAGEMENT_ROLES.includes(role);
}

export function canCreateTasks(role: UserRole): boolean {
  return TASK_MANAGEMENT_ROLES.includes(role);
}

export function canEditTaskDetails(role: UserRole): boolean {
  return TASK_MANAGEMENT_ROLES.includes(role);
}

export function canDeleteTasks(role: UserRole): boolean {
  return TASK_MANAGEMENT_ROLES.includes(role);
}

export function canReassignTasks(role: UserRole): boolean {
  return TASK_MANAGEMENT_ROLES.includes(role);
}

// Employee can only update task status
export function canOnlyUpdateStatus(role: UserRole): boolean {
  return role === "employee";
}

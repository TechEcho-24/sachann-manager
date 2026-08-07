"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Shield, ShieldCheck, ShieldX, Loader2, KeyRound, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleBadge } from "@/components/users/RoleBadge";
import { cn } from "@/lib/utils";
import { getUsers, toggleUserActive, deleteUser, resetUserPassword, type PaginatedUsers } from "@/actions/user";
import { USER_ROLES, ROLE_LABELS, type UserRole } from "@/lib/roles";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reset password modal
  const [resetModal, setResetModal] = useState<{ userId: string; userName: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter || undefined,
        page,
        limit: 20,
      });
      setData(result);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function handleToggleActive(userId: string, currentName: string, isActive: boolean) {
    if (!confirm(`Are you sure you want to ${isActive ? "deactivate" : "activate"} ${currentName}?`)) return;
    setActionLoading(userId);
    try {
      const result = await toggleUserActive(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`User ${result.isActive ? "activated" : "deactivated"} successfully`);
        fetchUsers();
      }
    } catch {
      toast.error("Failed to update user status");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to deactivate ${userName}? Their account access will be removed.`)) return;
    setActionLoading(userId);
    try {
      const result = await deleteUser(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("User deactivated successfully");
        fetchUsers();
      }
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resetModal) return;
    setResetLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await resetUserPassword(resetModal.userId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Password reset successfully");
        setResetModal(null);
      }
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage team members and their roles
          </p>
        </div>
        <Link href="/users/new">
          <Button className="h-10 rounded-xl bg-brand-green hover:bg-brand-green-light text-white gap-2">
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Role filter */}
          <button
            onClick={() => setRoleFilter("")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              !roleFilter
                ? "border-brand-green bg-brand-green/10 text-brand-green"
                : "border-border bg-card text-muted-foreground hover:border-brand-green/40"
            )}
          >
            All Roles
          </button>
          {USER_ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                roleFilter === r
                  ? "border-brand-green bg-brand-green/10 text-brand-green"
                  : "border-border bg-card text-muted-foreground hover:border-brand-green/40"
              )}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}

          <div className="w-px bg-border mx-1" />

          {/* Status filter */}
          <button
            onClick={() => setStatusFilter("")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              !statusFilter
                ? "border-brand-green bg-brand-green/10 text-brand-green"
                : "border-border bg-card text-muted-foreground hover:border-brand-green/40"
            )}
          >
            All Status
          </button>
          <button
            onClick={() => setStatusFilter("true")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              statusFilter === "true"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                : "border-border bg-card text-muted-foreground hover:border-emerald-500/40"
            )}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter("false")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              statusFilter === "false"
                ? "border-red-500 bg-red-500/10 text-red-600"
                : "border-border bg-card text-muted-foreground hover:border-red-500/40"
            )}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* User List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[80px] rounded-2xl" />
          ))}
        </div>
      ) : !data || data.users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No users found</p>
          <p className="text-xs mt-1">Try adjusting your filters or add a new user.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.users.map((u) => (
            <div
              key={u._id}
              className={cn(
                "bg-card rounded-2xl border border-border p-4 transition-all hover:shadow-sm",
                !u.isActive && "opacity-60"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                    u.isActive ? "bg-brand-green/10 text-brand-green" : "bg-muted text-muted-foreground"
                  )}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{u.name}</p>
                      <RoleBadge role={u.role} />
                      {!u.isActive && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                    {u.lastLogin && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Last login: {formatDistanceToNow(new Date(u.lastLogin), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/users/${u._id}/edit`}>
                    <Button variant="outline" size="sm" className="rounded-xl h-8 text-xs">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-8 text-xs gap-1"
                    onClick={() => setResetModal({ userId: u._id, userName: u.name })}
                  >
                    <KeyRound className="w-3 h-3" />
                    Reset Password
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading === u._id}
                    onClick={() => handleToggleActive(u._id, u.name, u.isActive)}
                    className={cn(
                      "rounded-xl h-8 text-xs gap-1",
                      u.isActive
                        ? "text-red-600 hover:bg-red-50"
                        : "text-emerald-600 hover:bg-emerald-50"
                    )}
                  >
                    {actionLoading === u._id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : u.isActive ? (
                      <ShieldX className="w-3 h-3" />
                    ) : (
                      <ShieldCheck className="w-3 h-3" />
                    )}
                    {u.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-xl h-8"
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-xl h-8"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-semibold text-foreground mb-1">Reset Password</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Set a new password for <span className="font-medium">{resetModal.userName}</span>
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">New Password</Label>
                <Input
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Min 8 chars, uppercase, lowercase, number, special"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Confirm Password</Label>
                <Input
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Re-enter password"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={resetLoading}
                  className="h-10 rounded-xl bg-brand-green hover:bg-brand-green-light text-white"
                >
                  {resetLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Reset Password
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetModal(null)}
                  className="h-10 rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Need Label import for the modal
function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { className?: string }) {
  return <label className={cn("text-sm font-medium", className)} {...props} />;
}

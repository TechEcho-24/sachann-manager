"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, ListTodo, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskRow } from "@/components/tasks/TaskRow";
import { getTasks, type PaginatedTasks } from "@/actions/task";
import { getAssignableUsers } from "@/actions/user";
import { ROLE_LABELS, type UserRole } from "@/lib/roles";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TasksClientProps {
  canCreate: boolean;
  userRole: UserRole;
}

export function TasksClient({ canCreate, userRole }: TasksClientProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaginatedTasks | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<{ _id: string; name: string; role?: UserRole }[]>([]);

  useEffect(() => {
    async function loadTeam() {
      try {
        const team = await getAssignableUsers();
        setUsers(team);
      } catch (err) {
        console.error("Failed to load assignees", err);
      }
    }
    loadTeam();
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTasks({
        search: search || undefined,
        status: status || undefined,
        priority: priority || undefined,
        assignedTo: assignedTo || undefined,
        page,
        limit: 20,
      });
      setData(result);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [search, status, priority, assignedTo, page]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Task Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track daily work, team assignments, and progress
          </p>
        </div>
        {canCreate && (
          <Link href="/tasks/new">
            <Button className="h-10 rounded-xl bg-brand-green hover:bg-brand-green-light text-white gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              Create Task
            </Button>
          </Link>
        )}
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-card p-3 sm:p-4 rounded-2xl border border-border shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className={cn(
            userRole === "employee" ? "lg:col-span-6" : "lg:col-span-4"
          )}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-xl pl-9 text-xs sm:text-sm w-full"
            />
          </div>

          {/* Team Member Dropdown (Hidden for employees) */}
          {userRole !== "employee" && (
            <div className="lg:col-span-3">
              <select
                value={assignedTo}
                onChange={(e) => {
                  setAssignedTo(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-green/20"
              >
                <option value="">All Team Members</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} {u.role ? `(${ROLE_LABELS[u.role] || u.role})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Dropdown */}
          <div className={cn(
            userRole === "employee" ? "lg:col-span-3" : "lg:col-span-2"
          )}>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            >
              <option value="">All Statuses</option>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            >
              <option value="">All Priorities</option>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button (Always in DOM with opacity-0 to prevent layout shifting) */}
          <div className="lg:col-span-1 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatus("");
                setPriority("");
                setAssignedTo("");
                setPage(1);
              }}
              className={cn(
                "h-10 px-2 rounded-xl text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 w-full lg:w-auto font-medium transition-all duration-150",
                (search || status || priority || assignedTo)
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none select-none"
              )}
              title="Clear all filters"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !data || data.tasks.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border text-muted-foreground">
          <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">No tasks found</p>
          <p className="text-xs mt-1">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Tasks Section */}
          {(status === "" || status !== "done") && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-foreground">Active Tasks</h2>
              {data.tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-6 text-center text-xs text-muted-foreground shadow-sm">
                  No active tasks found.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.tasks
                    .filter((t) => t.status !== "done" && t.status !== "cancelled")
                    .map((task) => (
                      <TaskRow key={task._id} task={task} onStatusChange={fetchTasks} />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Completed Tasks Section */}
          {(status === "" || status === "done") && (
            <div className="space-y-3 pt-2">
              <h2 className="text-base font-bold text-foreground">Completed Tasks</h2>
              {data.tasks.filter((t) => t.status === "done").length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-6 text-center text-xs text-muted-foreground shadow-sm">
                  No completed tasks found.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.tasks
                    .filter((t) => t.status === "done")
                    .map((task) => (
                      <TaskRow key={task._id} task={task} onStatusChange={fetchTasks} />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-xl h-8 text-xs"
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
                className="rounded-xl h-8 text-xs"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

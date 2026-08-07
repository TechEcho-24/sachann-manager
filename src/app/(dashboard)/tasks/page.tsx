"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Filter, CheckSquare, ListTodo, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskCard } from "@/components/tasks/TaskCard";
import { getTasks, type PaginatedTasks } from "@/actions/task";
import { getAssignableUsers } from "@/actions/user";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaginatedTasks | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);

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
        <Link href="/tasks/new">
          <Button className="h-10 rounded-xl bg-brand-green hover:bg-brand-green-light text-white gap-2">
            <Plus className="w-4 h-4" />
            Create Task
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="space-y-3 bg-card p-4 rounded-2xl border border-border">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-xl pl-10"
            />
          </div>

          {users.length > 0 && (
            <select
              value={assignedTo}
              onChange={(e) => {
                setAssignedTo(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            >
              <option value="">All Team Members</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-muted-foreground font-medium mr-1 shrink-0">Status:</span>
          <button
            onClick={() => {
              setStatus("");
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg border transition-all shrink-0",
              !status
                ? "border-brand-green bg-brand-green/10 text-brand-green font-semibold"
                : "border-border bg-background text-muted-foreground hover:border-brand-green/40"
            )}
          >
            All
          </button>
          {TASK_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg border transition-all shrink-0",
                status === s
                  ? "border-brand-green bg-brand-green/10 text-brand-green font-semibold"
                  : "border-border bg-background text-muted-foreground hover:border-brand-green/40"
              )}
            >
              {TASK_STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Priority Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-muted-foreground font-medium mr-1 shrink-0">Priority:</span>
          <button
            onClick={() => {
              setPriority("");
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg border transition-all shrink-0",
              !priority
                ? "border-brand-green bg-brand-green/10 text-brand-green font-semibold"
                : "border-border bg-background text-muted-foreground hover:border-brand-green/40"
            )}
          >
            All
          </button>
          {TASK_PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPriority(p);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg border transition-all shrink-0 capitalize",
                priority === p
                  ? "border-brand-green bg-brand-green/10 text-brand-green font-semibold"
                  : "border-border bg-background text-muted-foreground hover:border-brand-green/40"
              )}
            >
              {TASK_PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Task List Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[160px] rounded-2xl" />
          ))}
        </div>
      ) : !data || data.tasks.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border text-muted-foreground">
          <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">No tasks found</p>
          <p className="text-xs mt-1">Try adjusting your filters or create a new task.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.tasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>

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

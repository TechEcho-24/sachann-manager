"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ListTodo, CheckCircle2, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskSummaryCards } from "@/components/dashboard/TaskSummaryCards";
import { getTasks, getTaskStats, type SerializedTask, type TaskStats } from "@/actions/task";
import { Skeleton } from "@/components/ui/skeleton";

interface EmployeeTaskDashboardProps {
  userId: string;
  userName: string;
}

export function EmployeeTaskDashboard({ userId, userName }: EmployeeTaskDashboardProps) {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [tasks, setTasks] = useState<SerializedTask[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, tasksData] = await Promise.all([
        getTaskStats(userId),
        getTasks({ assignedTo: userId, limit: 6 }),
      ]);
      setStats(statsData);
      setTasks(tasksData.tasks);
    } catch (err) {
      console.error("Failed to load employee dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Hello, {userName}! 👋</h1>
          <p className="text-emerald-200 text-xs sm:text-sm mt-1">
            Here is your assigned tasks and work checklist for today.
          </p>
        </div>
        <Link href="/tasks">
          <Button variant="secondary" className="rounded-xl text-xs font-semibold gap-1.5 shadow-sm">
            View All My Tasks
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Task Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[90px] rounded-2xl" />
          ))}
        </div>
      ) : (
        stats && <TaskSummaryCards stats={stats} title="My Task Summary" />
      )}

      {/* Active Tasks Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">My Active Tasks</h2>
          <Link href="/tasks" className="text-xs font-medium text-brand-green hover:underline">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[140px] rounded-2xl" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500/50" />
            <p className="text-sm font-medium">No tasks assigned right now!</p>
            <p className="text-xs mt-0.5">Enjoy your day or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((t) => (
              <TaskCard key={t._id} task={t} isEmployeeView />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

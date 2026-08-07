"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Users, CheckSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskSummaryCards } from "@/components/dashboard/TaskSummaryCards";
import { TeamProgress } from "@/components/dashboard/TeamProgress";
import {
  getTasks,
  getTaskStats,
  getTeamProgress,
  type SerializedTask,
  type TaskStats,
} from "@/actions/task";
import { Skeleton } from "@/components/ui/skeleton";

interface ManagerTaskDashboardProps {
  userName: string;
}

export function ManagerTaskDashboard({ userName }: ManagerTaskDashboardProps) {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [tasks, setTasks] = useState<SerializedTask[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, tasksData, teamData] = await Promise.all([
        getTaskStats(),
        getTasks({ limit: 50 }),
        getTeamProgress(),
      ]);
      setStats(statsData);
      setTasks(tasksData.tasks);
      setTeam(teamData.employees);
    } catch (err) {
      console.error("Failed to load manager dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const completedTasks = tasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Welcome, {userName}! 📋</h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Manage team assignments, monitor deadlines, and track operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tasks/new">
            <Button className="rounded-xl bg-brand-green hover:bg-brand-green-light text-white text-xs font-semibold gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </Link>
          <Link href="/tasks">
            <Button variant="outline" className="rounded-xl text-xs font-semibold gap-1 text-black bg-white/90 hover:bg-white">
              All Tasks
            </Button>
          </Link>
        </div>
      </div>

      {/* Task Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[90px] rounded-2xl" />
          ))}
        </div>
      ) : (
        stats && <TaskSummaryCards stats={stats} title="Company Task Overview" />
      )}

      {/* Two Column Grid: Team Progress & Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Progress */}
        <div className="lg:col-span-1">
          {loading ? (
            <Skeleton className="h-[280px] rounded-2xl" />
          ) : (
            <TeamProgress employees={team} />
          )}
        </div>

        {/* Tasks Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Active Tasks</h2>
              <Link href="/tasks" className="text-xs font-medium text-brand-green hover:underline">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : activeTasks.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground shadow-sm">
                <CheckSquare className="w-10 h-10 mx-auto mb-2 text-emerald-500/50" />
                <p className="text-sm font-medium">No active tasks right now!</p>
                <p className="text-xs mt-0.5">Click "New Task" above to assign work.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeTasks.map((t) => (
                  <TaskRow key={t._id} task={t} onStatusChange={loadData} />
                ))}
              </div>
            )}
          </div>

          {/* Completed Tasks */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Completed Tasks</h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : completedTasks.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground shadow-sm">
                <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No completed tasks yet.</p>
                <p className="text-xs mt-0.5">Finished tasks will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {completedTasks.map((t) => (
                  <TaskRow key={t._id} task={t} onStatusChange={loadData} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

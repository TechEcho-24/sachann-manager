"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/constants";
import { createTask, updateTask, type SerializedTask } from "@/actions/task";
import { getAssignableUsers } from "@/actions/user";
import { ROLE_LABELS, type UserRole } from "@/lib/roles";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskFormProps {
  task?: SerializedTask;
}

export function TaskForm({ task }: TaskFormProps) {
  const router = useRouter();
  const isEditing = !!task;

  const [isLoading, setIsLoading] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<
    { _id: string; name: string; email: string; role: string }[]
  >([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [assignedTo, setAssignedTo] = useState(task?.assignedTo?._id || "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || "medium");
  const [status, setStatus] = useState<TaskStatus>(task?.status || "todo");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );

  useEffect(() => {
    async function loadUsers() {
      try {
        const users = await getAssignableUsers();
        setAssignableUsers(users);
        if (!task && users.length > 0 && !assignedTo) {
          setAssignedTo(users[0]._id);
        }
      } catch (err) {
        console.error("Failed to load assignable users", err);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, [task, assignedTo]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("assignedTo", assignedTo);
    formData.set("priority", priority);
    formData.set("status", status);
    formData.set("dueDate", dueDate);

    try {
      const result = isEditing
        ? await updateTask(task._id, formData)
        : await createTask(formData);

      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      toast.success(isEditing ? "Task updated successfully" : "Task created successfully");
      router.push(isEditing ? `/tasks/${task._id}` : "/tasks");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Task Title <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          type="text"
          defaultValue={task?.title}
          placeholder="e.g. Pack 100 boxes of Masala Mix"
          required
          className="h-11 rounded-xl"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={task?.description}
          placeholder="Detailed instructions, requirements, or notes for the task..."
          rows={4}
          className="rounded-xl resize-none"
        />
      </div>

      {/* Assignee & Due Date Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assignedTo" className="text-sm font-medium">
            Assign To <span className="text-rose-500">*</span>
          </Label>
          {loadingUsers ? (
            <div className="h-11 rounded-xl bg-muted animate-pulse" />
          ) : (
            <select
              id="assignedTo"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              required
              className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            >
              <option value="" disabled>Select team member</option>
              {assignableUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({ROLE_LABELS[u.role as UserRole] || u.role})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate" className="text-sm font-medium">
            Due Date <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="h-11 rounded-xl"
          />
        </div>
      </div>

      {/* Priority Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Priority <span className="text-rose-500">*</span>
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TASK_PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={cn(
                "px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-center capitalize",
                priority === p
                  ? "border-brand-green bg-brand-green/10 text-brand-green font-semibold shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-brand-green/40 hover:text-foreground"
              )}
            >
              {TASK_PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Status Selection (if editing or desired) */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Status</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TASK_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-medium border transition-all text-center",
                status === s
                  ? "border-brand-green bg-brand-green/10 text-brand-green font-semibold shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-brand-green/40 hover:text-foreground"
              )}
            >
              {TASK_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <Button
          type="submit"
          disabled={isLoading || loadingUsers}
          className="h-11 px-8 rounded-xl bg-brand-green hover:bg-brand-green-light text-white font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Create Task"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="h-11 rounded-xl"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

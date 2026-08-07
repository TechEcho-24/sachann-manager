import { notFound } from "next/navigation";
import { TaskForm } from "@/components/tasks/TaskForm";
import { getTaskById } from "@/actions/task";
import { getCurrentUser } from "@/lib/auth-guard";
import { canEditTaskDetails } from "@/lib/roles";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [task, currentUser] = await Promise.all([
    getTaskById(id),
    getCurrentUser(),
  ]);

  if (!task) {
    notFound();
  }

  const role = currentUser?.role || "employee";
  if (!canEditTaskDetails(role)) {
    notFound();
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6 space-y-4">
        <Link
          href={`/tasks/${task._id}`}
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Task
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Task</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update task details, deadline, and assignments
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 lg:p-6 shadow-sm">
        <TaskForm task={task} />
      </div>
    </div>
  );
}

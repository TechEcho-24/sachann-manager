import { notFound } from "next/navigation";
import Link from "next/link";
import { getTaskById } from "@/actions/task";
import { getCurrentUser } from "@/lib/auth-guard";
import { canEditTaskDetails, canDeleteTasks } from "@/lib/roles";
import { TaskDetailClient } from "./TaskDetailClient";
import { ChevronLeft } from "lucide-react";

export default async function TaskDetailPage({
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
  const canEdit = canEditTaskDetails(role);
  const canDelete = canDeleteTasks(role);
  const isAssignee = currentUser?.userId === task.assignedTo._id;

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/tasks"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Tasks
      </Link>

      <TaskDetailClient
        task={task}
        canEdit={canEdit}
        canDelete={canDelete}
        isAssignee={isAssignee}
        userRole={role}
      />
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canCreateTasks, type UserRole } from "@/lib/roles";
import { TasksClient } from "./TasksClient";

export default async function TasksPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user.role || "employee") as UserRole;
  const canCreate = canCreateTasks(role);

  return <TasksClient canCreate={canCreate} userRole={role} />;
}

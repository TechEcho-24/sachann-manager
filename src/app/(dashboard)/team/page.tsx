import { getTeamProgress } from "@/actions/task";
import { getCurrentUser } from "@/lib/auth-guard";
import { canManageTasks } from "@/lib/roles";
import { TeamProgress } from "@/components/dashboard/TeamProgress";
import { notFound } from "next/navigation";
import { Users, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function TeamPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !canManageTasks(currentUser.role)) {
    notFound();
  }

  const { employees } = await getTeamProgress();

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Team Workload & Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor employee task completion, active loads, and bottlenecks
          </p>
        </div>
        <Link href="/tasks/new">
          <Button className="h-10 rounded-xl bg-brand-green hover:bg-brand-green-light text-white gap-2">
            <Plus className="w-4 h-4" />
            Assign New Task
          </Button>
        </Link>
      </div>

      <TeamProgress employees={employees} />
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FinancialDashboard } from "@/components/dashboard/FinancialDashboard";
import { ManagerTaskDashboard } from "@/components/dashboard/ManagerTaskDashboard";
import { EmployeeTaskDashboard } from "@/components/dashboard/EmployeeTaskDashboard";
import type { UserRole } from "@/lib/roles";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user.role || "employee") as UserRole;
  const userName = session.user.name || "Team Member";
  const userId = session.user.id;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {role === "employee" ? (
        <EmployeeTaskDashboard userId={userId} userName={userName} />
      ) : role === "manager" ? (
        <ManagerTaskDashboard userName={userName} />
      ) : (
        <FinancialDashboard role={role} userName={userName} />
      )}
    </div>
  );
}

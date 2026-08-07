import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "./DashboardLayoutClient";
import type { UserRole } from "@/lib/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    id: session.user.id,
    name: session.user.name || "User",
    email: session.user.email,
    role: (session.user.role || "employee") as UserRole,
  };

  return (
    <DashboardLayoutClient user={user}>
      {children}
    </DashboardLayoutClient>
  );
}

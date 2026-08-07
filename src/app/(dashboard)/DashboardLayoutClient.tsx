"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  FileBarChart,
  Wallet,
  Settings,
  LogOut,
  Plus,
  Menu,
  X,
  Users,
  TrendingUp,
  CheckSquare,
  UserCheck,
  ShieldAlert,
  Bell,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FloatingChatWidget } from "@/components/assistant/FloatingChatWidget";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { RoleBadge } from "@/components/users/RoleBadge";
import {
  canAccessFinancials,
  canManageTasks,
  canManageUsers,
  type UserRole,
} from "@/lib/roles";

interface NavItem {
  label: string;
  href: string;
  icon: any;
}

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export function DashboardLayoutClient({
  children,
  user,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role || "employee";
  const hasFinanceAccess = canAccessFinancials(role);
  const hasTaskManagement = canManageTasks(role);
  const hasUserManagement = canManageUsers(role);
  const hasTasksAccess = ["admin_manager", "manager", "employee"].includes(role);

  // Build navigation items based on role
  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
  ];

  // Financial Items (Admin & Admin+Manager)
  if (hasFinanceAccess) {
    navItems.push(
      { label: "Expenses", href: "/expenses", icon: Receipt },
      { label: "Sales", href: "/sales", icon: TrendingUp },
      { label: "Sales Reports", href: "/sales/reports", icon: FileBarChart },
      { label: "Total Spend", href: "/total", icon: FileBarChart },
      { label: "Budget", href: "/budget", icon: Wallet },
      { label: "Balances", href: "/balances", icon: Users }
    );
  }

  // Task Management (Admin+Manager, Manager, Employee)
  if (hasTasksAccess) {
    navItems.push({
      label: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
    });
  }

  // Team Workload (Admin+Manager, Manager)
  if (hasTaskManagement) {
    navItems.push({
      label: "Team",
      href: "/team",
      icon: UserCheck,
    });
  }

  // User Management (Admin+Manager / Super Admin only)
  if (hasUserManagement) {
    navItems.push({
      label: "Users",
      href: "/users",
      icon: ShieldAlert,
    });
  }

  // Settings (Everyone)
  navItems.push({
    label: "Settings",
    href: "/settings",
    icon: Settings,
  });

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  async function handleLogout() {
    try {
      await logoutAction();
      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch {
      toast.error("Failed to log out");
    }
  }

  const getPageInfo = () => {
    if (pathname === "/dashboard") return { title: "Dashboard", subtitle: "Financial & Operations Overview" };
    if (pathname.startsWith("/expenses/new")) return { title: "New Expense", subtitle: "Record a new expense" };
    if (pathname.startsWith("/expenses")) return { title: "Expenses", subtitle: "Manage & track expenses" };
    if (pathname.startsWith("/sales/new")) return { title: "New Sale", subtitle: "Record daily sales" };
    if (pathname.startsWith("/sales/reports")) return { title: "Sales Reports", subtitle: "Sales analytics & trends" };
    if (pathname.startsWith("/sales")) return { title: "Sales", subtitle: "Track business revenue" };
    if (pathname.startsWith("/total")) return { title: "Total Spend", subtitle: "Lifetime financial summary" };
    if (pathname.startsWith("/budget")) return { title: "Budget", subtitle: "Budget allocation & limits" };
    if (pathname.startsWith("/balances")) return { title: "Balances", subtitle: "Payer settlement accounts" };
    if (pathname.startsWith("/tasks/new")) return { title: "New Task", subtitle: "Create & assign a task" };
    if (pathname.startsWith("/tasks")) return { title: "Tasks", subtitle: "Task management & progress" };
    if (pathname.startsWith("/team")) return { title: "Team", subtitle: "Team workload & performance" };
    if (pathname.startsWith("/users")) return { title: "User Management", subtitle: "Manage team members & roles" };
    if (pathname.startsWith("/notifications")) return { title: "Notifications", subtitle: "Activity & updates" };
    if (pathname.startsWith("/settings")) return { title: "Settings", subtitle: "Account & app configuration" };
    return { title: "Sachann Manager", subtitle: "Management portal" };
  };

  const pageInfo = getPageInfo();

  // Bottom mobile navigation items (First 5 items)
  const mobileBottomItems = navItems.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar (Fixed Full-Height Left) */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border fixed inset-y-0 left-0 z-30">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border h-16">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden shadow-sm shrink-0">
            <Image
              src="/logo.png"
              alt="Logo"
              width={36}
              height={36}
              className="object-contain w-9 h-9"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-foreground text-sm leading-tight truncate">Sachann</h1>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Manager
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive(item.href)
                  ? "bg-brand-green text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full cursor-pointer"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 lg:hidden transition-transform duration-300 ease-in-out flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden">
              <Image
                src="/logo.png"
                alt="Logo"
                width={36}
                height={36}
                className="object-contain w-9 h-9"
              />
            </div>
            <span className="font-bold text-foreground text-sm">
              Sachann Manager
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile User Role */}
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <p className="text-xs font-semibold text-foreground truncate">
            {user.name}
          </p>
          <div className="mt-1">
            <RoleBadge role={role} />
          </div>
        </div>

        <nav className="px-3 py-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive(item.href)
                  ? "bg-brand-green text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors w-full"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area (With lg:pl-64 offset for sidebar) */}
      <div className="lg:pl-64 flex flex-col min-h-screen w-full">
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-20 h-16 bg-card/95 backdrop-blur-md border-b border-border px-6 lg:px-8 items-center justify-between shadow-xs">
          {/* Active Tab / Page Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight truncate">
                {pageInfo.title}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                {pageInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Right Header Area: Welcome User + Role Badge, Notification Bell with count, Action Button */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Welcome User + Role Badge */}
            <div className="flex flex-col items-end pr-4 border-r border-border">
              <span className="text-xs font-semibold text-foreground leading-tight">
                Welcome, {user.name}
              </span>
              <div className="mt-1">
                <RoleBadge role={role} />
              </div>
            </div>

            {/* Notification Bell with Badge Count */}
            <div className="flex items-center">
              <NotificationBell />
            </div>

            {/* Action Button */}
            {hasFinanceAccess ? (
              <Link
                href="/expenses/new"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-green hover:bg-brand-green-light text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </Link>
            ) : hasTaskManagement ? (
              <Link
                href="/tasks/new"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-green hover:bg-brand-green-light text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </Link>
            ) : null}
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={36}
              height={36}
              className="object-contain w-9 h-9"
            />
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            {hasFinanceAccess && (
              <Link
                href="/expenses/new"
                className="p-2 rounded-lg bg-brand-green text-white hover:bg-brand-green-light transition-colors"
              >
                <Plus className="w-4 h-4" />
              </Link>
            )}
            {!hasFinanceAccess && hasTaskManagement && (
              <Link
                href="/tasks/new"
                className="p-2 rounded-lg bg-brand-green text-white hover:bg-brand-green-light transition-colors"
              >
                <Plus className="w-4 h-4" />
              </Link>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full min-w-0 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around py-2 px-1">
          {mobileBottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors min-w-[50px]",
                isActive(item.href) ? "text-brand-green" : "text-muted-foreground"
              )}
            >
              <item.icon
                className={cn("w-5 h-5", isActive(item.href) && "stroke-[2.5]")}
              />
              <span className="text-[9px] font-medium truncate max-w-[56px]">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Floating Chat Widget — strictly for financial roles */}
      {hasFinanceAccess && <FloatingChatWidget />}

      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  );
}

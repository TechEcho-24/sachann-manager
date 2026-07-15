"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  FileBarChart,
  Wallet,
  Settings,
  Leaf,
  LogOut,
  Plus,
  Menu,
  X,
  Users,
  Bot,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FloatingChatWidget } from "@/components/assistant/FloatingChatWidget";

const navItems = [
  {
    label: "AI Assistant",
    href: "/assistant",
    icon: Bot,
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Expenses",
    href: "/expenses",
    icon: Receipt,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileBarChart,
  },
  {
    label: "Total Spend",
    href: "/total",
    icon: FileBarChart,
  },
  {
    label: "Budget",
    href: "/budget",
    icon: Wallet,
  },
  {
    label: "Balances",
    href: "/balances",
    icon: Users,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border fixed inset-y-0 left-0 z-30">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden">
            <Image src="/logo.png" alt="Logo" width={36} height={36} className="object-cover" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-sm">Sachann</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Manager
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
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
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Add Expense Quick Action */}
        <div className="px-3 pb-3">
          <Link
            href="/expenses/new"
            className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-brand-green/10 text-brand-green text-sm font-medium hover:bg-brand-green/15 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </Link>
        </div>

        {/* Logout */}
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
          "fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 lg:hidden transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden">
              <Image src="/logo.png" alt="Logo" width={36} height={36} className="object-cover" />
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
        <nav className="px-3 py-4 space-y-1">
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
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors w-full"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen pb-20 lg:pb-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center">
            <Image src="/logo.png" alt="Logo" width={60} height={60} className="object-contain" />
          </div>
          <Link
            href="/expenses/new"
            className="p-2 -mr-2 rounded-lg bg-brand-green text-white hover:bg-brand-green-light transition-colors"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </header>

        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[60px]",
                isActive(item.href)
                  ? "text-brand-green"
                  : "text-muted-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5",
                  isActive(item.href) && "stroke-[2.5]"
                )}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
          <Link
            href="/settings"
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[60px]",
              isActive("/settings")
                ? "text-brand-green"
                : "text-muted-foreground"
            )}
          >
            <Settings
              className={cn(
                "w-5 h-5",
                isActive("/settings") && "stroke-[2.5]"
              )}
            />
            <span className="text-[10px] font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      {/* Floating Chat Widget */}
      <FloatingChatWidget />
    </div>
  );
}

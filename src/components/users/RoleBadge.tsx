import { ROLE_LABELS, ROLE_COLORS, type UserRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const colors = ROLE_COLORS[role];
  const label = ROLE_LABELS[role];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border",
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {label}
    </span>
  );
}

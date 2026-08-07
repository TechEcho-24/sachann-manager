import { Progress } from "@/components/ui/progress";
import { Users, AlertTriangle, CheckCircle2 } from "lucide-react";

interface EmployeeProgress {
  _id: string;
  name: string;
  total: number;
  done: number;
  inProgress: number;
  overdue: number;
}

interface TeamProgressProps {
  employees: EmployeeProgress[];
}

export function TeamProgress({ employees }: TeamProgressProps) {
  if (employees.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 text-center text-xs text-muted-foreground">
        No active employees found.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5 lg:p-6 space-y-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-green/10 text-brand-green">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground">
              Team Workload & Progress
            </h3>
            <p className="text-xs text-muted-foreground">
              Task completion rate per employee
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {employees.map((emp) => {
          const percent = emp.total > 0 ? Math.round((emp.done / emp.total) * 100) : 0;

          return (
            <div key={emp._id} className="space-y-2 bg-muted/20 p-3.5 rounded-xl border border-border/50">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-[10px]">
                    {emp.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-foreground">{emp.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {emp.overdue > 0 && (
                    <span className="text-rose-500 font-semibold flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3 h-3" />
                      {emp.overdue} overdue
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{emp.done}</span>/{emp.total} done ({percent}%)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-green rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

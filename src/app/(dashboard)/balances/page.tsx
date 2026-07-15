import Link from "next/link";
import { Plus, Users, Wallet, CreditCard, Calendar } from "lucide-react";
import { getBalances, getReimbursements } from "@/actions/reimbursement";
import { format } from "date-fns";

export default async function BalancesPage() {
  const [balances, reimbursements] = await Promise.all([
    getBalances(),
    getReimbursements(50),
  ]);

  const totalOutstanding = balances.reduce((sum, b) => sum + Math.max(0, b.balanceDue), 0);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Balances & Reimbursements
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track how much money is owed and record payments made.
          </p>
        </div>
        <Link
          href="/balances/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-green text-white text-sm font-medium rounded-xl hover:bg-brand-green-light transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Reimbursement
        </Link>
      </div>

      {/* Summary Stat */}
      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-600/80 dark:text-red-400/80">Total Outstanding Balance</p>
            <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">₹{totalOutstanding.toLocaleString("en-IN")}</h2>
          </div>
        </div>
      </div>

      {/* Balances Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          Payer Balances
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {balances.length === 0 ? (
            <p className="col-span-full text-muted-foreground text-sm py-4">No expenses recorded yet.</p>
          ) : (
            balances.map((b) => (
              <div key={b.payer} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-lg mb-4">{b.payer}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Spent:</span>
                    <span className="font-medium">₹{b.totalSpent.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reimbursed:</span>
                    <span className="font-medium text-brand-green">₹{b.totalReimbursed.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="pt-3 border-t border-border flex justify-between">
                    <span className="font-medium">Balance Due:</span>
                    <span className={`font-bold ${b.balanceDue > 0 ? "text-red-500" : "text-foreground"}`}>
                      ₹{b.balanceDue.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reimbursements History */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-muted-foreground" />
          Recent Reimbursements
        </h2>
        
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {reimbursements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No reimbursements recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Paid To</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Mode</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reimbursements.map((r) => (
                    <tr key={r._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(r.date), "dd MMM yyyy")}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{r.paidTo}</td>
                      <td className="px-4 py-3 font-semibold text-brand-green">
                        ₹{r.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.paymentMode || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{r.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

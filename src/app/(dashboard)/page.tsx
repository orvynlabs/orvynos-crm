import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  IconCreditCard,
  IconReceipt2,
  IconTrendingUp,
  IconAlertCircle,
  IconChevronRight,
  IconArrowUpRight,
  IconArrowDownRight,
  IconCalendar,
} from "@tabler/icons-react";

export default async function DashboardPage() {
  // Run auth + all DB queries concurrently — eliminates sequential wait
  const [
    session,
    clientsCount,
    projectsCount,
    _leadsCount,
    newProjectsCount,
    ongoingProjectsCount,
    completedProjectsCount,
    paymentsSum,
    expensesSum,
    projectsSum,
    recentPayments,
    recentExpenses,
  ] = await Promise.all([
    auth(),
    prisma.client.count(),
    prisma.project.count(),
    prisma.lead.count(),
    prisma.project.count({ where: { status: "NEW" } }),
    prisma.project.count({ where: { status: "ONGOING" } }),
    prisma.project.count({ where: { status: "COMPLETED" } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED" },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
    }),
    prisma.project.aggregate({
      _sum: { budget: true },
    }),
    prisma.payment.findMany({
      take: 3,
      orderBy: { paidAt: "desc" },
      include: { client: true, project: true },
    }),
    prisma.expense.findMany({
      take: 3,
      orderBy: { date: "desc" },
    }),
  ]);

  if (!session?.user) {
    redirect("/login");
  }

  const totalReceived = Number(paymentsSum._sum.amount || 0);
  const totalExpenses = Number(expensesSum._sum.amount || 0);
  const totalContractedRevenue = Number(projectsSum._sum.budget || 0);
  const netProfit = totalReceived - totalExpenses;

  return (
    <div className="space-y-8 font-sans">
      {/* Welcome header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
          Welcome back, {session.user.name?.split(" ")[0] || "Owner"}
        </h1>
        <p className="text-sm text-text-secondary">
          Here&apos;s what is happening with your business today.
        </p>
      </div>

      {/* METRICS ROW */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue (Contracted) */}
        <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Revenue (Contracted)
            </span>
            <div className="p-2 bg-brand-orange-tint text-brand-orange rounded-lg">
              <IconCreditCard className="h-5 w-5" stroke={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-text-primary tracking-tight">
              ₹{totalContractedRevenue.toLocaleString("en-IN")}
            </span>
            <p className="text-[10px] text-text-secondary font-medium mt-1">
              Total pipeline value under contract
            </p>
          </div>
        </div>

        {/* Received */}
        <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Payments Collected
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <IconTrendingUp className="h-5 w-5" stroke={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-text-primary tracking-tight">
              ₹{totalReceived.toLocaleString("en-IN")}
            </span>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 mt-1">
              <IconArrowUpRight className="h-3.5 w-3.5" />
              100% cleared funds
            </p>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg">
              <IconReceipt2 className="h-5 w-5" stroke={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-text-primary tracking-tight">
              ₹{totalExpenses.toLocaleString("en-IN")}
            </span>
            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5 mt-1">
              <IconArrowDownRight className="h-3.5 w-3.5" />
              Payouts, software, & hostings
            </p>
          </div>
        </div>

        {/* Profit */}
        <div className="bg-surface-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Net Profit
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <IconTrendingUp className="h-5 w-5" stroke={1.75} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-text-primary tracking-tight">
              ₹{netProfit.toLocaleString("en-IN")}
            </span>
            <p className="text-[10px] text-text-secondary font-medium mt-1">
              Collected revenue minus expenses
            </p>
          </div>
        </div>
      </div>

      {/* PIPELINE & CLIENTS SUMMARY BAR */}
      <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">
          Pipeline & Clients
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-2 text-center">
          <div className="p-3 bg-surface-page border border-border rounded-lg">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              New Projects
            </span>
            <span className="text-xl font-extrabold text-text-primary mt-1 block">
              {newProjectsCount}
            </span>
          </div>
          <div className="p-3 bg-surface-page border border-border rounded-lg">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Ongoing
            </span>
            <span className="text-xl font-extrabold text-text-primary mt-1 block">
              {ongoingProjectsCount}
            </span>
          </div>
          <div className="p-3 bg-surface-page border border-border rounded-lg">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Completed
            </span>
            <span className="text-xl font-extrabold text-text-primary mt-1 block">
              {completedProjectsCount}
            </span>
          </div>
          <div className="p-3 bg-surface-page border border-border rounded-lg">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Total Projects
            </span>
            <span className="text-xl font-extrabold text-text-primary mt-1 block">
              {projectsCount}
            </span>
          </div>
          <div className="p-3 bg-surface-page border border-border rounded-lg col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Total Clients
            </span>
            <span className="text-xl font-extrabold text-text-primary mt-1 block">
              {clientsCount}
            </span>
          </div>
        </div>
      </div>

      {/* DETAIL BLOCKS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Net Profit Breakdown Chart */}
        <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Net Profit</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Visual overview of collected funds versus expenses.
            </p>
            <div className="mt-8 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Collected Payments (₹{totalReceived.toLocaleString("en-IN")})</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-border rounded-full h-3.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "100%" }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Expenses (₹{totalExpenses.toLocaleString("en-IN")})</span>
                  <span>
                    {totalReceived > 0
                      ? Math.round((totalExpenses / totalReceived) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-3.5 overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{
                      width: `${
                        totalReceived > 0 ? (totalExpenses / totalReceived) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-border/60 flex items-center justify-between text-xs font-bold text-brand-orange">
            <span>Current Profit Margin: {totalReceived > 0 ? Math.round((netProfit / totalReceived) * 100) : 100}%</span>
            <IconChevronRight className="h-4 w-4" />
          </div>
        </div>

        {/* Total Expenses Breakdown */}
        <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">Recent Business Expenses</h3>
              <span className="text-[10px] font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 rounded-full">
                Active Ledger
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Latest operations, tool payouts, and infrastructure bills.
            </p>
            <div className="mt-6 divide-y divide-border/60">
              {recentExpenses.length > 0 ? (
                recentExpenses.map((exp) => (
                  <div key={exp.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-text-primary block">{exp.title}</span>
                      <span className="text-[10px] text-text-secondary font-mono block uppercase">
                        {exp.category} • {new Date(exp.date).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      -₹{Number(exp.amount).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-text-secondary text-xs flex items-center justify-center gap-1">
                  <IconAlertCircle className="h-4 w-4" /> No recorded expenses.
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs font-bold text-brand-orange cursor-pointer">
            <span>View All Expense Details</span>
            <IconChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS TABLE */}
      <div className="bg-surface-white border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Recent Inflow Payments</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Latest client invoice settlements and UPI receipts.
            </p>
          </div>
          <button className="text-xs font-bold text-brand-orange flex items-center gap-0.5 self-start md:self-auto mt-2 md:mt-0">
            View all ledger history <IconChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-text-secondary font-bold">
                <th className="pb-3 font-semibold">Client Company</th>
                <th className="pb-3 font-semibold hidden sm:table-cell">Project Code</th>
                <th className="pb-3 font-semibold hidden md:table-cell">Method</th>
                <th className="pb-3 font-semibold">Settled Date</th>
                <th className="pb-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {recentPayments.length > 0 ? (
                recentPayments.map((pmt) => (
                  <tr key={pmt.id} className="text-text-primary hover:bg-surface-page/50 transition-colors">
                    <td className="py-3 font-semibold">{pmt.client.name}</td>
                    <td className="py-3 text-text-secondary font-mono hidden sm:table-cell">{pmt.project.name}</td>
                    <td className="py-3 hidden md:table-cell">
                      <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wider">
                        {pmt.method.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 text-text-secondary flex items-center gap-1.5">
                      <IconCalendar className="h-3.5 w-3.5 text-text-secondary/65" />
                      {new Date(pmt.paidAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      +₹{Number(pmt.amount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-secondary">
                    <div className="flex items-center justify-center gap-1.5">
                      <IconAlertCircle className="h-4 w-4" /> No payments recorded.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

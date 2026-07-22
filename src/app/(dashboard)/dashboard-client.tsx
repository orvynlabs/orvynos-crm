"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconCreditCard,
  IconReceipt2,
  IconTrendingUp,
  IconAlertCircle,
  IconUsers,
  IconBriefcase,
  IconFileText,
  IconFileCheck,
  IconCalendar,
  IconArrowUpRight,
  IconArrowDownRight,
  IconChevronRight,
  IconClock,
  IconFolder,
  IconSparkles,
  IconEye,
  IconPlus,
  IconTarget,
} from "@tabler/icons-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MetricCardData } from "@/lib/dashboard";

type DashboardClientProps = {
  userName: string;
  metrics: MetricCardData;
  charts: {
    revenueVsExpenses: any[];
    monthlyRevenueTrend: any[];
    monthlyProfitTrend: any[];
    clientGrowthTrend: any[];
    projectStatusData: any[];
  };
  activity: {
    recentClients: any[];
    recentProjects: any[];
    recentPayments: any[];
    upcomingDeadlines: any[];
    recentDocuments: any[];
  };
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDateShort = (dateStr?: string | Date | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
};

const PIE_COLORS = ["#ff5722", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#64748b"];

export function DashboardClient({ userName, metrics, charts, activity }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "CLIENTS" | "PAYMENTS" | "PROJECTS" | "DEADLINES" | "DOCS">("ALL");
  const [showAllCards, setShowAllCards] = useState(false);

  return (
    <div className="space-y-6 font-sans text-text-primary select-none pb-12">
      {/* 🚀 Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-white border border-border/80 rounded-2xl p-4 md:p-5 shadow-2xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-orange animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-orange bg-brand-orange-tint px-2.5 py-0.5 rounded-md">
              Enterprise Dashboard
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-text-primary mt-1">
            Welcome back, {userName || "Co-Founder"} 👋
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Real-time financial analytics, active project tracking &amp; activity telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary bg-surface-page border border-border/80 px-3 py-2 rounded-xl">
            <IconCalendar className="h-4 w-4 text-brand-orange" stroke={2} />
            <span>{new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>

          <Link
            href="/projects"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-brand-orange hover:bg-brand-orange-hover px-3.5 py-2 rounded-xl transition-all shadow-xs active:scale-95"
          >
            <IconPlus className="h-4 w-4" />
            <span>New Project</span>
          </Link>
        </div>
      </div>

      {/* 📊 Section 6.1: Clean Modern 4-Card Hero Metrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase text-text-secondary tracking-widest flex items-center gap-2">
            <IconTrendingUp className="h-4 w-4 text-brand-orange" />
            <span>Executive Financial &amp; Operational Overview</span>
          </h2>

          <button
            onClick={() => setShowAllCards(!showAllCards)}
            className="text-[11px] font-black text-brand-orange hover:bg-brand-orange-tint px-2.5 py-1 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1 border border-brand-orange/30 shadow-3xs"
          >
            <span>{showAllCards ? "Collapse to 4 Core Cards" : "View All 13 Telemetry Cards"}</span>
            <IconChevronRight className={`h-3.5 w-3.5 transition-transform ${showAllCards ? "rotate-90" : ""}`} />
          </button>
        </div>

        {!showAllCards ? (
          /* Clean 4 Core Power Cards */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* 1. Cleared Revenue */}
            <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs hover:border-emerald-500/40 active:scale-[0.98] transition-all duration-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                  Cleared Revenue
                </span>
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0">
                  <IconTrendingUp className="h-4.5 w-4.5" stroke={2} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl md:text-2xl font-black tracking-tight text-emerald-600">
                  {formatCurrency(metrics.totalReceivedPayments)}
                </div>
                <div className="text-[10px] font-bold text-text-secondary mt-1 truncate">
                  Contracted: <span className="font-extrabold text-text-primary">{formatCurrency(metrics.totalRevenue)}</span>
                </div>
              </div>
            </div>

            {/* 2. Pending Receivables */}
            <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs hover:border-amber-500/40 active:scale-[0.98] transition-all duration-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                  Pending Receivables
                </span>
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl shrink-0">
                  <IconAlertCircle className="h-4.5 w-4.5" stroke={2} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl md:text-2xl font-black tracking-tight text-amber-600">
                  {formatCurrency(metrics.totalPendingPayments)}
                </div>
                <div className="text-[10px] font-bold text-text-secondary mt-1 truncate">
                  Net Profit: <span className="font-extrabold text-emerald-600">{formatCurrency(metrics.netProfit)}</span>
                </div>
              </div>
            </div>

            {/* 3. Active Projects */}
            <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs hover:border-brand-orange/40 active:scale-[0.98] transition-all duration-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                  Active Projects
                </span>
                <div className="p-2 bg-brand-orange-tint text-brand-orange rounded-xl shrink-0">
                  <IconBriefcase className="h-4.5 w-4.5" stroke={2} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl md:text-2xl font-black tracking-tight text-text-primary">
                  {metrics.activeProjectCount} Active
                </div>
                <div className="text-[10px] font-bold text-text-secondary mt-1 truncate">
                  {metrics.totalProjectsCount} Total • {metrics.completedProjectsCount} Completed
                </div>
              </div>
            </div>

            {/* 4. Total Clients */}
            <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs hover:border-purple-500/40 active:scale-[0.98] transition-all duration-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                  Total Clients
                </span>
                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl shrink-0">
                  <IconUsers className="h-4.5 w-4.5" stroke={2} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl md:text-2xl font-black tracking-tight text-text-primary">
                  {metrics.totalClientCount} Clients
                </div>
                <div className="text-[10px] font-bold text-purple-600 mt-1 truncate">
                  {metrics.totalLeadsCount} Leads in Pipeline
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Detailed 13-Card Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {/* 1. Total Revenue */}
            <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase">Contracted Revenue</span>
              <div className="text-lg font-black text-text-primary mt-2">{formatCurrency(metrics.totalRevenue)}</div>
            </div>
            {/* 2. Received Payments */}
            <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase">Received Payments</span>
              <div className="text-lg font-black text-emerald-600 mt-2">{formatCurrency(metrics.totalReceivedPayments)}</div>
            </div>
            {/* 3. Total Expenses */}
            <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase">Total Expenses</span>
              <div className="text-lg font-black text-rose-600 mt-2">{formatCurrency(metrics.totalExpenses)}</div>
            </div>
            {/* 4. Net Profit */}
            <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase">Net Profit</span>
              <div className="text-lg font-black text-emerald-600 mt-2">{formatCurrency(metrics.netProfit)}</div>
            </div>
            {/* 5. Pending Payments */}
            <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase">Pending Receivables</span>
              <div className="text-lg font-black text-amber-600 mt-2">{formatCurrency(metrics.totalPendingPayments)}</div>
            </div>
            {/* 6. Active Projects */}
            <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase">Active Projects</span>
              <div className="text-lg font-black text-text-primary mt-2">{metrics.activeProjectCount}</div>
            </div>
            {/* 7. Total Projects */}
            <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase">Total Projects</span>
              <div className="text-lg font-black text-text-primary mt-2">{metrics.totalProjectsCount}</div>
            </div>
            {/* 8. Total Clients */}
            <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase">Total Clients</span>
              <div className="text-lg font-black text-text-primary mt-2">{metrics.totalClientCount}</div>
            </div>
            {/* 9. Total Leads */}
            <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase">Leads &amp; Prospects</span>
              <div className="text-lg font-black text-text-primary mt-2">{metrics.totalLeadsCount}</div>
            </div>
            {/* 10. Proposal Value */}
            <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase">Active Proposal Value</span>
              <div className="text-lg font-black text-blue-600 mt-2">{formatCurrency(metrics.proposalValueTotal)}</div>
            </div>
            {/* 11. Pending Agreements */}
            <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase">Pending Agreements</span>
              <div className="text-lg font-black text-purple-600 mt-2">{metrics.pendingAgreementsCount}</div>
            </div>
            {/* 12. Documents */}
            <div className="bg-surface-white border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-text-secondary uppercase">Registered Assets</span>
              <div className="text-lg font-black text-orange-600 mt-2">{metrics.documentCount}</div>
            </div>
          </div>
        )}
      </div>

      {/* 📈 Section 6.2 & 6.3: Core Recharts Charts (6 Charts Grid) */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase text-text-secondary tracking-widest flex items-center gap-2">
          <IconTrendingUp className="h-4 w-4 text-brand-orange" />
          <span>Financial Analytics &amp; Growth Charts (6 Core Series)</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          {/* Chart 1: Revenue vs Expenses (Bar Chart) */}
          <div className="bg-surface-white border border-border/80 rounded-2xl p-4 md:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary">Revenue vs. Expenses (Last 6 Months)</h3>
                <p className="text-[11px] font-medium text-text-secondary">Comparing cleared cashflow vs operational spending</p>
              </div>
              <span className="text-[9.5px] font-black text-brand-orange bg-brand-orange-tint px-2 py-0.5 rounded-md">
                Grouped Bar
              </span>
            </div>
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={charts.revenueVsExpenses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Bar dataKey="Revenue" fill="#ff5722" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Monthly Revenue Trend (Line Chart) */}
          <div className="bg-surface-white border border-border/80 rounded-2xl p-4 md:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary">Monthly Revenue Trajectory</h3>
                <p className="text-[11px] font-medium text-text-secondary">6-Month historical cash inflow performance</p>
              </div>
              <span className="text-[9.5px] font-black text-brand-orange bg-brand-orange-tint px-2 py-0.5 rounded-md">
                Line Chart
              </span>
            </div>
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={charts.monthlyRevenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                  />
                  <Line type="monotone" dataKey="Revenue" stroke="#ff5722" strokeWidth={3} dot={{ r: 4, fill: "#ff5722" }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Monthly Net Profit (Area Chart) */}
          <div className="bg-surface-white border border-border/80 rounded-2xl p-4 md:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary">Monthly Net Profit Trend</h3>
                <p className="text-[11px] font-medium text-text-secondary">Net income after deducting operational expenses</p>
              </div>
              <span className="text-[9.5px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                Area Chart
              </span>
            </div>
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={charts.monthlyProfitTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#profitGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Project Status Breakdown (Pie/Donut Chart) */}
          <div className="bg-surface-white border border-border/80 rounded-2xl p-4 md:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary">Project Status Breakdown</h3>
                <p className="text-[11px] font-medium text-text-secondary">Distribution of projects across stages</p>
              </div>
              <span className="text-[9.5px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Donut Chart
              </span>
            </div>
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={charts.projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {charts.projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 5: Client Growth Trend */}
          <div className="bg-surface-white border border-border/80 rounded-2xl p-4 md:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary">New Client Acquisition</h3>
                <p className="text-[11px] font-medium text-text-secondary">Monthly new client onboarding count</p>
              </div>
              <span className="text-[9.5px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                Client Growth
              </span>
            </div>
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={charts.clientGrowthTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                  />
                  <Bar dataKey="NewClients" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 6: Payment Status Distribution */}
          <div className="bg-surface-white border border-border/80 rounded-2xl p-4 md:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary">Payment Status Volume</h3>
                <p className="text-[11px] font-medium text-text-secondary">Cleared vs Pending receivables ratio</p>
              </div>
              <span className="text-[9.5px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                Cash Ratio
              </span>
            </div>
            <div className="h-64 w-full flex items-center justify-center p-4">
              <div className="w-full space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-extrabold text-text-primary">
                    <span>Cleared Cash: {formatCurrency(metrics.totalReceivedPayments)}</span>
                    <span className="text-emerald-600 font-bold">
                      {Math.round(
                        (metrics.totalReceivedPayments / (metrics.totalRevenue || 1)) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-surface-page h-3 rounded-full overflow-hidden border border-border/60">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (metrics.totalReceivedPayments / (metrics.totalRevenue || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-extrabold text-text-primary">
                    <span>Pending Receivables: {formatCurrency(metrics.totalPendingPayments)}</span>
                    <span className="text-amber-600 font-bold">
                      {Math.round(
                        (metrics.totalPendingPayments / (metrics.totalRevenue || 1)) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-surface-page h-3 rounded-full overflow-hidden border border-border/60">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (metrics.totalPendingPayments / (metrics.totalRevenue || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-extrabold text-text-primary">
                    <span>Expenses Ratio: {formatCurrency(metrics.totalExpenses)}</span>
                    <span className="text-rose-500 font-bold">
                      {Math.round(
                        (metrics.totalExpenses / (metrics.totalReceivedPayments || 1)) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-surface-page h-3 rounded-full overflow-hidden border border-border/60">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (metrics.totalExpenses / (metrics.totalReceivedPayments || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ⚡ Section 6.3: Recent Activity Feeds Hub */}
      <div className="bg-surface-white border border-border/80 rounded-2xl p-4 md:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
            <h3 className="text-sm font-extrabold text-text-primary">Recent System Activity Telemetry</h3>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {(
              [
                { id: "ALL", label: "All Activity" },
                { id: "CLIENTS", label: "Latest Clients" },
                { id: "PAYMENTS", label: "Recent Payments" },
                { id: "PROJECTS", label: "Recent Projects" },
                { id: "DEADLINES", label: "Upcoming Deadlines" },
                { id: "DOCS", label: "Recent Documents" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  activeTab === tab.id
                    ? "bg-brand-orange text-white shadow-xs font-black"
                    : "bg-surface-page text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Feeds Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {/* Feed 0: Latest Clients */}
          {(activeTab === "ALL" || activeTab === "CLIENTS") && (
            <div className="space-y-3 bg-surface-page/40 p-3.5 rounded-xl border border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-text-primary flex items-center gap-1.5">
                  <IconUsers className="h-4 w-4 text-purple-600" />
                  Latest Clients ({activity.recentClients.length})
                </span>
                <Link href="/clients" className="text-[10px] font-bold text-brand-orange hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-2">
                {activity.recentClients.map((c) => (
                  <div key={c.id} className="p-2.5 bg-surface-white rounded-lg border border-border/60 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-extrabold text-text-primary truncate">{c.name}</p>
                      <p className="text-[10px] text-text-secondary">{c.contactName || "Direct Contact"} • {formatDateShort(c.createdAt)}</p>
                    </div>
                    <Link href={`/clients/${c.id}`} className="text-[10px] font-bold text-purple-600 hover:underline shrink-0">
                      Profile
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Feed 1: Recent Payments */}
          {(activeTab === "ALL" || activeTab === "PAYMENTS") && (
            <div className="space-y-3 bg-surface-page/40 p-3.5 rounded-xl border border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-text-primary flex items-center gap-1.5">
                  <IconCreditCard className="h-4 w-4 text-emerald-600" />
                  Recent Payments ({activity.recentPayments.length})
                </span>
                <Link href="/payments" className="text-[10px] font-bold text-brand-orange hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-2">
                {activity.recentPayments.map((p) => (
                  <div key={p.id} className="p-2.5 bg-surface-white rounded-lg border border-border/60 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-extrabold text-text-primary truncate">{p.project?.name || p.client?.name || "Payment"}</p>
                      <p className="text-[10px] text-text-secondary">{p.client?.name} • {formatDateShort(p.paidAt)}</p>
                    </div>
                    <span className="font-black text-emerald-600 shrink-0">{formatCurrency(Number(p.amount))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feed 2: Recent Projects */}
          {(activeTab === "ALL" || activeTab === "PROJECTS") && (
            <div className="space-y-3 bg-surface-page/40 p-3.5 rounded-xl border border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-text-primary flex items-center gap-1.5">
                  <IconBriefcase className="h-4 w-4 text-brand-orange" />
                  Recent Projects ({activity.recentProjects.length})
                </span>
                <Link href="/projects" className="text-[10px] font-bold text-brand-orange hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-2">
                {activity.recentProjects.map((proj) => (
                  <div key={proj.id} className="p-2.5 bg-surface-white rounded-lg border border-border/60 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-extrabold text-text-primary truncate">{proj.name}</p>
                      <p className="text-[10px] text-text-secondary">{proj.client?.name || "Client"}</p>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-brand-orange-tint text-brand-orange shrink-0">
                      {proj.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feed 3: Upcoming Deadlines */}
          {(activeTab === "ALL" || activeTab === "DEADLINES") && (
            <div className="space-y-3 bg-surface-page/40 p-3.5 rounded-xl border border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-text-primary flex items-center gap-1.5">
                  <IconClock className="h-4 w-4 text-amber-600" />
                  Upcoming Deadlines ({activity.upcomingDeadlines.length})
                </span>
                <Link href="/projects" className="text-[10px] font-bold text-brand-orange hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-2">
                {activity.upcomingDeadlines.map((dl) => (
                  <div key={dl.id} className="p-2.5 bg-surface-white rounded-lg border border-border/60 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-extrabold text-text-primary truncate">{dl.name}</p>
                      <p className="text-[10px] text-amber-600 font-bold">Due: {formatDateShort(dl.deadline)}</p>
                    </div>
                    <span className="text-[9px] font-bold text-text-secondary shrink-0">{dl.client?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feed 4: Recent Documents */}
          {(activeTab === "ALL" || activeTab === "DOCS") && (
            <div className="space-y-3 bg-surface-page/40 p-3.5 rounded-xl border border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-text-primary flex items-center gap-1.5">
                  <IconFolder className="h-4 w-4 text-purple-600" />
                  Recent Uploaded Documents ({activity.recentDocuments.length})
                </span>
                <Link href="/documents" className="text-[10px] font-bold text-brand-orange hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-2">
                {activity.recentDocuments.map((doc) => (
                  <div key={doc.id} className="p-2.5 bg-surface-white rounded-lg border border-border/60 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-extrabold text-text-primary truncate">{doc.name}</p>
                      <p className="text-[10px] text-text-secondary">{doc.type} • {formatDateShort(doc.createdAt)}</p>
                    </div>
                    <Link
                      href={`/api/files/${doc.r2Key?.replace(/^\/+/, "")}`}
                      target="_blank"
                      className="p-1 text-brand-orange hover:bg-brand-orange-tint rounded transition-colors shrink-0"
                    >
                      <IconEye className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

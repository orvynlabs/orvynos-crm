import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { Topbar } from "@/components/app-shell/topbar";
import { BottomNav } from "@/components/app-shell/bottom-nav";
import { NavProvider } from "@/components/app-shell/nav-context";
import { MainContent } from "@/components/app-shell/main-content";

import { getSidebarTeamStatus } from "@/app/(dashboard)/team/actions";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const teamStatusRes = await getSidebarTeamStatus();
  const initialTeamStatus = teamStatusRes.success && teamStatusRes.data ? teamStatusRes.data : [];

  return (
    <NavProvider>
      <div className="min-h-screen bg-surface-page flex flex-col">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-border/80 bg-surface-white md:flex shadow-2xs">
          <div className="flex h-14 items-center gap-2 border-b border-border/80 px-4 select-none">
            <Link href="/" className="flex items-center">
              <Logo size="sm" className="h-6" />
            </Link>
            <div className="h-4 w-px bg-border" />
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-brand-orange bg-brand-orange-tint px-1.5 py-0.5 rounded">
              Orvynos CRM
            </span>
          </div>
          <div className="flex-1 overflow-y-auto py-3">
            <SidebarNav initialTeamStatus={initialTeamStatus} />
          </div>
        </aside>

        {/* Main column */}
        <div className="md:pl-64 flex-1 flex flex-col">
          <Topbar user={session.user} />
          <MainContent>{children}</MainContent>
          <BottomNav />
        </div>
      </div>
    </NavProvider>
  );
}


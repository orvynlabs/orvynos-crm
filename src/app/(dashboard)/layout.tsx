import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { Topbar } from "@/components/app-shell/topbar";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r border-border bg-surface-white md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4 select-none">
          <Link href="/" className="flex items-center">
            <Logo size="sm" className="h-6" />
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-[8px] font-extrabold uppercase tracking-widest text-brand-orange bg-brand-orange-tint px-1.5 py-0.5 rounded">
            Orvynos CRM
          </span>
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <SidebarNav />
        </div>
      </aside>

      {/* Main column */}
      <div className="md:pl-60">
        <Topbar user={session.user} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

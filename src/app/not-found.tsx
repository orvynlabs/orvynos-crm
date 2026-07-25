import Link from "next/link";
import { IconAlertCircle, IconArrowLeft, IconLayoutDashboard } from "@tabler/icons-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-page flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="w-16 h-16 rounded-2xl bg-brand-orange-tint border border-brand-orange/20 text-brand-orange flex items-center justify-center mb-4 shadow-sm">
        <IconAlertCircle className="h-8 w-8 stroke-[2]" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange bg-brand-orange-tint px-2.5 py-0.5 rounded-full mb-3 border border-brand-orange/20">
        404 — Page Not Found
      </span>
      <h1 className="text-2xl font-black text-foreground tracking-tight mb-2">
        Requested Resource Doesn't Exist
      </h1>
      <p className="text-xs text-text-secondary max-w-md mb-6 font-medium leading-relaxed">
        The client profile, project, document, or route you are looking for does not exist or may have been removed.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange text-white text-xs font-bold hover:bg-brand-orange-hover active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <IconLayoutDashboard className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}

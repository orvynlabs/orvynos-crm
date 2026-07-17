import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: "NEW" | "ONGOING" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStyles = (status: string) => {
    switch (status) {
      case "ONGOING":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
          dot: "bg-emerald-500",
        };
      case "COMPLETED":
        return {
          bg: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
          dot: "bg-blue-500",
        };
      case "NEW":
        return {
          bg: "bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800/60",
          dot: "bg-slate-500",
        };
      case "REVIEW":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
          dot: "bg-amber-500",
        };
      case "ON_HOLD":
        return {
          bg: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50",
          dot: "bg-indigo-500",
        };
      case "CANCELLED":
        return {
          bg: "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
          dot: "bg-rose-500",
        };
      default:
        return {
          bg: "bg-stone-50 dark:bg-stone-900/40 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800/60",
          dot: "bg-stone-500",
        };
    }
  };

  const styles = getStyles(status);
  const label = status.replace("_", " ").toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full border select-none whitespace-nowrap",
        styles.bg,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", styles.dot)} />
      {label}
    </span>
  );
}

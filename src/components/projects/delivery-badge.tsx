"use client";

import { IconBolt, IconCheck, IconAlertTriangle, IconClock, IconAlertCircle } from "@tabler/icons-react";
import { getProjectDeliveryStatus } from "@/lib/utils";

type DeliveryBadgeProps = {
  deadline: Date | string | null | undefined;
  completedAt?: Date | string | null | undefined;
  status: string;
  size?: "sm" | "md";
  className?: string;
};

export function DeliveryBadge({
  deadline,
  completedAt,
  status,
  size = "md",
  className = "",
}: DeliveryBadgeProps) {
  const deliveryInfo = getProjectDeliveryStatus(deadline, completedAt, status);

  if (!deliveryInfo) return null;

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  switch (deliveryInfo.variant) {
    case "early":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 ${sizeClasses} ${className}`}
          title="Completed before deadline!"
        >
          <IconBolt className={`${iconSize} fill-emerald-500/30 animate-pulse`} />
          <span>{deliveryInfo.statusText}</span>
        </span>
      );
    case "ontime":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${sizeClasses} ${className}`}
        >
          <IconCheck className={iconSize} />
          <span>{deliveryInfo.statusText}</span>
        </span>
      );
    case "late":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ${sizeClasses} ${className}`}
        >
          <IconAlertTriangle className={iconSize} />
          <span>{deliveryInfo.statusText}</span>
        </span>
      );
    case "overdue":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 ${sizeClasses} ${className}`}
        >
          <IconAlertCircle className={iconSize} />
          <span>{deliveryInfo.statusText}</span>
        </span>
      );
    case "pending":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-stone-500/10 text-stone-600 dark:text-stone-400 border border-stone-500/20 ${sizeClasses} ${className}`}
        >
          <IconClock className={iconSize} />
          <span>{deliveryInfo.statusText}</span>
        </span>
      );
  }
}

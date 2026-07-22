import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type DeliveryStatusInfo = {
  isCompleted: boolean;
  statusText: string;
  variant: "early" | "ontime" | "late" | "pending" | "overdue" | "none";
  days: number;
};

export function getProjectDeliveryStatus(
  deadline: Date | string | null | undefined,
  completedAt: Date | string | null | undefined,
  status: string
): DeliveryStatusInfo | null {
  if (!deadline) return null;

  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(23, 59, 59, 999);

  if (status === "COMPLETED" || completedAt) {
    const finishDate = completedAt ? new Date(completedAt) : new Date();
    finishDate.setHours(0, 0, 0, 0);

    const targetDate = new Date(deadline);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - finishDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays > 0) {
      return {
        isCompleted: true,
        statusText: `Delivered ${diffDays} day${diffDays > 1 ? "s" : ""} early`,
        variant: "early",
        days: diffDays,
      };
    } else if (diffDays === 0) {
      return {
        isCompleted: true,
        statusText: "Delivered on deadline",
        variant: "ontime",
        days: 0,
      };
    } else {
      const lateDays = Math.abs(diffDays);
      return {
        isCompleted: true,
        statusText: `Delivered ${lateDays} day${lateDays > 1 ? "s" : ""} late`,
        variant: "late",
        days: lateDays,
      };
    }
  } else {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const targetDate = new Date(deadline);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays >= 0) {
      return {
        isCompleted: false,
        statusText: `${diffDays === 0 ? "Due today" : `${diffDays}d remaining`}`,
        variant: "pending",
        days: diffDays,
      };
    } else {
      const overdueDays = Math.abs(diffDays);
      return {
        isCompleted: false,
        statusText: `Overdue ${overdueDays}d`,
        variant: "overdue",
        days: overdueDays,
      };
    }
  }
}


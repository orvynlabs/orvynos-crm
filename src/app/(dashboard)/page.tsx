import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getCoreDashboardMetrics,
  getDashboardChartsData,
  getDashboardActivityFeeds,
} from "@/lib/dashboard";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [metrics, charts, activity] = await Promise.all([
    getCoreDashboardMetrics(),
    getDashboardChartsData(),
    getDashboardActivityFeeds(),
  ]);

  return (
    <DashboardClient
      userName={session.user.name || "Owner"}
      metrics={metrics}
      charts={charts}
      activity={activity}
    />
  );
}

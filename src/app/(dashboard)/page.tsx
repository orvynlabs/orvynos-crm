import { auth } from "@/auth";
import {
  getCoreDashboardMetrics,
  getDashboardChartsData,
  getDashboardActivityFeeds,
} from "@/lib/dashboard";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const [session, metrics, charts, activity] = await Promise.all([
    auth(),
    getCoreDashboardMetrics(),
    getDashboardChartsData(),
    getDashboardActivityFeeds(),
  ]);

  return (
    <DashboardClient
      userName={session?.user?.name || "Owner"}
      metrics={metrics}
      charts={charts}
      activity={activity}
    />
  );
}

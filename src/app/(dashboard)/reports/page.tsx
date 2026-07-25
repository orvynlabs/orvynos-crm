import { getReportsData } from "./actions";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
  const result = await getReportsData("ALL");

  const initialData = result.success && result.data
    ? result.data
    : {
        preset: "ALL",
        summary: { revenue: 0, expenses: 0, netProfit: 0, profitMargin: 0 },
        revenueItems: [],
        expenseItems: [],
        expenseCategories: [],
        projectsReport: [],
        clientsReport: [],
      };

  return <ReportsClient initialData={initialData} />;
}

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLeads } from "./actions";
import { LeadsClient } from "./leads-client";

export default async function LeadsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const res = await getLeads();
  const initialLeads = res.success && res.data ? res.data : [];

  return <LeadsClient initialLeads={initialLeads} />;
}

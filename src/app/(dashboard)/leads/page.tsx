import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLeads, getLeadAssignees } from "./actions";
import { LeadsClient } from "./leads-client";

export default async function LeadsPage() {
  const [session, res, assigneesRes] = await Promise.all([
    auth(),
    getLeads(),
    getLeadAssignees(),
  ]);

  if (!session?.user) {
    redirect("/login");
  }

  const initialLeads = res.success && res.data ? res.data : [];
  const assignees = assigneesRes.success && assigneesRes.data ? assigneesRes.data : [];

  return (
    <LeadsClient
      initialLeads={initialLeads}
      assignees={assignees}
      currentUser={{
        id: session.user.id || "",
        name: session.user.name || "User",
        email: session.user.email || "",
      }}
    />
  );
}

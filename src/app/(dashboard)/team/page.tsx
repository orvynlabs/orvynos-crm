import { auth } from "@/auth";
import { getTeamMembers, getRecentDailyUpdates } from "./actions";
import { TeamListClient } from "./team-list-client";

export default async function TeamPage() {
  const [session, membersRes, updatesRes] = await Promise.all([
    auth(),
    getTeamMembers(),
    getRecentDailyUpdates(),
  ]);

  return (
    <TeamListClient
      currentUser={session?.user || null}
      members={membersRes.data || []}
      initialDailyUpdates={updatesRes.data || []}
    />
  );
}

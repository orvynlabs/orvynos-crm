import { getTeamMembers, getRecentDailyUpdates } from "./actions";
import { TeamListClient } from "./team-list-client";

export default async function TeamPage() {
  const [membersRes, updatesRes] = await Promise.all([
    getTeamMembers(),
    getRecentDailyUpdates(),
  ]);

  return (
    <TeamListClient
      members={membersRes.data || []}
      initialDailyUpdates={updatesRes.data || []}
    />
  );
}

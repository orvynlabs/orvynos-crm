import { notFound } from "next/navigation";
import { getTeamMemberDetail } from "../actions";
import { TeamMemberDetailClient } from "./team-member-detail-client";

export default async function TeamMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getTeamMemberDetail(id);

  if (!res.success || !res.data) {
    notFound();
  }

  return <TeamMemberDetailClient member={res.data as any} />;
}

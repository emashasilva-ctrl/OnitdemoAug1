import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { getVendorVenue, getTeamMembersForSalon, getTeamMemberHours } from "@/lib/data/vendor";
import { TeamMemberList } from "@/components/vendor/team-member-list";
import type { RawOpenHours } from "@/lib/data/vendor";

export default async function VendorTeamPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const vendorVenue = await getVendorVenue(user.id);
  if (!vendorVenue) return null;
  if (vendorVenue.kind !== "salon") redirect("/vendor/dashboard");

  const teamMembers = await getTeamMembersForSalon(vendorVenue.venue.id);
  const hoursEntries = await Promise.all(
    teamMembers.map(async (m) => [m.id, await getTeamMemberHours(m.id)] as const)
  );
  const hoursByMember: Record<string, RawOpenHours[]> = Object.fromEntries(hoursEntries);

  return (
    <TeamMemberList
      salonId={vendorVenue.venue.id}
      teamMembers={teamMembers}
      services={vendorVenue.venue.services}
      hoursByMember={hoursByMember}
    />
  );
}

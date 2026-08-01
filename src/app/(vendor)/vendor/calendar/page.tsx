import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { getCurrentUser } from "@/lib/dal";
import {
  getVendorVenue,
  getAppointmentsForRange,
  getRawOpenHours,
  getTeamMembersForSalon,
  getTeamMemberHours,
} from "@/lib/data/vendor";
import { toLocalISODate } from "@/lib/time";
import { CalendarView } from "@/components/vendor/calendar-view";
import type { RawOpenHours } from "@/lib/data/vendor";

export default async function VendorCalendarPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const vendorVenue = await getVendorVenue(user.id);
  if (!vendorVenue) return null;

  const { kind, venue } = vendorVenue;
  const today = new Date();
  const rangeStart = toLocalISODate(startOfWeek(startOfMonth(today), { weekStartsOn: 1 }));
  const rangeEnd = toLocalISODate(endOfWeek(endOfMonth(today), { weekStartsOn: 1 }));

  const [initialAppointments, initialOpenHours] = await Promise.all([
    getAppointmentsForRange(kind, venue.id, rangeStart, rangeEnd),
    getRawOpenHours(kind, venue.id),
  ]);

  const teamMembers = await getTeamMembersForSalon(venue.id);
  const hoursEntries = await Promise.all(
    teamMembers.map(async (m) => [m.id, await getTeamMemberHours(m.id)] as const)
  );
  const teamMemberHours: Record<string, RawOpenHours[]> = Object.fromEntries(hoursEntries);

  return (
    <CalendarView
      kind="salon"
      venue={venue}
      initialDate={toLocalISODate(today)}
      initialAppointments={initialAppointments}
      initialOpenHours={initialOpenHours}
      teamMembers={teamMembers}
      teamMemberHours={teamMemberHours}
    />
  );
}

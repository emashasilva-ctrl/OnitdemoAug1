import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { getCurrentUser } from "@/lib/dal";
import { getVendorVenue, getAppointmentsForRange, getRawOpenHours } from "@/lib/data/vendor";
import { toLocalISODate } from "@/lib/time";
import { CalendarView } from "@/components/vendor/calendar-view";

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

  return kind === "salon" ? (
    <CalendarView
      kind="salon"
      venue={venue}
      initialDate={toLocalISODate(today)}
      initialAppointments={initialAppointments}
      initialOpenHours={initialOpenHours}
    />
  ) : (
    <CalendarView
      kind="restaurant"
      venue={venue}
      initialDate={toLocalISODate(today)}
      initialAppointments={initialAppointments}
      initialOpenHours={initialOpenHours}
    />
  );
}

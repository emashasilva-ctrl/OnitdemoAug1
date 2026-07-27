"use server";

import { getAppointmentsForRange, type VendorCalendarAppointment } from "@/lib/data/vendor";
import { requireOwnedSalon, requireOwnedRestaurant } from "@/lib/actions/vendor";

export type FetchCalendarResult =
  | { success: true; appointments: VendorCalendarAppointment[] }
  | { success: false; error: string };

export async function fetchCalendarAppointments(
  kind: "salon" | "restaurant",
  venueId: string,
  startDateISO: string,
  endDateISO: string
): Promise<FetchCalendarResult> {
  const check = kind === "salon" ? await requireOwnedSalon(venueId) : await requireOwnedRestaurant(venueId);
  if (!check.ok) return { success: false, error: check.error };

  const appointments = await getAppointmentsForRange(kind, venueId, startDateISO, endDateISO);
  return { success: true, appointments };
}

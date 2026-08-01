"use server";

import { getSalonAnalytics, type SalonAnalytics, type AnalyticsRange } from "@/lib/data/vendor-analytics";
import { requireOwnedSalon } from "@/lib/actions/vendor";
import { toLocalISODate } from "@/lib/time";

export type FetchSalonAnalyticsResult =
  | { success: true; data: SalonAnalytics }
  | { success: false; error: string };

export async function fetchSalonAnalytics(
  salonId: string,
  range: AnalyticsRange
): Promise<FetchSalonAnalyticsResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };

  const data = await getSalonAnalytics(salonId, range, toLocalISODate(new Date()));
  return { success: true, data };
}

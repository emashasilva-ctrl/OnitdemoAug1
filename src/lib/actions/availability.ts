"use server";

import { prisma } from "@/lib/db";
import { minutesToLabel } from "@/lib/time";

export interface TimeSlot {
  minutes: number;
  label: string;
  available: boolean;
}

const STEP_MIN = 30;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

async function computeSlots(
  kind: "SALON" | "RESTAURANT",
  venueId: string,
  durationMins: number,
  dateISO: string
): Promise<TimeSlot[]> {
  const date = new Date(`${dateISO}T00:00:00`);
  const dayLabel = DAY_LABELS[date.getDay()];

  const openHoursRanges = await prisma.openHours.findMany({
    where:
      kind === "SALON"
        ? { salonId: venueId, day: dayLabel }
        : { restaurantId: venueId, day: dayLabel },
  });
  if (openHoursRanges.length === 0) return [];

  const existing = await prisma.appointment.findMany({
    where: {
      kind,
      status: { not: "CANCELLED" },
      date: dateISO,
      ...(kind === "SALON" ? { salonId: venueId } : { restaurantId: venueId }),
    },
    select: { startMinutes: true, durationMins: true },
  });

  const now = new Date();
  const isToday = dateISO === now.toISOString().slice(0, 10);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: TimeSlot[] = [];
  for (const range of openHoursRanges) {
    for (
      let mins = range.openMinutes;
      mins + durationMins <= range.closeMinutes;
      mins += STEP_MIN
    ) {
      const inPast = isToday && mins <= nowMinutes + 30;
      const conflict = existing.some((e) => {
        const eDuration = e.durationMins ?? durationMins;
        return mins < e.startMinutes + eDuration && e.startMinutes < mins + durationMins;
      });
      slots.push({ minutes: mins, label: minutesToLabel(mins), available: !inPast && !conflict });
    }
  }
  slots.sort((a, b) => a.minutes - b.minutes);
  return slots;
}

export async function getSalonAvailability(
  salonId: string,
  durationMins: number,
  dateISO: string
): Promise<TimeSlot[]> {
  return computeSlots("SALON", salonId, durationMins, dateISO);
}

export async function getRestaurantAvailability(
  restaurantId: string,
  durationMins: number,
  dateISO: string
): Promise<TimeSlot[]> {
  return computeSlots("RESTAURANT", restaurantId, durationMins, dateISO);
}

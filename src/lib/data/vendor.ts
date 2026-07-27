import "server-only";
import { prisma } from "@/lib/db";
import { getSalonByOwnerId } from "@/lib/data/salons";
import { getRestaurantByOwnerId } from "@/lib/data/restaurants";
import type { Salon, Restaurant } from "@/lib/types";

export type VendorVenue =
  | { kind: "salon"; venue: Salon }
  | { kind: "restaurant"; venue: Restaurant }
  | null;

export async function getVendorVenue(userId: string): Promise<VendorVenue> {
  const salon = await getSalonByOwnerId(userId);
  if (salon) return { kind: "salon", venue: salon };

  const restaurant = await getRestaurantByOwnerId(userId);
  if (restaurant) return { kind: "restaurant", venue: restaurant };

  return null;
}

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface RawOpenHours {
  id: string;
  day: string;
  openMinutes: number;
  closeMinutes: number;
}

export async function getRawOpenHours(
  kind: "salon" | "restaurant",
  venueId: string
): Promise<RawOpenHours[]> {
  const rows = await prisma.openHours.findMany({
    where: kind === "salon" ? { salonId: venueId } : { restaurantId: venueId },
  });
  return rows
    .map((r) => ({ id: r.id, day: r.day, openMinutes: r.openMinutes, closeMinutes: r.closeMinutes }))
    .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
}

export interface VendorAppointmentListItem {
  id: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  notes: string | null;
  isManual: boolean;
  label: string;
}

export async function getUpcomingAppointmentsForVenue(
  kind: "salon" | "restaurant",
  venueId: string
): Promise<VendorAppointmentListItem[]> {
  const rows = await prisma.appointment.findMany({
    where: {
      status: "UPCOMING",
      ...(kind === "salon" ? { salonId: venueId } : { restaurantId: venueId }),
    },
    include: { service: true },
    orderBy: [{ date: "asc" }, { startMinutes: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    time: row.time,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    notes: row.notes,
    isManual: row.isManual,
    label: kind === "salon" ? (row.service?.name ?? "Appointment") : `Party of ${row.partySize}`,
  }));
}

export interface VendorPromotion {
  id: string;
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
}

export async function getAllPromotionsForVenue(
  kind: "salon" | "restaurant",
  venueId: string
): Promise<VendorPromotion[]> {
  const rows = await prisma.promotion.findMany({
    where: kind === "salon" ? { salonId: venueId } : { restaurantId: venueId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    startDate: r.startDate,
    endDate: r.endDate,
  }));
}

export interface VendorCalendarAppointment {
  id: string;
  date: string;
  time: string;
  startMinutes: number;
  durationMins: number;
  customerName: string;
  customerPhone: string;
  notes: string | null;
  isManual: boolean;
  status: "UPCOMING" | "CANCELLED" | "COMPLETED";
  label: string;
}

export async function getAppointmentsForRange(
  kind: "salon" | "restaurant",
  venueId: string,
  startDateISO: string,
  endDateISO: string
): Promise<VendorCalendarAppointment[]> {
  const rows = await prisma.appointment.findMany({
    where: {
      ...(kind === "salon" ? { salonId: venueId } : { restaurantId: venueId }),
      date: { gte: startDateISO, lte: endDateISO },
    },
    include: { service: true },
    orderBy: [{ date: "asc" }, { startMinutes: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    time: row.time,
    startMinutes: row.startMinutes,
    durationMins: row.durationMins ?? (kind === "salon" ? 60 : 90),
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    notes: row.notes,
    isManual: row.isManual,
    status: row.status,
    label: kind === "salon" ? (row.service?.name ?? "Appointment") : `Party of ${row.partySize}`,
  }));
}

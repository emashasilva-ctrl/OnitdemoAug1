import "server-only";
import { prisma } from "@/lib/db";
import { getSalonByOwnerId } from "@/lib/data/salons";
import { toLocalISODate } from "@/lib/time";
import type { Salon } from "@/lib/types";

// A discriminated union of one for now — a future vertical (e.g. fitness)
// adds its own `{ kind: "fitness"; venue: FitnessStudio }` member here, the
// same way this would have grown if Dining were still around.
export type VendorVenue = { kind: "salon"; venue: Salon } | null;

export async function getVendorVenue(userId: string): Promise<VendorVenue> {
  const salon = await getSalonByOwnerId(userId);
  if (salon) return { kind: "salon", venue: salon };

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
  kind: "salon",
  venueId: string
): Promise<RawOpenHours[]> {
  const rows = await prisma.openHours.findMany({
    where: { salonId: venueId },
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
  kind: "salon",
  venueId: string
): Promise<VendorAppointmentListItem[]> {
  const todayISO = toLocalISODate(new Date());
  const rows = await prisma.appointment.findMany({
    where: {
      status: "UPCOMING",
      date: { gte: todayISO },
      salonId: venueId,
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
    label: row.service?.name ?? "Appointment",
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
  kind: "salon",
  venueId: string
): Promise<VendorPromotion[]> {
  const rows = await prisma.promotion.findMany({
    where: { salonId: venueId },
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
  teamMemberId: string | null;
}

export async function getAppointmentsForRange(
  kind: "salon",
  venueId: string,
  startDateISO: string,
  endDateISO: string
): Promise<VendorCalendarAppointment[]> {
  const rows = await prisma.appointment.findMany({
    where: {
      salonId: venueId,
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
    durationMins: row.durationMins ?? 60,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    notes: row.notes,
    isManual: row.isManual,
    status: row.status,
    label: row.service?.name ?? "Appointment",
    teamMemberId: row.teamMemberId,
  }));
}

export interface VendorTeamMember {
  id: string;
  name: string;
  role: string | null;
  serviceIds: string[];
}

export async function getTeamMembersForSalon(salonId: string): Promise<VendorTeamMember[]> {
  const rows = await prisma.teamMember.findMany({
    where: { salonId },
    include: { services: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    serviceIds: r.services.map((s) => s.id),
  }));
}

export async function getTeamMemberHours(teamMemberId: string): Promise<RawOpenHours[]> {
  const rows = await prisma.teamMemberHours.findMany({ where: { teamMemberId } });
  return rows
    .map((r) => ({ id: r.id, day: r.day, openMinutes: r.openMinutes, closeMinutes: r.closeMinutes }))
    .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
}

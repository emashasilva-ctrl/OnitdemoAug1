import "server-only";
import { prisma } from "@/lib/db";
import { getSalonByOwnerId } from "@/lib/data/salons";
import { toLocalISODate } from "@/lib/time";
import type { Salon } from "@/lib/types";
import type { BillLineItem } from "@/lib/billing";

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
  status: "UPCOMING" | "CHECKED_IN" | "NO_SHOW" | "CANCELLED" | "COMPLETED";
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

export interface VendorTodayAppointment {
  id: string;
  time: string;
  startMinutes: number;
  customerName: string;
  customerPhone: string;
  notes: string | null;
  isManual: boolean;
  label: string;
  status: "UPCOMING" | "CHECKED_IN" | "NO_SHOW" | "COMPLETED";
  priceLKR: number | null;
  basePriceLKR: number | null;
  appliedRuleLabel: string | null;
  billId: string | null;
}

export interface VendorTodaySections {
  upcoming: VendorTodayAppointment[];
  previous: VendorTodayAppointment[];
}

export async function getTodayAppointmentsForVenue(
  kind: "salon",
  venueId: string
): Promise<VendorTodaySections> {
  const now = new Date();
  const todayISO = toLocalISODate(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const rows = await prisma.appointment.findMany({
    where: { salonId: venueId, date: todayISO, status: { not: "CANCELLED" } },
    include: { service: true, bill: { select: { id: true } } },
    orderBy: [{ startMinutes: "asc" }],
  });

  const upcoming: VendorTodayAppointment[] = [];
  const previous: VendorTodayAppointment[] = [];

  for (const row of rows) {
    const item: VendorTodayAppointment = {
      id: row.id,
      time: row.time,
      startMinutes: row.startMinutes,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      notes: row.notes,
      isManual: row.isManual,
      label: row.service?.name ?? "Appointment",
      status: row.status as VendorTodayAppointment["status"],
      priceLKR: row.priceLKR,
      basePriceLKR: row.basePriceLKR,
      appliedRuleLabel: row.appliedRuleLabel,
      billId: row.bill?.id ?? null,
    };
    (row.startMinutes > nowMinutes ? upcoming : previous).push(item);
  }

  return { upcoming, previous };
}

export interface VendorBillListItem {
  id: string;
  createdAt: string;
  customerName: string;
  serviceLabel: string;
  appointmentDate: string;
  totalLKR: number;
  emailSentAt: string | null;
  whatsappSentAt: string | null;
}

export async function getBillsForSalon(salonId: string): Promise<VendorBillListItem[]> {
  const rows = await prisma.bill.findMany({
    where: { salonId },
    include: { appointment: { include: { service: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    customerName: r.customerName,
    serviceLabel: r.appointment.service?.name ?? "Appointment",
    appointmentDate: r.appointment.date,
    totalLKR: r.totalLKR,
    emailSentAt: r.emailSentAt?.toISOString() ?? null,
    whatsappSentAt: r.whatsappSentAt?.toISOString() ?? null,
  }));
}

export interface VendorBillDetail {
  id: string;
  appointmentId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  lineItems: BillLineItem[];
  totalLKR: number;
  createdAt: string;
  emailSentAt: string | null;
  whatsappSentAt: string | null;
  appointmentDate: string;
  appointmentTime: string;
  serviceLabel: string;
}

export async function getBillById(
  billId: string,
  salonId: string
): Promise<VendorBillDetail | null> {
  const row = await prisma.bill.findFirst({
    where: { id: billId, salonId },
    include: { appointment: { include: { service: true } } },
  });
  if (!row) return null;
  return {
    id: row.id,
    appointmentId: row.appointmentId,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    lineItems: JSON.parse(row.lineItems) as BillLineItem[],
    totalLKR: row.totalLKR,
    createdAt: row.createdAt.toISOString(),
    emailSentAt: row.emailSentAt?.toISOString() ?? null,
    whatsappSentAt: row.whatsappSentAt?.toISOString() ?? null,
    appointmentDate: row.appointment.date,
    appointmentTime: row.appointment.time,
    serviceLabel: row.appointment.service?.name ?? "Appointment",
  };
}

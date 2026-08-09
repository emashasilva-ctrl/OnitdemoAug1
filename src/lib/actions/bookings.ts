"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, verifySession } from "@/lib/dal";
import { computePrice, type PricingRuleRow } from "@/lib/pricing";
import { sendEmail } from "@/lib/email";
import { bookingConfirmationEmail, cancellationEmail, newBookingVendorEmail } from "@/lib/email-templates";
import type { AppointmentRecord } from "@/lib/types";

export type BookingActionResult = { success: true } | { success: false; error: string };

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function createSalonBooking(input: {
  salonId: string;
  serviceId: string;
  durationMins: number;
  date: string;
  time: string;
  startMinutes: number;
  customerName: string;
  customerPhone: string;
  notes?: string;
}): Promise<BookingActionResult> {
  const session = await verifySession();
  if (!session) return { success: false, error: "You must be logged in to book." };

  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!service || service.salonId !== input.salonId) {
    return { success: false, error: "Service not found." };
  }

  const rules = await prisma.pricingRule.findMany({
    where: { salonId: input.salonId, enabled: true },
    include: { services: { select: { id: true } } },
  });
  const ruleRows: PricingRuleRow[] = rules.map((r) => ({
    id: r.id,
    label: r.label,
    type: r.type,
    amountType: r.amountType,
    amount: r.amount,
    days: JSON.parse(r.days) as string[],
    startMinutes: r.startMinutes,
    endMinutes: r.endMinutes,
    enabled: r.enabled,
    appliesToAllServices: r.appliesToAllServices,
    serviceIds: r.services.map((s) => s.id),
  }));

  const dayLabel = DAY_LABELS[new Date(`${input.date}T00:00:00`).getDay()];
  const breakdown = computePrice(service.priceLKR, service.id, ruleRows, dayLabel, input.startMinutes);

  const salon = await prisma.salon.findUnique({
    where: { id: input.salonId },
    select: { name: true, owner: { select: { email: true, name: true } } },
  });

  await prisma.appointment.create({
    data: {
      kind: "SALON",
      status: "UPCOMING",
      date: input.date,
      time: input.time,
      startMinutes: input.startMinutes,
      customerId: session.userId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      notes: input.notes,
      salonId: input.salonId,
      serviceId: input.serviceId,
      durationMins: input.durationMins,
      priceLKR: breakdown.finalPriceLKR,
      basePriceLKR: breakdown.basePriceLKR,
      appliedRuleLabel: breakdown.appliedRule?.label ?? null,
    },
  });

  const customer = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });
  if (customer?.email && salon) {
    await sendEmail({
      to: customer.email,
      ...bookingConfirmationEmail({
        customerName: input.customerName,
        salonName: salon.name,
        serviceName: service.name,
        date: input.date,
        time: input.time,
        priceLKR: breakdown.finalPriceLKR,
      }),
    });
  }
  if (salon?.owner?.email) {
    await sendEmail({
      to: salon.owner.email,
      ...newBookingVendorEmail({
        vendorName: salon.owner.name,
        salonName: salon.name,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        serviceName: service.name,
        date: input.date,
        time: input.time,
        priceLKR: breakdown.finalPriceLKR,
      }),
    });
  }

  revalidatePath("/bookings");
  return { success: true };
}

export async function cancelAppointmentAction(id: string): Promise<BookingActionResult> {
  const session = await verifySession();
  if (!session) return { success: false, error: "You must be logged in." };

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: {
      customerId: true,
      customerName: true,
      priceLKR: true,
      date: true,
      time: true,
      salon: { select: { name: true, cancellationFeeEnabled: true, cancellationFeePercent: true } },
      service: { select: { name: true } },
    },
  });
  if (!appointment || appointment.customerId !== session.userId) {
    return { success: false, error: "Booking not found." };
  }

  const feeLKR =
    appointment.salon?.cancellationFeeEnabled && appointment.priceLKR
      ? Math.round((appointment.priceLKR * appointment.salon.cancellationFeePercent) / 100)
      : null;

  await prisma.appointment.updateMany({
    where: { id, customerId: session.userId },
    data: { status: "CANCELLED", cancellationFeeLKR: feeLKR },
  });

  const customer = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });
  if (customer?.email && appointment.salon && appointment.service) {
    await sendEmail({
      to: customer.email,
      ...cancellationEmail({
        customerName: appointment.customerName,
        salonName: appointment.salon.name,
        serviceName: appointment.service.name,
        date: appointment.date,
        time: appointment.time,
        cancellationFeeLKR: feeLKR,
      }),
    });
  }

  revalidatePath("/bookings");
  return { success: true };
}

export type AppointmentListItem = AppointmentRecord & {
  venueSlug: string | null;
  cancellationFeeEnabled: boolean;
  cancellationFeePercent: number;
};

export async function getMyAppointments(): Promise<AppointmentListItem[]> {
  const user = await requireUser("/bookings");

  const rows = await prisma.appointment.findMany({
    where: { customerId: user.id },
    include: { salon: true, service: true },
    orderBy: { date: "desc" },
  });

  return rows.map((row): AppointmentListItem => ({
    id: row.id,
    date: row.date,
    time: row.time,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    status: row.status.toLowerCase() as "upcoming" | "cancelled" | "completed",
    kind: "salon",
    salonId: row.salonId!,
    salonName: row.salon!.name,
    salonArea: row.salon!.area,
    serviceId: row.serviceId!,
    serviceName: row.service!.name,
    priceLKR: row.priceLKR!,
    basePriceLKR: row.basePriceLKR,
    appliedRuleLabel: row.appliedRuleLabel,
    cancellationFeeLKR: row.cancellationFeeLKR,
    durationMins: row.durationMins!,
    venueSlug: row.salon?.slug ?? null,
    cancellationFeeEnabled: row.salon?.cancellationFeeEnabled ?? false,
    cancellationFeePercent: row.salon?.cancellationFeePercent ?? 0,
  }));
}

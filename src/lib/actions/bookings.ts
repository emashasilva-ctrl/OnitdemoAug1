"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, verifySession } from "@/lib/dal";
import type { AppointmentRecord } from "@/lib/types";

export type BookingActionResult = { success: true } | { success: false; error: string };

export async function createSalonBooking(input: {
  salonId: string;
  serviceId: string;
  priceLKR: number;
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
      priceLKR: input.priceLKR,
    },
  });

  revalidatePath("/bookings");
  return { success: true };
}

export async function createRestaurantReservation(input: {
  restaurantId: string;
  partySize: number;
  date: string;
  time: string;
  startMinutes: number;
  customerName: string;
  customerPhone: string;
  notes?: string;
  cardLast4: string;
}): Promise<BookingActionResult> {
  const session = await verifySession();
  if (!session) return { success: false, error: "You must be logged in to reserve a table." };

  await prisma.appointment.create({
    data: {
      kind: "RESTAURANT",
      status: "UPCOMING",
      date: input.date,
      time: input.time,
      startMinutes: input.startMinutes,
      customerId: session.userId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      notes: input.notes,
      restaurantId: input.restaurantId,
      partySize: input.partySize,
      durationMins: 90,
      cardLast4: input.cardLast4,
    },
  });

  revalidatePath("/bookings");
  return { success: true };
}

export async function cancelAppointmentAction(id: string): Promise<BookingActionResult> {
  const session = await verifySession();
  if (!session) return { success: false, error: "You must be logged in." };

  await prisma.appointment.updateMany({
    where: { id, customerId: session.userId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/bookings");
  return { success: true };
}

export type AppointmentListItem = AppointmentRecord & { venueSlug: string | null };

export async function getMyAppointments(): Promise<AppointmentListItem[]> {
  const user = await requireUser("/bookings");

  const rows = await prisma.appointment.findMany({
    where: { customerId: user.id },
    include: { salon: true, restaurant: true, service: true },
    orderBy: { date: "desc" },
  });

  return rows.map((row): AppointmentListItem => {
    const base = {
      id: row.id,
      date: row.date,
      time: row.time,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      notes: row.notes ?? undefined,
      createdAt: row.createdAt.toISOString(),
      status: row.status.toLowerCase() as "upcoming" | "cancelled" | "completed",
    };

    if (row.kind === "SALON") {
      return {
        ...base,
        kind: "salon",
        salonId: row.salonId!,
        salonName: row.salon!.name,
        salonArea: row.salon!.area,
        serviceId: row.serviceId!,
        serviceName: row.service!.name,
        priceLKR: row.priceLKR!,
        durationMins: row.durationMins!,
        venueSlug: row.salon?.slug ?? null,
      };
    }

    return {
      ...base,
      kind: "restaurant",
      restaurantId: row.restaurantId!,
      restaurantName: row.restaurant!.name,
      restaurantArea: row.restaurant!.area,
      partySize: row.partySize!,
      cardLast4: row.cardLast4!,
      venueSlug: row.restaurant?.slug ?? null,
    };
  });
}

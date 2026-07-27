"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwnedSalon, requireOwnedRestaurant } from "@/lib/actions/vendor";
import type { VendorActionResult } from "@/lib/actions/vendor";

export interface ManualSalonBookingInput {
  salonId: string;
  serviceId: string;
  date: string;
  startMinutes: number;
  time: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
}

export async function createManualSalonBooking(
  input: ManualSalonBookingInput
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(input.salonId);
  if (!check.ok) return { success: false, error: check.error };

  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!service || service.salonId !== input.salonId) {
    return { success: false, error: "Service not found." };
  }

  await prisma.appointment.create({
    data: {
      kind: "SALON",
      status: "UPCOMING",
      date: input.date,
      time: input.time,
      startMinutes: input.startMinutes,
      customerId: null,
      isManual: true,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      notes: input.notes,
      salonId: input.salonId,
      serviceId: input.serviceId,
      durationMins: service.durationMins,
      priceLKR: service.priceLKR,
    },
  });

  revalidatePath("/vendor/dashboard");
  return { success: true };
}

export interface ManualRestaurantBookingInput {
  restaurantId: string;
  partySize: number;
  date: string;
  startMinutes: number;
  time: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
}

export async function createManualRestaurantBooking(
  input: ManualRestaurantBookingInput
): Promise<VendorActionResult> {
  const check = await requireOwnedRestaurant(input.restaurantId);
  if (!check.ok) return { success: false, error: check.error };

  await prisma.appointment.create({
    data: {
      kind: "RESTAURANT",
      status: "UPCOMING",
      date: input.date,
      time: input.time,
      startMinutes: input.startMinutes,
      customerId: null,
      isManual: true,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      notes: input.notes,
      restaurantId: input.restaurantId,
      partySize: input.partySize,
      durationMins: 90,
    },
  });

  revalidatePath("/vendor/dashboard");
  return { success: true };
}

export async function cancelVendorAppointment(
  appointmentId: string,
  venueKind: "salon" | "restaurant",
  venueId: string
): Promise<VendorActionResult> {
  const check =
    venueKind === "salon"
      ? await requireOwnedSalon(venueId)
      : await requireOwnedRestaurant(venueId);
  if (!check.ok) return { success: false, error: check.error };

  await prisma.appointment.updateMany({
    where: {
      id: appointmentId,
      ...(venueKind === "salon" ? { salonId: venueId } : { restaurantId: venueId }),
    },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/vendor/dashboard");
  return { success: true };
}

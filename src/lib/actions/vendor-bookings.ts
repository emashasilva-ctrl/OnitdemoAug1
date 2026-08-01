"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwnedSalon } from "@/lib/actions/vendor";
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
  teamMemberId?: string | null;
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

  if (input.teamMemberId) {
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: input.teamMemberId },
      select: { salonId: true },
    });
    if (!teamMember || teamMember.salonId !== input.salonId) {
      return { success: false, error: "Team member not found." };
    }
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
      teamMemberId: input.teamMemberId || null,
    },
  });

  revalidatePath("/vendor/dashboard");
  return { success: true };
}

export async function cancelVendorAppointment(
  appointmentId: string,
  venueKind: "salon",
  venueId: string
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(venueId);
  if (!check.ok) return { success: false, error: check.error };

  await prisma.appointment.updateMany({
    where: { id: appointmentId, salonId: venueId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/vendor/dashboard");
  return { success: true };
}

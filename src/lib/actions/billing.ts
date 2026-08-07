"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwnedSalon } from "@/lib/actions/vendor";
import type { VendorActionResult } from "@/lib/actions/vendor";
import { getBillById, type VendorBillDetail } from "@/lib/data/vendor";
import { sendEmail } from "@/lib/email";
import { billEmail } from "@/lib/email-templates";
import type { BillLineItem, BillLineItemKind } from "@/lib/billing";

function revalidateBilling() {
  revalidatePath("/vendor/dashboard");
  revalidatePath("/vendor/bills");
}

export async function markCheckedIn(
  appointmentId: string,
  salonId: string
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };

  const result = await prisma.appointment.updateMany({
    where: { id: appointmentId, salonId, status: "UPCOMING" },
    data: { status: "CHECKED_IN" },
  });
  if (result.count === 0) {
    return { success: false, error: "This appointment can no longer be checked in." };
  }

  revalidateBilling();
  return { success: true };
}

export async function markNoShow(
  appointmentId: string,
  salonId: string
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };

  const result = await prisma.appointment.updateMany({
    where: { id: appointmentId, salonId, status: "UPCOMING" },
    data: { status: "NO_SHOW" },
  });
  if (result.count === 0) {
    return { success: false, error: "This appointment can no longer be marked a no-show." };
  }

  revalidateBilling();
  return { success: true };
}

export interface BillLineItemInput {
  label: string;
  amountLKR: number;
  kind: BillLineItemKind;
}

export interface GenerateBillInput {
  appointmentId: string;
  salonId: string;
  lineItems: BillLineItemInput[];
}

function validateLineItems(lineItems: BillLineItemInput[]): string | null {
  if (lineItems.length === 0) return "Add at least one line item.";
  if (lineItems.length > 20) return "A bill can have at most 20 line items.";
  for (const item of lineItems) {
    if (!item.label.trim()) return "Every line item needs a label.";
    if (item.label.length > 120) return "Line item labels must be 120 characters or fewer.";
    if (!Number.isFinite(item.amountLKR) || !Number.isInteger(item.amountLKR)) {
      return "Line item amounts must be whole numbers.";
    }
  }
  return null;
}

export async function generateBill(
  input: GenerateBillInput
): Promise<VendorActionResult & { bill?: VendorBillDetail }> {
  const check = await requireOwnedSalon(input.salonId);
  if (!check.ok) return { success: false, error: check.error };

  const validationError = validateLineItems(input.lineItems);
  if (validationError) return { success: false, error: validationError };

  const appointment = await prisma.appointment.findFirst({
    where: { id: input.appointmentId, salonId: input.salonId },
    include: { customer: { select: { email: true } } },
  });
  if (!appointment) return { success: false, error: "Appointment not found." };
  if (appointment.status !== "CHECKED_IN" && appointment.status !== "NO_SHOW") {
    return {
      success: false,
      error: "This appointment must be checked in or marked a no-show before billing.",
    };
  }

  const lineItems: BillLineItem[] = input.lineItems.map((item) => ({
    label: item.label.trim(),
    amountLKR: item.amountLKR,
    kind: item.kind,
  }));
  const totalLKR = lineItems.reduce((sum, item) => sum + item.amountLKR, 0);

  const bill = await prisma.$transaction(async (tx) => {
    const created = await tx.bill.create({
      data: {
        appointmentId: appointment.id,
        salonId: input.salonId,
        customerName: appointment.customerName,
        customerPhone: appointment.customerPhone,
        customerEmail: appointment.customer?.email ?? null,
        lineItems: JSON.stringify(lineItems),
        totalLKR,
      },
    });
    await tx.appointment.update({
      where: { id: appointment.id },
      data: { status: "COMPLETED" },
    });
    return created;
  });

  revalidateBilling();

  const detail = await getBillById(bill.id, input.salonId);
  return { success: true, bill: detail ?? undefined };
}

export async function markBillEmailSent(
  billId: string,
  salonId: string
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };

  const bill = await prisma.bill.findFirst({
    where: { id: billId, salonId },
    include: { salon: { select: { name: true } }, appointment: { include: { service: true } } },
  });
  if (!bill) return { success: false, error: "Bill not found." };
  if (!bill.customerEmail) {
    return { success: false, error: "No email on file for this booking." };
  }

  const sent = await sendEmail({
    to: bill.customerEmail,
    ...billEmail({
      customerName: bill.customerName,
      salonName: bill.salon.name,
      serviceLabel: bill.appointment.service?.name ?? "Appointment",
      lineItems: JSON.parse(bill.lineItems) as BillLineItem[],
      totalLKR: bill.totalLKR,
    }),
  });
  if (!sent) return { success: false, error: "Couldn't send the email. Please try again." };

  await prisma.bill.update({ where: { id: billId }, data: { emailSentAt: new Date() } });
  revalidateBilling();
  return { success: true };
}

export async function markBillWhatsAppSent(
  billId: string,
  salonId: string
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };

  const bill = await prisma.bill.findFirst({ where: { id: billId, salonId } });
  if (!bill) return { success: false, error: "Bill not found." };

  await prisma.bill.update({ where: { id: billId }, data: { whatsappSentAt: new Date() } });
  revalidateBilling();
  return { success: true };
}

export async function getBillDetail(
  billId: string,
  salonId: string
): Promise<VendorBillDetail | null> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return null;
  return getBillById(billId, salonId);
}

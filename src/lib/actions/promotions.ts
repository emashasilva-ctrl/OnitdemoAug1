"use server";

import { prisma } from "@/lib/db";
import { requireOwnedSalon, revalidateVendorAndPublic } from "@/lib/actions/vendor";
import type { VendorActionResult } from "@/lib/actions/vendor";

export interface PromotionInput {
  venueKind: "salon";
  venueId: string;
  title: string;
  description: string;
  startDate?: string | null;
  endDate?: string | null;
}

async function checkOwnership(venueKind: "salon", venueId: string) {
  return requireOwnedSalon(venueId);
}

function slugFromCheck(check: Awaited<ReturnType<typeof checkOwnership>>): string {
  if (!check.ok) throw new Error("unreachable");
  return check.salon.slug;
}

export async function createPromotion(input: PromotionInput): Promise<VendorActionResult> {
  const check = await checkOwnership(input.venueKind, input.venueId);
  if (!check.ok) return { success: false, error: check.error };
  if (input.startDate && input.endDate && input.startDate > input.endDate) {
    return { success: false, error: "Start date must be before end date." };
  }

  await prisma.promotion.create({
    data: {
      title: input.title,
      description: input.description,
      startDate: input.startDate || null,
      endDate: input.endDate || null,
      salonId: input.venueId,
    },
  });
  await revalidateVendorAndPublic(input.venueKind, slugFromCheck(check));
  return { success: true };
}

export async function updatePromotion(id: string, input: PromotionInput): Promise<VendorActionResult> {
  const check = await checkOwnership(input.venueKind, input.venueId);
  if (!check.ok) return { success: false, error: check.error };
  if (input.startDate && input.endDate && input.startDate > input.endDate) {
    return { success: false, error: "Start date must be before end date." };
  }

  await prisma.promotion.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      startDate: input.startDate || null,
      endDate: input.endDate || null,
    },
  });
  await revalidateVendorAndPublic(input.venueKind, slugFromCheck(check));
  return { success: true };
}

export async function deletePromotion(
  id: string,
  venueKind: "salon",
  venueId: string
): Promise<VendorActionResult> {
  const check = await checkOwnership(venueKind, venueId);
  if (!check.ok) return { success: false, error: check.error };

  await prisma.promotion.deleteMany({
    where: { id, salonId: venueId },
  });
  await revalidateVendorAndPublic(venueKind, slugFromCheck(check));
  return { success: true };
}

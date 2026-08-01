"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { categories } from "@/lib/data/categories";
import { hasInvalidOrOverlappingRanges } from "@/lib/time";
import type { CategorySlug } from "@/lib/types";

export type VendorActionResult = { success: true } | { success: false; error: string };

export type OwnedSalonCheck = { ok: false; error: string } | { ok: true; salon: { slug: string } };

export async function requireOwnedSalon(salonId: string): Promise<OwnedSalonCheck> {
  const session = await verifySession();
  if (!session) return { ok: false, error: "You must be logged in." };

  const salon = await prisma.salon.findUnique({ where: { id: salonId }, select: { ownerId: true, slug: true } });
  if (!salon || salon.ownerId !== session.userId) {
    return { ok: false, error: "You don't have permission to edit this salon." };
  }
  return { ok: true, salon };
}

export async function revalidateVendorAndPublic(kind: "salon", slug: string) {
  revalidatePath("/vendor/dashboard");
  revalidatePath("/vendor/services");
  revalidatePath("/vendor/hours");
  revalidatePath("/vendor/promotions");
  revalidatePath(`/beauty/salons/${slug}`);
  revalidatePath("/beauty/salons");
  revalidatePath("/beauty");
}

// ---- Venue categories (salon) ----

export async function updateSalonCategories(
  salonId: string,
  categorySlugs: CategorySlug[]
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };
  if (categorySlugs.length === 0) {
    return { success: false, error: "Pick at least one category." };
  }
  const validSlugs = new Set(categories.map((c) => c.slug));
  if (!categorySlugs.every((c) => validSlugs.has(c))) {
    return { success: false, error: "Invalid category." };
  }

  await prisma.salon.update({
    where: { id: salonId },
    data: { categories: JSON.stringify(categorySlugs) },
  });
  await revalidateVendorAndPublic("salon", check.salon.slug);
  return { success: true };
}

// ---- MioSalon booking widget (salon) ----

export async function updateMioSalonEmbedCode(
  salonId: string,
  embedCode: string
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };

  const trimmed = embedCode.trim();
  // Deliberately light validation, not full HTML sanitization: vendors are a
  // semi-trusted onboarded party, this just guards against pasting something
  // unrelated. If MioSalon's snippet ever changes shape, adjust this check.
  if (trimmed && !trimmed.toLowerCase().includes("miosalon")) {
    return { success: false, error: "That doesn't look like a MioSalon embed code." };
  }

  await prisma.salon.update({
    where: { id: salonId },
    data: { mioSalonEmbedCode: trimmed || null },
  });
  await revalidateVendorAndPublic("salon", check.salon.slug);
  return { success: true };
}

// ---- Services (salon) ----

export interface ServiceInput {
  salonId: string;
  name: string;
  category: string;
  durationMins: number;
  priceLKR: number;
  description: string;
}

export async function createService(input: ServiceInput): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(input.salonId);
  if (!check.ok) return { success: false, error: check.error };

  await prisma.service.create({
    data: {
      salonId: input.salonId,
      name: input.name,
      category: input.category,
      durationMins: input.durationMins,
      priceLKR: input.priceLKR,
      description: input.description,
    },
  });
  await revalidateVendorAndPublic("salon", check.salon.slug);
  return { success: true };
}

export async function updateService(
  id: string,
  input: ServiceInput
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(input.salonId);
  if (!check.ok) return { success: false, error: check.error };

  await prisma.service.update({
    where: { id },
    data: {
      name: input.name,
      category: input.category,
      durationMins: input.durationMins,
      priceLKR: input.priceLKR,
      description: input.description,
    },
  });
  await revalidateVendorAndPublic("salon", check.salon.slug);
  return { success: true };
}

export async function deleteService(id: string, salonId: string): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };

  await prisma.service.delete({ where: { id } });
  await revalidateVendorAndPublic("salon", check.salon.slug);
  return { success: true };
}

// ---- Operating hours ----

export interface HoursInput {
  day: string;
  openMinutes: number;
  closeMinutes: number;
}

export async function updateSalonHours(
  salonId: string,
  hours: HoursInput[]
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };
  if (hasInvalidOrOverlappingRanges(hours)) {
    return { success: false, error: "Time ranges overlap or are invalid." };
  }

  await prisma.$transaction([
    prisma.openHours.deleteMany({ where: { salonId } }),
    prisma.openHours.createMany({
      data: hours.map((h) => ({ salonId, day: h.day, openMinutes: h.openMinutes, closeMinutes: h.closeMinutes })),
    }),
  ]);
  await revalidateVendorAndPublic("salon", check.salon.slug);
  return { success: true };
}

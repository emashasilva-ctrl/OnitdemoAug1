"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { categories } from "@/lib/data/categories";
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

export type OwnedRestaurantCheck =
  | { ok: false; error: string }
  | { ok: true; restaurant: { slug: string } };

export async function requireOwnedRestaurant(restaurantId: string): Promise<OwnedRestaurantCheck> {
  const session = await verifySession();
  if (!session) return { ok: false, error: "You must be logged in." };

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { ownerId: true, slug: true },
  });
  if (!restaurant || restaurant.ownerId !== session.userId) {
    return { ok: false, error: "You don't have permission to edit this restaurant." };
  }
  return { ok: true, restaurant };
}

export async function revalidateVendorAndPublic(kind: "salon" | "restaurant", slug: string) {
  revalidatePath("/vendor/dashboard");
  revalidatePath("/vendor/services");
  revalidatePath("/vendor/hours");
  if (kind === "salon") {
    revalidatePath("/vendor/promotions");
    revalidatePath(`/beauty/salons/${slug}`);
    revalidatePath("/beauty/salons");
    revalidatePath("/beauty");
  } else {
    revalidatePath(`/dining/restaurants/${slug}`);
    revalidatePath("/dining/restaurants");
    revalidatePath("/dining");
  }
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

// ---- Menu highlights (restaurant) ----

export interface MenuHighlightInput {
  restaurantId: string;
  name: string;
  priceLKR: number;
  description: string;
}

export async function createMenuHighlight(
  input: MenuHighlightInput
): Promise<VendorActionResult> {
  const check = await requireOwnedRestaurant(input.restaurantId);
  if (!check.ok) return { success: false, error: check.error };

  await prisma.menuHighlight.create({
    data: {
      restaurantId: input.restaurantId,
      name: input.name,
      priceLKR: input.priceLKR,
      description: input.description,
    },
  });
  await revalidateVendorAndPublic("restaurant", check.restaurant.slug);
  return { success: true };
}

export async function updateMenuHighlight(
  id: string,
  input: MenuHighlightInput
): Promise<VendorActionResult> {
  const check = await requireOwnedRestaurant(input.restaurantId);
  if (!check.ok) return { success: false, error: check.error };

  await prisma.menuHighlight.update({
    where: { id },
    data: {
      name: input.name,
      priceLKR: input.priceLKR,
      description: input.description,
    },
  });
  await revalidateVendorAndPublic("restaurant", check.restaurant.slug);
  return { success: true };
}

export async function deleteMenuHighlight(
  id: string,
  restaurantId: string
): Promise<VendorActionResult> {
  const check = await requireOwnedRestaurant(restaurantId);
  if (!check.ok) return { success: false, error: check.error };

  await prisma.menuHighlight.delete({ where: { id } });
  await revalidateVendorAndPublic("restaurant", check.restaurant.slug);
  return { success: true };
}

// ---- Operating hours ----

export interface HoursInput {
  day: string;
  openMinutes: number;
  closeMinutes: number;
}

function hasInvalidOrOverlappingRanges(hours: HoursInput[]): boolean {
  const byDay = new Map<string, HoursInput[]>();
  for (const h of hours) {
    if (h.openMinutes >= h.closeMinutes) return true;
    if (!byDay.has(h.day)) byDay.set(h.day, []);
    byDay.get(h.day)!.push(h);
  }
  for (const ranges of byDay.values()) {
    const sorted = [...ranges].sort((a, b) => a.openMinutes - b.openMinutes);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].openMinutes < sorted[i - 1].closeMinutes) return true;
    }
  }
  return false;
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

export async function updateRestaurantHours(
  restaurantId: string,
  hours: HoursInput[]
): Promise<VendorActionResult> {
  const check = await requireOwnedRestaurant(restaurantId);
  if (!check.ok) return { success: false, error: check.error };
  if (hasInvalidOrOverlappingRanges(hours)) {
    return { success: false, error: "Time ranges overlap or are invalid." };
  }

  await prisma.$transaction([
    prisma.openHours.deleteMany({ where: { restaurantId } }),
    prisma.openHours.createMany({
      data: hours.map((h) => ({
        restaurantId,
        day: h.day,
        openMinutes: h.openMinutes,
        closeMinutes: h.closeMinutes,
      })),
    }),
  ]);
  await revalidateVendorAndPublic("restaurant", check.restaurant.slug);
  return { success: true };
}

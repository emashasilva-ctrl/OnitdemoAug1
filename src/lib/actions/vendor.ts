"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { categories } from "@/lib/data/categories";
import { AMENITIES } from "@/lib/data/amenities";
import { hasInvalidOrOverlappingRanges } from "@/lib/time";
import { slugify } from "@/lib/slug";
import { isValidIntlPhone } from "@/lib/phone";
import type { CategorySlug } from "@/lib/types";

// Colombo city-center fallback — used when a vendor never picks a
// suggestion from the address autocomplete (they can still free-type an
// address without one).
const DEFAULT_LAT = 6.9271;
const DEFAULT_LNG = 79.8612;

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

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

// ---- Salon creation (self-serve setup) ----

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "salon";
  let slug = base;
  let suffix = 2;
  while (await prisma.salon.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export interface CreateSalonInput {
  name: string;
  tagline: string;
  area: string;
  address: string;
  lat?: number;
  lng?: number;
  phone: string;
  whatsappNumber: string;
  priceLevel: 1 | 2 | 3;
  categories: CategorySlug[];
  about: string;
  amenities: string[];
}

export async function createSalon(input: CreateSalonInput): Promise<VendorActionResult> {
  const session = await verifySession();
  if (!session) return { success: false, error: "You must be logged in." };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user?.isVendor) return { success: false, error: "You must be a vendor to set up a salon." };

  const existing = await prisma.salon.findFirst({ where: { ownerId: session.userId } });
  if (existing) return { success: false, error: "You already have a salon set up." };

  if (
    !input.name.trim() ||
    !input.tagline.trim() ||
    !input.area.trim() ||
    !input.address.trim() ||
    !input.phone.trim() ||
    !input.whatsappNumber.trim()
  ) {
    return { success: false, error: "Please fill in every field." };
  }
  if (!isValidIntlPhone(input.phone)) {
    return { success: false, error: "Mobile number must start with a country code, e.g. +94 123456789." };
  }
  if (!isValidIntlPhone(input.whatsappNumber)) {
    return { success: false, error: "WhatsApp number must start with a country code, e.g. +94 123456789." };
  }
  if (input.categories.length === 0) {
    return { success: false, error: "Pick at least one category." };
  }
  const validCategorySlugs = new Set(categories.map((c) => c.slug));
  if (!input.categories.every((c) => validCategorySlugs.has(c))) {
    return { success: false, error: "Invalid category." };
  }
  const validAmenities = new Set<string>(AMENITIES);
  if (!input.amenities.every((a) => validAmenities.has(a))) {
    return { success: false, error: "Invalid amenity." };
  }
  if (![1, 2, 3].includes(input.priceLevel)) {
    return { success: false, error: "Invalid price level." };
  }
  if (
    (input.lat !== undefined || input.lng !== undefined) &&
    !isValidLatLng(input.lat ?? NaN, input.lng ?? NaN)
  ) {
    return { success: false, error: "Invalid location." };
  }

  const slug = await generateUniqueSlug(input.name);

  await prisma.salon.create({
    data: {
      slug,
      ownerId: session.userId,
      name: input.name.trim(),
      tagline: input.tagline.trim(),
      area: input.area.trim(),
      address: input.address.trim(),
      lat: input.lat ?? DEFAULT_LAT,
      lng: input.lng ?? DEFAULT_LNG,
      categories: JSON.stringify(input.categories),
      rating: 0,
      reviewCount: 0,
      priceLevel: input.priceLevel,
      imageSeed: slug,
      gallerySeeds: JSON.stringify([`${slug}-a`, `${slug}-b`, `${slug}-c`]),
      about: input.about.trim(),
      amenities: JSON.stringify(input.amenities),
      featured: false,
      phone: input.phone.trim(),
      whatsappNumber: input.whatsappNumber.trim(),
    },
  });

  revalidatePath("/vendor/dashboard");
  revalidatePath("/beauty/salons");
  revalidatePath("/beauty");
  redirect("/vendor/services");
}

// ---- Salon profile (post-setup editing of the core details) ----

export interface UpdateSalonProfileInput {
  name: string;
  tagline: string;
  area: string;
  address: string;
  lat?: number;
  lng?: number;
  phone: string;
  whatsappNumber: string;
  priceLevel: 1 | 2 | 3;
  about: string;
  amenities: string[];
}

export async function updateSalonProfile(
  salonId: string,
  input: UpdateSalonProfileInput
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };

  if (
    !input.name.trim() ||
    !input.tagline.trim() ||
    !input.area.trim() ||
    !input.address.trim() ||
    !input.phone.trim() ||
    !input.whatsappNumber.trim() ||
    !input.about.trim()
  ) {
    return { success: false, error: "Please fill in every field." };
  }
  if (!isValidIntlPhone(input.phone)) {
    return { success: false, error: "Mobile number must start with a country code, e.g. +94 123456789." };
  }
  if (!isValidIntlPhone(input.whatsappNumber)) {
    return { success: false, error: "WhatsApp number must start with a country code, e.g. +94 123456789." };
  }
  const validAmenities = new Set<string>(AMENITIES);
  if (!input.amenities.every((a) => validAmenities.has(a))) {
    return { success: false, error: "Invalid amenity." };
  }
  if (![1, 2, 3].includes(input.priceLevel)) {
    return { success: false, error: "Invalid price level." };
  }
  if (
    (input.lat !== undefined || input.lng !== undefined) &&
    !isValidLatLng(input.lat ?? NaN, input.lng ?? NaN)
  ) {
    return { success: false, error: "Invalid location." };
  }

  await prisma.salon.update({
    where: { id: salonId },
    data: {
      name: input.name.trim(),
      tagline: input.tagline.trim(),
      area: input.area.trim(),
      address: input.address.trim(),
      ...(input.lat !== undefined && input.lng !== undefined ? { lat: input.lat, lng: input.lng } : {}),
      phone: input.phone.trim(),
      whatsappNumber: input.whatsappNumber.trim(),
      priceLevel: input.priceLevel,
      about: input.about.trim(),
      amenities: JSON.stringify(input.amenities),
    },
  });
  await revalidateVendorAndPublic("salon", check.salon.slug);
  return { success: true };
}

// ---- Salon photos ----

const MAX_IMAGE_DATA_URL_LENGTH = 3_000_000; // ~2.2MB raw, well above what client-side compression produces
const MAX_GALLERY_IMAGES = 6;

function isValidImageDataUrl(value: string): boolean {
  return value.startsWith("data:image/") && value.length <= MAX_IMAGE_DATA_URL_LENGTH;
}

export interface UpdateSalonPhotosInput {
  coverImage: string | null;
  galleryImages: string[];
}

export async function updateSalonPhotos(
  salonId: string,
  input: UpdateSalonPhotosInput
): Promise<VendorActionResult> {
  const check = await requireOwnedSalon(salonId);
  if (!check.ok) return { success: false, error: check.error };

  if (input.coverImage && !isValidImageDataUrl(input.coverImage)) {
    return { success: false, error: "Cover photo is invalid or too large." };
  }
  if (input.galleryImages.length > MAX_GALLERY_IMAGES) {
    return { success: false, error: `You can upload up to ${MAX_GALLERY_IMAGES} gallery photos.` };
  }
  if (!input.galleryImages.every(isValidImageDataUrl)) {
    return { success: false, error: "One of the gallery photos is invalid or too large." };
  }

  await prisma.salon.update({
    where: { id: salonId },
    data: {
      coverImage: input.coverImage,
      galleryImages: JSON.stringify(input.galleryImages),
    },
  });
  await revalidateVendorAndPublic("salon", check.salon.slug);
  return { success: true };
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
  // unrelated. Structural, not brand-name-based — MioSalon's actual embed
  // snippets route through their welns.io booking domain, not a "miosalon"
  // string, so a literal brand-name check rejects real snippets.
  const looksLikeEmbed = /<iframe|<script/i.test(trimmed);
  const looksLikeUrl = /^https?:\/\/\S+$/i.test(trimmed);
  if (trimmed && !looksLikeEmbed && !looksLikeUrl) {
    return {
      success: false,
      error: "That doesn't look like a booking link or embed code.",
    };
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

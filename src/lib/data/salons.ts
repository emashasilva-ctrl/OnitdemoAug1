import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { groupOpenHoursByDay, toLocalISODate } from "@/lib/time";
import { isPromotionActive } from "@/lib/data/promotions";
import { categories } from "@/lib/data/categories";
import type { CategorySlug, Salon } from "@/lib/types";

const salonInclude = {
  services: true,
  openHours: true,
  reviews: true,
  promotions: true,
  pricingRules: { include: { services: { select: { id: true } } } },
} satisfies Prisma.SalonInclude;

type SalonRow = Prisma.SalonGetPayload<{ include: typeof salonInclude }>;

function mapSalon(row: SalonRow): Salon {
  const today = toLocalISODate(new Date());
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    area: row.area,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    categories: JSON.parse(row.categories) as CategorySlug[],
    rating: row.rating,
    reviewCount: row.reviewCount,
    priceLevel: row.priceLevel as 1 | 2 | 3,
    imageSeed: row.imageSeed,
    gallerySeeds: JSON.parse(row.gallerySeeds) as string[],
    coverImage: row.coverImage,
    galleryImages: row.galleryImages ? (JSON.parse(row.galleryImages) as string[]) : [],
    about: row.about,
    amenities: JSON.parse(row.amenities) as string[],
    services: row.services.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      durationMins: s.durationMins,
      priceLKR: s.priceLKR,
      description: s.description,
    })),
    openHours: groupOpenHoursByDay(row.openHours),
    reviews: row.reviews.map((r) => ({
      id: r.id,
      author: r.author,
      rating: r.rating,
      date: r.date.toISOString().slice(0, 10),
      comment: r.comment,
    })),
    activePromotions: row.promotions
      .filter((p) => isPromotionActive(p.startDate, p.endDate, today))
      .map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        startDate: p.startDate,
        endDate: p.endDate,
      })),
    pricingRules: row.pricingRules.map((r) => ({
      id: r.id,
      label: r.label,
      type: r.type,
      amountType: r.amountType,
      amount: r.amount,
      days: JSON.parse(r.days) as string[],
      startMinutes: r.startMinutes,
      endMinutes: r.endMinutes,
      appliesToAllServices: r.appliesToAllServices,
      serviceIds: r.services.map((s) => s.id),
      enabled: r.enabled,
    })),
    cancellationFeeEnabled: row.cancellationFeeEnabled,
    cancellationFeePercent: row.cancellationFeePercent,
    noShowFeeEnabled: row.noShowFeeEnabled,
    noShowFeePercent: row.noShowFeePercent,
    featured: row.featured,
    phone: row.phone,
    whatsappNumber: row.whatsappNumber,
    mioSalonEmbedCode: row.mioSalonEmbedCode,
    hidden: row.hidden,
  };
}

// Public-facing — excludes salons their vendor has hidden (e.g. after
// switching their account back to customer-only). The owner's own view of
// their salon goes through getSalonByOwnerId instead, which is never
// filtered, so a hidden salon's data and settings stay fully reachable.
export async function getSalonBySlug(slug: string): Promise<Salon | null> {
  const row = await prisma.salon.findUnique({ where: { slug, hidden: false }, include: salonInclude });
  return row ? mapSalon(row) : null;
}

export async function getAllSalons(): Promise<Salon[]> {
  const rows = await prisma.salon.findMany({ where: { hidden: false }, include: salonInclude });
  return rows.map(mapSalon);
}

export async function getFeaturedSalons(): Promise<Salon[]> {
  const rows = await prisma.salon.findMany({
    where: { featured: true, hidden: false },
    include: salonInclude,
  });
  return rows.map(mapSalon);
}

export async function getSalonByOwnerId(ownerId: string): Promise<Salon | null> {
  const row = await prisma.salon.findFirst({ where: { ownerId }, include: salonInclude });
  return row ? mapSalon(row) : null;
}

// For each category, the cheapest service price across all salons that list
// that category among their own — not a strict per-service category match,
// since Service.category is a free-text label a vendor can customize.
// null means no onboarded salon offers that category yet.
export async function getCategoryStartingPrices(): Promise<
  Record<CategorySlug, number | null>
> {
  const salons = await getAllSalons();
  const result = {} as Record<CategorySlug, number | null>;

  for (const category of categories) {
    const prices = salons
      .filter((s) => s.categories.includes(category.slug))
      .flatMap((s) => s.services.map((service) => service.priceLKR));
    result[category.slug] = prices.length > 0 ? Math.min(...prices) : null;
  }

  return result;
}

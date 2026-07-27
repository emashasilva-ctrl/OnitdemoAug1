import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { groupOpenHoursByDay, toLocalISODate } from "@/lib/time";
import { isPromotionActive } from "@/lib/data/promotions";
import type { CategorySlug, Salon } from "@/lib/types";

const salonInclude = {
  services: true,
  openHours: true,
  reviews: true,
  promotions: true,
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
    featured: row.featured,
    phone: row.phone,
  };
}

export async function getSalonBySlug(slug: string): Promise<Salon | null> {
  const row = await prisma.salon.findUnique({ where: { slug }, include: salonInclude });
  return row ? mapSalon(row) : null;
}

export async function getAllSalons(): Promise<Salon[]> {
  const rows = await prisma.salon.findMany({ include: salonInclude });
  return rows.map(mapSalon);
}

export async function getFeaturedSalons(): Promise<Salon[]> {
  const rows = await prisma.salon.findMany({ where: { featured: true }, include: salonInclude });
  return rows.map(mapSalon);
}

export async function getSalonByOwnerId(ownerId: string): Promise<Salon | null> {
  const row = await prisma.salon.findFirst({ where: { ownerId }, include: salonInclude });
  return row ? mapSalon(row) : null;
}

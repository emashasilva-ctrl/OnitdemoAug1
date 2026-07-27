import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { groupOpenHoursByDay } from "@/lib/time";
import type { CuisineSlug, Restaurant } from "@/lib/types";

const restaurantInclude = {
  menuHighlights: true,
  openHours: true,
  reviews: true,
} satisfies Prisma.RestaurantInclude;

type RestaurantRow = Prisma.RestaurantGetPayload<{ include: typeof restaurantInclude }>;

function mapRestaurant(row: RestaurantRow): Restaurant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    area: row.area,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    cuisines: JSON.parse(row.cuisines) as CuisineSlug[],
    rating: row.rating,
    reviewCount: row.reviewCount,
    priceLevel: row.priceLevel as 1 | 2 | 3 | 4,
    imageSeed: row.imageSeed,
    gallerySeeds: JSON.parse(row.gallerySeeds) as string[],
    about: row.about,
    amenities: JSON.parse(row.amenities) as string[],
    menuHighlights: row.menuHighlights.map((m) => ({
      id: m.id,
      name: m.name,
      priceLKR: m.priceLKR,
      description: m.description,
    })),
    partySizes: JSON.parse(row.partySizes) as number[],
    openHours: groupOpenHoursByDay(row.openHours),
    reviews: row.reviews.map((r) => ({
      id: r.id,
      author: r.author,
      rating: r.rating,
      date: r.date.toISOString().slice(0, 10),
      comment: r.comment,
    })),
    featured: row.featured,
    phone: row.phone,
  };
}

export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const row = await prisma.restaurant.findUnique({ where: { slug }, include: restaurantInclude });
  return row ? mapRestaurant(row) : null;
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  const rows = await prisma.restaurant.findMany({ include: restaurantInclude });
  return rows.map(mapRestaurant);
}

export async function getFeaturedRestaurants(): Promise<Restaurant[]> {
  const rows = await prisma.restaurant.findMany({
    where: { featured: true },
    include: restaurantInclude,
  });
  return rows.map(mapRestaurant);
}

export async function getRestaurantByOwnerId(ownerId: string): Promise<Restaurant | null> {
  const row = await prisma.restaurant.findFirst({ where: { ownerId }, include: restaurantInclude });
  return row ? mapRestaurant(row) : null;
}

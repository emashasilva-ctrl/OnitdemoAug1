import type { MetadataRoute } from "next";
import { getAllSalons } from "@/lib/data/salons";
import { getAllRestaurants } from "@/lib/data/restaurants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [salons, restaurants] = await Promise.all([getAllSalons(), getAllRestaurants()]);
  const base = "https://onit.lk";
  const staticRoutes = [
    "",
    "/beauty",
    "/beauty/salons",
    "/beauty/partner",
    "/dining",
    "/dining/restaurants",
    "/dining/partner",
    "/bookings",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
  const salonRoutes = salons.map((s) => ({
    url: `${base}/beauty/salons/${s.slug}`,
    lastModified: new Date(),
  }));
  const restaurantRoutes = restaurants.map((r) => ({
    url: `${base}/dining/restaurants/${r.slug}`,
    lastModified: new Date(),
  }));
  return [...staticRoutes, ...salonRoutes, ...restaurantRoutes];
}

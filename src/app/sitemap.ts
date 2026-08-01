import type { MetadataRoute } from "next";
import { getAllSalons } from "@/lib/data/salons";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const salons = await getAllSalons();
  const base = "https://onit.lk";
  const staticRoutes = [
    "",
    "/beauty",
    "/beauty/salons",
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
  return [...staticRoutes, ...salonRoutes];
}

import type { MetadataRoute } from "next";
import { getAllSalons } from "@/lib/data/salons";

// Forces this route to run per-request (a Vercel Function) instead of being
// statically generated during `next build` — the build step runs in an
// isolated container where the Turso env vars aren't reliably available,
// unlike deployed Functions which always get them.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const salons = await getAllSalons();
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://onit.lk").replace(/\/$/, "");
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

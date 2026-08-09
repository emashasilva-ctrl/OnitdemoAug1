import type { Metadata } from "next";
import { SalonBrowser } from "@/components/salons/salon-browser-loader";
import { getAllSalons } from "@/lib/data/salons";

export const metadata: Metadata = {
  title: "Browse Salons in Colombo",
  description:
    "Browse and instantly book salons across Colombo — hair, nails, facials, spa, bridal and more.",
};

export default async function SalonsPage(props: PageProps<"/beauty/salons">) {
  const searchParams = await props.searchParams;
  const category =
    typeof searchParams.category === "string" ? searchParams.category : undefined;
  const area = typeof searchParams.area === "string" ? searchParams.area : undefined;

  const allSalons = await getAllSalons();
  const areas = Array.from(new Set(allSalons.map((s) => s.area))).sort();
  // Computed once, server-side, and threaded down through SalonBrowser (a
  // Client Component) to every SalonCard — see salon-card.tsx's `now` prop
  // comment for why this matters for hydration.
  const now = new Date();

  // SalonBrowser is a Client Component, so whatever's in `salons` gets
  // serialized into the page for hydration verbatim — swap the raw (often
  // huge, base64) cover images for lightweight URLs before it crosses that
  // boundary, same reasoning as salonForBooking below. Gallery images are
  // never rendered in this view at all, so they're dropped entirely.
  const salons = allSalons.map((s) => ({
    ...s,
    coverImage: s.coverImage ? `/api/salon-photo/${s.id}?type=cover` : null,
    galleryImages: [],
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          Browse Salons
        </h1>
        <p className="mt-2 text-muted-foreground">
          Real-time availability across Colombo. Pick a service, pick a slot.
        </p>
      </div>

      <SalonBrowser
        salons={salons}
        areas={areas}
        initialCategory={category}
        initialArea={area}
        now={now}
      />
    </div>
  );
}

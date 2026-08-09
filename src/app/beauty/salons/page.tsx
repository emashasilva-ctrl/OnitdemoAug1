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

  const salons = await getAllSalons();
  const areas = Array.from(new Set(salons.map((s) => s.area))).sort();
  // Computed once, server-side, and threaded down through SalonBrowser (a
  // Client Component) to every SalonCard — see salon-card.tsx's `now` prop
  // comment for why this matters for hydration.
  const now = new Date();

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

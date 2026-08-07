import Link from "next/link";
import { Star, Clock } from "lucide-react";
import type { Salon } from "@/lib/types";
import { VenueImage } from "@/components/venue-image";
import { getSlotsForDate, nextAvailableLabel } from "@/lib/slots";
import { getCategory } from "@/lib/data/categories";
import { Badge } from "@/components/ui/badge";
import { toLocalISODate } from "@/lib/time";

export function SalonCard({
  salon,
  distanceLabel,
}: {
  salon: Salon;
  distanceLabel?: string;
}) {
  const shortestService = [...salon.services].sort(
    (a, b) => a.durationMins - b.durationMins
  )[0];
  const todayISO = toLocalISODate(new Date());
  const slots = shortestService
    ? getSlotsForDate(salon.id, shortestService.durationMins, todayISO)
    : [];
  const nextSlot = nextAvailableLabel(slots);

  return (
    <Link
      href={`/beauty/salons/${salon.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        <VenueImage
          seed={salon.imageSeed}
          src={salon.coverImage}
          icon={getCategory(salon.categories[0])?.icon}
          className="size-full transition-transform duration-300 group-hover:scale-105"
        />
        {salon.featured && (
          <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">
            Featured
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg leading-tight font-semibold text-foreground">
            {salon.name}
          </h3>
          <span className="shrink-0 text-sm text-muted-foreground">
            {"$".repeat(salon.priceLevel)}
          </span>
        </div>

        <p className="text-sm text-muted-foreground">
          {salon.area}
          {distanceLabel ? ` · ${distanceLabel}` : ""}
        </p>

        {salon.reviewCount > 0 ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="size-3.5 fill-primary text-primary" />
            <span className="font-medium text-foreground">{salon.rating}</span>
            <span className="text-muted-foreground">({salon.reviewCount})</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">New on On It!</span>
        )}

        <div className="flex flex-wrap gap-1.5 pt-1">
          {salon.categories.slice(0, 2).map((c) => {
            const cat = getCategory(c);
            return cat ? (
              <Badge key={c} variant="secondary" className="font-normal">
                {cat.shortLabel}
              </Badge>
            ) : null;
          })}
        </div>

        <div className="mt-auto flex items-center gap-1.5 pt-3 text-sm">
          <Clock className="size-3.5 text-muted-foreground" />
          {nextSlot ? (
            <span className="text-foreground">
              Next slot today: <span className="font-medium">{nextSlot}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Fully booked today</span>
          )}
        </div>
      </div>
    </Link>
  );
}

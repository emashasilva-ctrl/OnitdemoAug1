import Link from "next/link";
import { Star, Clock } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { VenueImage } from "@/components/venue-image";
import { getSlotsForDate, nextAvailableLabel } from "@/lib/slots";
import { getCuisine } from "@/lib/data/cuisines";
import { Badge } from "@/components/ui/badge";

const DINING_START_MIN = 11.5 * 60;
const DINING_END_MIN = 22.5 * 60;
const RESERVATION_DURATION_MINS = 90;

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const slots = getSlotsForDate(
    restaurant.id,
    RESERVATION_DURATION_MINS,
    todayISO,
    new Date(),
    DINING_START_MIN,
    DINING_END_MIN
  );
  const nextSlot = nextAvailableLabel(slots);

  return (
    <Link
      href={`/dining/restaurants/${restaurant.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        <VenueImage
          seed={restaurant.imageSeed}
          icon={getCuisine(restaurant.cuisines[0])?.icon}
          className="size-full transition-transform duration-300 group-hover:scale-105"
        />
        {restaurant.featured && (
          <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">
            Featured
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg leading-tight font-semibold text-foreground">
            {restaurant.name}
          </h3>
          <span className="shrink-0 text-sm text-muted-foreground">
            {"$".repeat(restaurant.priceLevel)}
          </span>
        </div>

        <p className="text-sm text-muted-foreground">{restaurant.area}</p>

        <div className="flex items-center gap-1.5 text-sm">
          <Star className="size-3.5 fill-primary text-primary" />
          <span className="font-medium text-foreground">{restaurant.rating}</span>
          <span className="text-muted-foreground">({restaurant.reviewCount})</span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {restaurant.cuisines.slice(0, 2).map((c) => {
            const cuisine = getCuisine(c);
            return cuisine ? (
              <Badge key={c} variant="secondary" className="font-normal">
                {cuisine.shortLabel}
              </Badge>
            ) : null;
          })}
        </div>

        <div className="mt-auto flex items-center gap-1.5 pt-3 text-sm">
          <Clock className="size-3.5 text-muted-foreground" />
          {nextSlot ? (
            <span className="text-foreground">
              Next table today: <span className="font-medium">{nextSlot}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Fully booked today</span>
          )}
        </div>
      </div>
    </Link>
  );
}

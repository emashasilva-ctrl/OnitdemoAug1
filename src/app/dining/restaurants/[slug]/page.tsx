import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Star, MapPin, Phone, Clock, Check } from "lucide-react";
import { ReservationPanel } from "@/components/restaurants/reservation-panel";
import { CategoryIcon } from "@/components/category-icon";
import { VenueImage } from "@/components/venue-image";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getCuisine } from "@/lib/data/cuisines";
import { getRestaurantBySlug } from "@/lib/data/restaurants";
import { getCurrentUser } from "@/lib/dal";

export async function generateMetadata(
  props: PageProps<"/dining/restaurants/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return {};
  return {
    title: restaurant.name,
    description: restaurant.tagline,
  };
}

export default async function RestaurantDetailPage(
  props: PageProps<"/dining/restaurants/[slug]">
) {
  const { slug } = await props.params;
  const [restaurant, currentUser] = await Promise.all([
    getRestaurantBySlug(slug),
    getCurrentUser(),
  ]);
  if (!restaurant) notFound();

  return (
    <div className="pb-28 lg:pb-16">
      {/* Gallery */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-4 pt-6 sm:px-6 sm:pt-10 lg:grid-cols-4 lg:gap-3">
        <div className="relative col-span-2 aspect-4/3 overflow-hidden rounded-2xl bg-muted sm:aspect-16/9 lg:aspect-auto lg:row-span-2">
          <VenueImage
            seed={restaurant.imageSeed}
            icon={getCuisine(restaurant.cuisines[0])?.icon}
            className="size-full"
          />
        </div>
        {restaurant.gallerySeeds.slice(0, 2).map((seed, i) => (
          <div
            key={seed}
            className="relative col-span-1 aspect-square overflow-hidden rounded-2xl bg-muted lg:aspect-auto"
          >
            <VenueImage
              seed={seed}
              icon={getCuisine(restaurant.cuisines[i + 1] ?? restaurant.cuisines[0])?.icon}
              className="size-full"
            />
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-1.5">
              {restaurant.cuisines.map((c) => {
                const cuisine = getCuisine(c);
                return cuisine ? (
                  <Badge key={c} variant="secondary" className="gap-1 font-normal">
                    <CategoryIcon name={cuisine.icon} className="size-3" />
                    {cuisine.shortLabel}
                  </Badge>
                ) : null;
              })}
            </div>

            <h1 className="mt-3 font-heading text-3xl font-semibold text-foreground sm:text-4xl">
              {restaurant.name}
            </h1>
            <p className="mt-1 text-lg text-muted-foreground">{restaurant.tagline}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <div className="flex items-center gap-1.5">
                <Star className="size-4 fill-primary text-primary" />
                <span className="font-medium text-foreground">{restaurant.rating}</span>
                <span className="text-muted-foreground">
                  ({restaurant.reviewCount} reviews)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-4" />
                {restaurant.area}
              </div>
              <span className="text-muted-foreground">
                {"$".repeat(restaurant.priceLevel)}
              </span>
            </div>

            <p className="mt-6 max-w-2xl text-foreground/80">{restaurant.about}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {restaurant.amenities.map((a) => (
                <span
                  key={a}
                  className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-foreground/80"
                >
                  <Check className="size-3.5 text-primary" />
                  {a}
                </span>
              ))}
            </div>

            {/* Menu highlights */}
            <div className="mt-10">
              <h2 className="font-heading text-xl font-semibold text-foreground">
                Menu Highlights
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                {restaurant.menuHighlights.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-heading font-semibold text-foreground">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <p className="shrink-0 font-heading font-semibold text-foreground">
                      LKR {item.priceLKR.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="mt-12">
              <h2 className="font-heading text-xl font-semibold text-foreground">
                Reviews
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                {restaurant.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex gap-3 rounded-2xl border border-border bg-card p-4"
                  >
                    <Avatar>
                      <AvatarFallback>
                        {review.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{review.author}</p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-3 ${
                                i < review.rating
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="flex flex-col gap-5 lg:sticky lg:top-24">
              <ReservationPanel restaurant={restaurant} currentUser={currentUser} />
              <div className="hidden rounded-2xl border border-border bg-card p-5 lg:block">
                <h3 className="font-heading font-semibold text-foreground">
                  Location & hours
                </h3>
                <p className="mt-3 flex items-start gap-2 text-sm text-foreground/80">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  {restaurant.address}
                </p>
                <a
                  href={`tel:${restaurant.phone.replace(/\s/g, "")}`}
                  className="mt-2 flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Phone className="size-4" />
                  {restaurant.phone}
                </a>
                <div className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
                  {restaurant.openHours.map((oh) => (
                    <div key={oh.day} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-3.5" />
                        {oh.day}
                      </span>
                      <span className="text-foreground">{oh.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

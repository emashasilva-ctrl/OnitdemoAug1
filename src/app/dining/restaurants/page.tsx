import type { Metadata } from "next";
import { RestaurantBrowser } from "@/components/restaurants/restaurant-browser";
import { getAllRestaurants } from "@/lib/data/restaurants";

export const metadata: Metadata = {
  title: "Browse Restaurants in Colombo",
  description:
    "Browse and instantly reserve tables across Colombo — Sri Lankan, Indian, seafood, Italian and more.",
};

export default async function RestaurantsPage(
  props: PageProps<"/dining/restaurants">
) {
  const searchParams = await props.searchParams;
  const cuisine =
    typeof searchParams.cuisine === "string" ? searchParams.cuisine : undefined;
  const area = typeof searchParams.area === "string" ? searchParams.area : undefined;

  const restaurants = await getAllRestaurants();
  const areas = Array.from(new Set(restaurants.map((r) => r.area))).sort();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          Browse Restaurants
        </h1>
        <p className="mt-2 text-muted-foreground">
          Real-time table availability across Colombo. Pick a time, reserve a
          table.
        </p>
      </div>

      <RestaurantBrowser
        restaurants={restaurants}
        areas={areas}
        initialCuisine={cuisine}
        initialArea={area}
      />
    </div>
  );
}

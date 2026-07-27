"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { RestaurantCard } from "@/components/restaurant-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cuisines } from "@/lib/data/cuisines";
import type { CuisineSlug, Restaurant } from "@/lib/types";

const ALL = "all";

type SortOption = "rating" | "price-asc" | "price-desc";

export function RestaurantBrowser({
  restaurants,
  areas,
  initialCuisine,
  initialArea,
}: {
  restaurants: Restaurant[];
  areas: string[];
  initialCuisine?: string;
  initialArea?: string;
}) {
  const [cuisine, setCuisine] = useState(initialCuisine ?? ALL);
  const [area, setArea] = useState(initialArea ?? ALL);
  const [sort, setSort] = useState<SortOption>("rating");

  const results = useMemo(() => {
    let list = restaurants.filter((r) => {
      const matchesCuisine =
        cuisine === ALL || r.cuisines.includes(cuisine as CuisineSlug);
      const matchesArea = area === ALL || r.area === area;
      return matchesCuisine && matchesArea;
    });

    list = [...list].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "price-asc") return a.priceLevel - b.priceLevel;
      return b.priceLevel - a.priceLevel;
    });

    return list;
  }, [restaurants, cuisine, area, sort]);

  const hasFilters = cuisine !== ALL || area !== ALL;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground sm:hidden">
          <SlidersHorizontal className="size-4" />
          Filters
        </div>

        <Select value={cuisine} onValueChange={setCuisine}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All cuisines" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All cuisines</SelectItem>
            {cuisines.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={area} onValueChange={setArea}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All areas</SelectItem>
            {areas.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Highest rated</SelectItem>
            <SelectItem value="price-asc">Price: Low to high</SelectItem>
            <SelectItem value="price-desc">Price: High to low</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setCuisine(ALL);
              setArea(ALL);
            }}
            className="sm:ml-auto"
          >
            Clear filters
          </Button>
        )}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {results.length} restaurant{results.length === 1 ? "" : "s"} found
      </p>

      {results.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="font-heading text-lg font-semibold text-foreground">
            No restaurants match your filters
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try a different cuisine or area, or clear your filters to see every
            restaurant on On It!.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setCuisine(ALL);
              setArea(ALL);
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

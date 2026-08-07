"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { LocateFixed, Map as MapIcon, SlidersHorizontal } from "lucide-react";
import { SalonCard } from "@/components/salon-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { categories } from "@/lib/data/categories";
import { distanceKm, formatDistanceKm, type Coordinates } from "@/lib/geo";
import type { CategorySlug, Salon } from "@/lib/types";

const SalonMap = dynamic(
  () => import("@/components/salons/salon-map").then((mod) => mod.SalonMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-border text-sm text-muted-foreground sm:h-[32rem]">
        Loading map…
      </div>
    ),
  }
);

const ALL = "all";

type SortOption = "rating" | "price-asc" | "price-desc" | "nearest";

export function SalonBrowser({
  salons,
  areas,
  initialCategory,
  initialArea,
}: {
  salons: Salon[];
  areas: string[];
  initialCategory?: string;
  initialArea?: string;
}) {
  const [category, setCategory] = useState(initialCategory ?? ALL);
  const [area, setArea] = useState(initialArea ?? ALL);
  const [sort, setSort] = useState<SortOption>("rating");
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Location isn't supported on this browser.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setSort("nearest");
        setLocating(false);
      },
      () => {
        setLocationError("Couldn't get your location. Check your browser's location permission.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  const results = useMemo(() => {
    let list = salons.filter((s) => {
      const matchesCategory =
        category === ALL || s.categories.includes(category as CategorySlug);
      const matchesArea = area === ALL || s.area === area;
      return matchesCategory && matchesArea;
    });

    list = [...list].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "price-asc") return a.priceLevel - b.priceLevel;
      if (sort === "price-desc") return b.priceLevel - a.priceLevel;
      if (sort === "nearest" && userLocation) {
        return distanceKm(userLocation, a) - distanceKm(userLocation, b);
      }
      return b.rating - a.rating;
    });

    return list;
  }, [salons, category, area, sort, userLocation]);

  const hasFilters = category !== ALL || area !== ALL;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground sm:hidden">
          <SlidersHorizontal className="size-4" />
          Filters
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories.map((c) => (
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
            {userLocation && <SelectItem value="nearest">Nearest</SelectItem>}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={useMyLocation}
          disabled={locating}
          className="sm:ml-auto"
        >
          <LocateFixed className="size-4" />
          {locating ? "Locating…" : userLocation ? "Location on" : "Use my location"}
        </Button>

        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setCategory(ALL);
              setArea(ALL);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {locationError && <p className="mt-2 text-sm text-destructive">{locationError}</p>}

      <Tabs defaultValue="list" className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {results.length} salon{results.length === 1 ? "" : "s"} found
          </p>
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="map">
              <MapIcon className="size-3.5" />
              Map
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list">
          {results.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((salon) => (
                <SalonCard
                  key={salon.id}
                  salon={salon}
                  distanceLabel={
                    userLocation ? formatDistanceKm(distanceKm(userLocation, salon)) : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="font-heading text-lg font-semibold text-foreground">
                No salons match your filters
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Try a different category or area, or clear your filters to see
                every salon on On It!.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setCategory(ALL);
                  setArea(ALL);
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="map">
          <div className="mt-4">
            <SalonMap salons={results} userLocation={userLocation} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

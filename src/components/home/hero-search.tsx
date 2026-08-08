"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { categories } from "@/lib/data/categories";
import type { CategorySlug } from "@/lib/types";

export function HeroSearch({ areas }: { areas: string[] }) {
  const router = useRouter();
  const [service, setService] = useState<CategorySlug>(categories[3].slug); // spa-massage
  const [location, setLocation] = useState("");
  const [locationFocused, setLocationFocused] = useState(false);

  const query = location.trim().toLowerCase();
  const matches = useMemo(() => {
    const list = query ? areas.filter((a) => a.toLowerCase().includes(query)) : areas;
    return list.slice(0, 6);
  }, [areas, query]);

  const showSuggestions = locationFocused && matches.length > 0;
  const popular = categories.slice(0, 5);

  function handleFind() {
    const params = new URLSearchParams();
    params.set("category", service);
    if (location.trim()) params.set("area", location.trim());
    router.push(`/beauty/salons?${params.toString()}`);
  }

  return (
    <>
      <div className="mx-auto mt-12 grid max-w-[840px] grid-cols-1 items-stretch gap-2 rounded-full bg-sand/96 p-[10px] pl-2 shadow-[0_24px_60px_rgba(0,0,0,.28)] sm:grid-cols-[1.15fr_1fr_auto]">
        <label className="flex flex-col gap-1.5 border-b border-sage-deep/14 px-6 py-2 text-left sm:border-r sm:border-b-0">
          <span className="text-[9px] uppercase tracking-[0.22em] text-sage-deep/55">
            What do you need
          </span>
          <select
            value={service}
            onChange={(e) => setService(e.target.value as CategorySlug)}
            className="appearance-none border-none bg-transparent p-0 font-jost text-[15px] text-sage-deep outline-none"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="relative flex flex-col gap-1.5 px-5 py-2 text-left">
          <span className="text-[9px] uppercase tracking-[0.22em] text-sage-deep/55">Where</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onFocus={() => setLocationFocused(true)}
            onBlur={() => setTimeout(() => setLocationFocused(false), 150)}
            placeholder="Colombo neighbourhood"
            className="w-full border-none bg-transparent p-0 font-jost text-[15px] text-sage-deep outline-none placeholder:text-sage-deep/40"
          />
          {showSuggestions && (
            <div className="absolute top-full right-[-12px] left-0 z-[60] max-h-[236px] overflow-auto bg-sand py-1.5 shadow-[0_20px_44px_rgba(0,0,0,.22)]">
              {matches.map((place) => (
                <button
                  key={place}
                  type="button"
                  onMouseDown={() => {
                    setLocation(place);
                    setLocationFocused(false);
                  }}
                  className="flex w-full items-baseline justify-between gap-3 bg-transparent px-[18px] py-[11px] text-left text-sm text-sage-deep transition-colors hover:bg-sage-deep/6"
                >
                  <span>{place}</span>
                </button>
              ))}
            </div>
          )}
        </label>

        <button
          onClick={handleFind}
          className="mx-auto w-fit self-auto rounded-full bg-sage-deep px-9 py-3 font-jost text-[11px] tracking-[0.24em] text-sand uppercase transition-opacity hover:opacity-85 sm:mx-0 sm:w-auto sm:self-stretch sm:py-0"
        >
          Find
        </button>
      </div>

      <div className="mt-[18px] flex flex-wrap items-center justify-center gap-2.5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-sand/60">Popular</span>
        {popular.map((c) => {
          const isActive = c.slug === service;
          return (
            <button
              key={c.slug}
              onClick={() => setService(c.slug)}
              className={`rounded-full border px-4 py-[7px] font-jost text-[11px] transition-all duration-300 ${
                isActive
                  ? "border-sand bg-sand text-sage-deep"
                  : "border-sand/35 bg-sand/12 text-sand/95 hover:bg-sand hover:text-sage-deep"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

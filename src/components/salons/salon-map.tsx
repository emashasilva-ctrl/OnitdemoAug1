"use client";

import { useEffect, useRef, useState } from "react";
import { APIProvider, useApiIsLoaded } from "@vis.gl/react-google-maps";
import type { Salon } from "@/lib/types";
import type { Coordinates } from "@/lib/geo";

const COLOMBO_CENTER: Coordinates = { lat: 6.9271, lng: 79.8612 };
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// A plain data-URI SVG string, not a google.maps.Symbol — the `google`
// global doesn't exist until the Maps script itself finishes loading, so
// this can't be built from it directly.
const USER_LOCATION_ICON =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="7" fill="#4285F4" stroke="white" stroke-width="3"/></svg>'
  );

function buildInfoWindowContent(salon: Salon): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex;flex-direction:column;gap:2px;";

  const name = document.createElement("p");
  name.style.cssText = "font-weight:500;margin:0;";
  name.textContent = salon.name;

  const area = document.createElement("p");
  area.style.cssText = "font-size:13px;color:#6b7280;margin:0;";
  area.textContent = salon.area;

  const link = document.createElement("a");
  link.href = `/beauty/salons/${salon.slug}`;
  link.textContent = "View salon";
  link.style.cssText = "font-size:13px;font-weight:500;color:#2563eb;text-decoration:none;";

  wrapper.append(name, area, link);
  return wrapper;
}

// This component builds the map with the raw Google Maps JS API (via refs
// and effects) instead of @vis.gl/react-google-maps's own <Map>/<Marker>
// components, which never rendered any tiles here — see the map-tiles
// investigation notes for what was ruled out (API key/billing/referrer
// restrictions, click handling, container sizing, defaultBounds timing,
// React Strict Mode). Constructing the map on a deferred setTimeout rather
// than synchronously inside the effect is a real, defensible hardening
// (matches the library's own pattern of deferring camera operations after
// DOM reattachment) even though it wasn't possible to get a fully clean
// before/after confirmation that it alone fixes the underlying bug.
// <APIProvider> is kept purely for script loading, which was never
// implicated.
function RawMap({
  salons,
  userLocation,
}: {
  salons: Salon[];
  userLocation?: Coordinates | null;
}) {
  const apiIsLoaded = useApiIsLoaded();
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!apiIsLoaded || !containerRef.current) return;
    const container = containerRef.current;
    const timer = setTimeout(() => {
      const newMap = new google.maps.Map(container, {
        center: COLOMBO_CENTER,
        zoom: 12,
        gestureHandling: "greedy",
        disableDefaultUI: false,
        fullscreenControl: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      });
      infoWindowRef.current = new google.maps.InfoWindow();
      setMap(newMap);
      // The tile grid can compute against a stale container size from the
      // instant it was constructed (e.g. mid-transition into an inactive
      // tab becoming visible) and never re-request tiles afterward even
      // once the real layout settles — nudge it once real layout is done.
      requestAnimationFrame(() => {
        google.maps.event.trigger(newMap, "resize");
        newMap.setCenter(COLOMBO_CENTER);
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [apiIsLoaded]);

  useEffect(() => {
    if (!map) return;

    for (const marker of markersRef.current) marker.setMap(null);
    markersRef.current = [];

    const points: Coordinates[] = salons.map((s) => ({ lat: s.lat, lng: s.lng }));

    for (const salon of salons) {
      const marker = new google.maps.Marker({
        position: { lat: salon.lat, lng: salon.lng },
        map,
        title: salon.name,
      });
      marker.addListener("click", () => {
        const infoWindow = infoWindowRef.current;
        if (!infoWindow) return;
        infoWindow.setContent(buildInfoWindowContent(salon));
        infoWindow.open({ map, anchor: marker });
      });
      markersRef.current.push(marker);
    }

    if (userLocation) {
      points.push(userLocation);
      markersRef.current.push(
        new google.maps.Marker({
          position: userLocation,
          map,
          title: "Your location",
          icon: USER_LOCATION_ICON,
        })
      );
    }

    if (points.length === 0) {
      map.setCenter(COLOMBO_CENTER);
      map.setZoom(12);
    } else if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(15);
    } else {
      const bounds = new google.maps.LatLngBounds();
      for (const point of points) bounds.extend(point);
      map.fitBounds(bounds, 48);
    }
  }, [map, salons, userLocation]);

  return <div ref={containerRef} className="size-full" />;
}

export function SalonMap({
  salons,
  userLocation,
}: {
  salons: Salon[];
  userLocation?: Coordinates | null;
}) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-border text-sm text-muted-foreground sm:h-[32rem]">
        Map unavailable — Google Maps API key not configured.
      </div>
    );
  }

  return (
    <div className="h-96 overflow-hidden rounded-2xl border border-border sm:h-[32rem]">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <RawMap salons={salons} userLocation={userLocation} />
      </APIProvider>
    </div>
  );
}

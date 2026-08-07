"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { APIProvider, Map, Marker, InfoWindow, useMap, useMarkerRef } from "@vis.gl/react-google-maps";
import type { Salon } from "@/lib/types";
import type { Coordinates } from "@/lib/geo";

const COLOMBO_CENTER: Coordinates = { lat: 6.9271, lng: 79.8612 };
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// A plain data-URI SVG string, not a google.maps.Symbol — this component is
// only ever loaded client-side (dynamic import with ssr:false in
// salon-browser.tsx), but the `google` global still doesn't exist until the
// Maps script itself finishes loading, so anything referencing it directly
// in a render body (rather than inside the library's own hooks/components)
// would throw on first paint.
const USER_LOCATION_ICON =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="7" fill="#4285F4" stroke="white" stroke-width="3"/></svg>'
  );

// `defaultCenter`/`defaultZoom` on <Map> only apply to the initial paint —
// they don't react to prop changes, so without this the camera would stay
// wherever it started even as filters change which salons are shown. Fits
// the viewport to whatever's currently on the map (filtered salons + the
// user's own location pin, if present) every time that set changes.
function FitBoundsToSalons({
  salons,
  userLocation,
}: {
  salons: Salon[];
  userLocation?: Coordinates | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const points: Coordinates[] = salons.map((s) => ({ lat: s.lat, lng: s.lng }));
    if (userLocation) points.push(userLocation);

    if (points.length === 0) {
      map.setCenter(COLOMBO_CENTER);
      map.setZoom(12);
      return;
    }
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(15);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    for (const point of points) bounds.extend(point);
    map.fitBounds(bounds, 48);
  }, [map, salons, userLocation]);

  return null;
}

function SalonMarker({
  salon,
  isOpen,
  onToggle,
}: {
  salon: Salon;
  isOpen: boolean;
  onToggle: (id: string | null) => void;
}) {
  const [markerRef, marker] = useMarkerRef();

  return (
    <>
      <Marker
        ref={markerRef}
        position={{ lat: salon.lat, lng: salon.lng }}
        title={salon.name}
        onClick={() => onToggle(isOpen ? null : salon.id)}
      />
      {isOpen && marker && (
        <InfoWindow anchor={marker} onCloseClick={() => onToggle(null)}>
          <div className="flex flex-col gap-0.5">
            <p className="font-medium text-foreground">{salon.name}</p>
            <p className="text-sm text-muted-foreground">{salon.area}</p>
            <Link
              href={`/beauty/salons/${salon.slug}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              View salon
            </Link>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function SalonMap({
  salons,
  userLocation,
}: {
  salons: Salon[];
  userLocation?: Coordinates | null;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

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
        <Map
          defaultCenter={COLOMBO_CENTER}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={false}
          fullscreenControl={false}
          className="size-full"
        >
          <FitBoundsToSalons salons={salons} userLocation={userLocation} />
          {userLocation && (
            <Marker position={userLocation} icon={USER_LOCATION_ICON} title="Your location" />
          )}
          {salons.map((salon) => (
            <SalonMarker
              key={salon.id}
              salon={salon}
              isOpen={openId === salon.id}
              onToggle={setOpenId}
            />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}

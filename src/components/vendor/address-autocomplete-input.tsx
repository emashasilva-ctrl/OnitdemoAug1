"use client";

import { useEffect, useRef } from "react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// Matches the shared `Input` component's className exactly — rendered as a
// plain native <input> here rather than that component, since binding the
// Places Autocomplete widget needs a real DOM ref on mount.
const INPUT_CLASSNAME =
  "h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30";

export interface AddressPlaceSelection {
  address: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: AddressPlaceSelection) => void;
  required?: boolean;
  placeholder?: string;
}

function AddressAutocompleteInputInner({
  id,
  value,
  onChange,
  onPlaceSelect,
  required,
  placeholder,
}: AddressAutocompleteInputProps) {
  const placesLib = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);

  // Callers pass inline onChange/onPlaceSelect closures that get a new
  // identity on every render (every keystroke, since typing updates the
  // controlled `value`). Refs let the effect below read the latest callback
  // without needing them as dependencies — otherwise it would tear down and
  // recreate the Autocomplete widget (and leak a new orphaned .pac-container
  // into document.body) on every single keystroke.
  const onChangeRef = useRef(onChange);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  useEffect(() => {
    onChangeRef.current = onChange;
    onPlaceSelectRef.current = onPlaceSelect;
  });

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const containersBefore = new Set(document.querySelectorAll(".pac-container"));
    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry"],
      // Bias toward Sri Lanka — this is a Sri Lanka-only marketplace, so
      // this narrows suggestions without excluding any valid vendor address.
      componentRestrictions: { country: "lk" },
    });
    // Google appends the suggestion dropdown directly to document.body with
    // no handle back to the Autocomplete instance that owns it — diff the
    // before/after set to find it so it can be removed on cleanup.
    const ownContainer = Array.from(document.querySelectorAll(".pac-container")).find(
      (el) => !containersBefore.has(el)
    );

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const location = place.geometry?.location;
      if (!location) return;
      const address = place.formatted_address ?? inputRef.current?.value ?? "";
      onChangeRef.current(address);
      onPlaceSelectRef.current({ address, lat: location.lat(), lng: location.lng() });
    });

    return () => {
      listener.remove();
      ownContainer?.remove();
    };
  }, [placesLib]);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={INPUT_CLASSNAME}
      autoComplete="off"
    />
  );
}

/**
 * An address text input that offers Google Places suggestions and reports
 * back the selected place's coordinates. Vendors can still free-type an
 * address without picking a suggestion — in that case onPlaceSelect never
 * fires and callers should fall back to whatever default they already use
 * (the server falls back to a Colombo-center default, unchanged from before
 * this component existed).
 */
export function AddressAutocompleteInput(props: AddressAutocompleteInputProps) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <input
        id={props.id}
        type="text"
        required={props.required}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className={INPUT_CLASSNAME}
      />
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <AddressAutocompleteInputInner {...props} />
    </APIProvider>
  );
}

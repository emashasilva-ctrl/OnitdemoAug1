"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/lib/data/categories";
import { AMENITIES } from "@/lib/data/amenities";
import { createSalon } from "@/lib/actions/vendor";
import { AddressAutocompleteInput } from "@/components/vendor/address-autocomplete-input";
import type { CategorySlug } from "@/lib/types";

export function SalonSetupForm() {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [phone, setPhone] = useState("");
  const [whatsappSameAsMobile, setWhatsappSameAsMobile] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [priceLevel, setPriceLevel] = useState<1 | 2 | 3>(2);
  const [selectedCategories, setSelectedCategories] = useState<CategorySlug[]>([]);
  const [about, setAbout] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleCategory(slug: CategorySlug) {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  function toggleAmenity(amenity: string) {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  }

  function handleAddressChange(next: string) {
    setAddress(next);
    setCoords(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await createSalon({
      name,
      tagline,
      area,
      address,
      lat: coords?.lat,
      lng: coords?.lng,
      phone,
      whatsappNumber: whatsappSameAsMobile ? phone : whatsappNumber,
      priceLevel,
      categories: selectedCategories,
      about,
      amenities: selectedAmenities,
    });
    setSubmitting(false);
    if (!result.success) {
      toast.error(result.error);
    }
    // On success, createSalon redirects server-side — nothing left to do here.
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setup-name">Salon name</Label>
          <Input id="setup-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setup-tagline">Tagline</Label>
          <Input
            id="setup-tagline"
            required
            placeholder="A one-line description of your salon"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setup-area">Area</Label>
          <Input
            id="setup-area"
            required
            placeholder="e.g. Bambalapitiya, Colombo 4"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setup-address">Address</Label>
          <AddressAutocompleteInput
            id="setup-address"
            required
            value={address}
            onChange={handleAddressChange}
            onPlaceSelect={(place) => {
              setAddress(place.address);
              setCoords({ lat: place.lat, lng: place.lng });
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setup-phone">Mobile number</Label>
          <Input
            id="setup-phone"
            required
            type="tel"
            placeholder="+94 123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setup-whatsapp">WhatsApp number</Label>
          <Input
            id="setup-whatsapp"
            required
            type="tel"
            placeholder="+94 123456789"
            value={whatsappSameAsMobile ? phone : whatsappNumber}
            disabled={whatsappSameAsMobile}
            onChange={(e) => setWhatsappNumber(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="setup-whatsapp-same"
              checked={whatsappSameAsMobile}
              onCheckedChange={(checked) => setWhatsappSameAsMobile(checked === true)}
            />
            <Label htmlFor="setup-whatsapp-same" className="font-normal text-muted-foreground">
              Same as mobile number
            </Label>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Price level</Label>
          <Select
            value={String(priceLevel)}
            onValueChange={(v) => setPriceLevel(Number(v) as 1 | 2 | 3)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">$ — Budget-friendly</SelectItem>
              <SelectItem value="2">$$ — Mid-range</SelectItem>
              <SelectItem value="3">$$$ — Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="setup-about">About</Label>
        <Textarea
          id="setup-about"
          required
          rows={3}
          placeholder="Tell customers what makes your salon worth booking."
          value={about}
          onChange={(e) => setAbout(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Categories</Label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => toggleCategory(c.slug)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategories.includes(c.slug)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:bg-muted"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Amenities</Label>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selectedAmenities.includes(a)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:bg-muted"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-fit">
        {submitting ? "Creating your salon…" : "Create my salon"}
      </Button>
    </form>
  );
}

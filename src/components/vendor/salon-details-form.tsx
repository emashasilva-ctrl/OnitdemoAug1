"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { AMENITIES } from "@/lib/data/amenities";
import { updateSalonProfile, type UpdateSalonProfileInput } from "@/lib/actions/vendor";
import { AddressAutocompleteInput } from "@/components/vendor/address-autocomplete-input";

export function SalonDetailsForm({
  salonId,
  initial,
}: {
  salonId: string;
  initial: UpdateSalonProfileInput;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [tagline, setTagline] = useState(initial.tagline);
  const [area, setArea] = useState(initial.area);
  const [address, setAddress] = useState(initial.address);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial.lat !== undefined && initial.lng !== undefined
      ? { lat: initial.lat, lng: initial.lng }
      : null
  );
  const [phone, setPhone] = useState(initial.phone);
  const [whatsappSameAsMobile, setWhatsappSameAsMobile] = useState(
    initial.whatsappNumber === initial.phone
  );
  const [whatsappNumber, setWhatsappNumber] = useState(initial.whatsappNumber);
  const [priceLevel, setPriceLevel] = useState<1 | 2 | 3>(initial.priceLevel);
  const [about, setAbout] = useState(initial.about);
  const [amenities, setAmenities] = useState<string[]>(initial.amenities);
  const [saving, setSaving] = useState(false);

  function toggleAmenity(amenity: string) {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  }

  function handleAddressChange(next: string) {
    setAddress(next);
    setCoords(null);
  }

  const current: UpdateSalonProfileInput = {
    name,
    tagline,
    area,
    address,
    lat: coords?.lat,
    lng: coords?.lng,
    phone,
    whatsappNumber: whatsappSameAsMobile ? phone : whatsappNumber,
    priceLevel,
    about,
    amenities,
  };
  const isDirty = JSON.stringify(current) !== JSON.stringify(initial);

  async function handleSave() {
    setSaving(true);
    const result = await updateSalonProfile(salonId, current);
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Salon details updated");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div>
        <p className="font-heading font-semibold text-foreground">Salon details</p>
        <p className="text-sm text-muted-foreground">
          This is what customers see on your public salon page.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-name">Salon name</Label>
          <Input id="profile-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-tagline">Tagline</Label>
          <Input
            id="profile-tagline"
            required
            placeholder="A one-line description of your salon"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-area">Area</Label>
          <Input
            id="profile-area"
            required
            placeholder="e.g. Bambalapitiya, Colombo 4"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-address">Address</Label>
          <AddressAutocompleteInput
            id="profile-address"
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
          <Label htmlFor="profile-phone">Mobile number</Label>
          <Input
            id="profile-phone"
            required
            type="tel"
            placeholder="+94 123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
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
        <Label htmlFor="profile-whatsapp">WhatsApp number</Label>
        <Input
          id="profile-whatsapp"
          required
          type="tel"
          placeholder="+94 123456789"
          value={whatsappSameAsMobile ? phone : whatsappNumber}
          disabled={whatsappSameAsMobile}
          onChange={(e) => setWhatsappNumber(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Checkbox
            id="profile-whatsapp-same"
            checked={whatsappSameAsMobile}
            onCheckedChange={(checked) => setWhatsappSameAsMobile(checked === true)}
          />
          <Label htmlFor="profile-whatsapp-same" className="font-normal text-muted-foreground">
            Same as mobile number
          </Label>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-about">About</Label>
        <Textarea
          id="profile-about"
          required
          rows={3}
          placeholder="Tell customers what makes your salon worth booking."
          value={about}
          onChange={(e) => setAbout(e.target.value)}
        />
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
                amenities.includes(a)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:bg-muted"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving || !isDirty} className="w-fit">
        {saving ? "Saving…" : "Save salon details"}
      </Button>
    </div>
  );
}

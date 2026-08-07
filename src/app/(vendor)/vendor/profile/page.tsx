import { getCurrentUser } from "@/lib/dal";
import { getVendorVenue } from "@/lib/data/vendor";
import { SalonDetailsForm } from "@/components/vendor/salon-details-form";
import { SalonCategoriesEditor } from "@/components/vendor/salon-categories-editor";
import { SalonPhotosEditor } from "@/components/vendor/salon-photos-editor";

export default async function VendorProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const vendorVenue = await getVendorVenue(user.id);
  if (!vendorVenue) return null;

  const salon = vendorVenue.venue;

  return (
    <div className="flex flex-col gap-6">
      <SalonDetailsForm
        salonId={salon.id}
        initial={{
          name: salon.name,
          tagline: salon.tagline,
          area: salon.area,
          address: salon.address,
          lat: salon.lat,
          lng: salon.lng,
          phone: salon.phone,
          whatsappNumber: salon.whatsappNumber ?? salon.phone,
          priceLevel: salon.priceLevel,
          about: salon.about,
          amenities: salon.amenities,
        }}
      />
      <SalonCategoriesEditor salonId={salon.id} initial={salon.categories} />
      <SalonPhotosEditor
        salonId={salon.id}
        initialCoverImage={salon.coverImage}
        initialGalleryImages={salon.galleryImages}
      />
    </div>
  );
}

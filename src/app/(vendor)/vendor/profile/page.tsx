import { getCurrentUser } from "@/lib/dal";
import { getVendorVenue } from "@/lib/data/vendor";
import { switchToCustomer, unhideSalon } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
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
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div>
          <p className="font-heading font-semibold text-foreground">Account type</p>
          <p className="text-sm text-muted-foreground">
            {salon.hidden
              ? "Your salon is hidden — customers can't find or book it right now, but all its data is kept."
              : "Your salon is visible to customers browsing On It!."}
          </p>
        </div>
        {salon.hidden ? (
          <form action={unhideSalon}>
            <Button type="submit" variant="outline">
              Make my salon visible again
            </Button>
          </form>
        ) : (
          <form action={switchToCustomer}>
            <Button type="submit" variant="outline">
              Switch back to customer-only
            </Button>
          </form>
        )}
      </div>
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

import { getCurrentUser } from "@/lib/dal";
import { getVendorVenue } from "@/lib/data/vendor";
import { ServiceList } from "@/components/vendor/service-list";
import { MenuItemList } from "@/components/vendor/menu-item-list";
import { SalonCategoriesEditor } from "@/components/vendor/salon-categories-editor";

export default async function VendorServicesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const vendorVenue = await getVendorVenue(user.id);
  if (!vendorVenue) return null;

  if (vendorVenue.kind === "salon") {
    return (
      <div className="flex flex-col gap-6">
        <SalonCategoriesEditor salonId={vendorVenue.venue.id} initial={vendorVenue.venue.categories} />
        <ServiceList
          salonId={vendorVenue.venue.id}
          services={vendorVenue.venue.services}
          salonCategories={vendorVenue.venue.categories}
        />
      </div>
    );
  }

  return (
    <MenuItemList
      restaurantId={vendorVenue.venue.id}
      menuHighlights={vendorVenue.venue.menuHighlights}
    />
  );
}

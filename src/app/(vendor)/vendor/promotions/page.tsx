import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { getVendorVenue, getAllPromotionsForVenue } from "@/lib/data/vendor";
import { PromotionList } from "@/components/vendor/promotion-list";

export default async function VendorPromotionsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const vendorVenue = await getVendorVenue(user.id);
  if (!vendorVenue) return null;
  if (vendorVenue.kind !== "salon") redirect("/vendor/dashboard");

  const promotions = await getAllPromotionsForVenue("salon", vendorVenue.venue.id);

  return <PromotionList venueKind="salon" venueId={vendorVenue.venue.id} promotions={promotions} />;
}

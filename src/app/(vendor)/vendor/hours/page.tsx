import { getCurrentUser } from "@/lib/dal";
import { getVendorVenue, getRawOpenHours } from "@/lib/data/vendor";
import { updateSalonHours } from "@/lib/actions/vendor";
import { HoursEditor } from "@/components/vendor/hours-editor";

export default async function VendorHoursPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const vendorVenue = await getVendorVenue(user.id);
  if (!vendorVenue) return null;

  const { kind, venue } = vendorVenue;
  const initialHours = await getRawOpenHours(kind, venue.id);
  const onSave = updateSalonHours.bind(null, venue.id);

  return <HoursEditor initialHours={initialHours} onSave={onSave} />;
}

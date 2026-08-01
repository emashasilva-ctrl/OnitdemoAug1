import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { getVendorVenue } from "@/lib/data/vendor";
import { getTopClientsForSalon } from "@/lib/data/vendor-clients";
import { ClientList } from "@/components/vendor/client-list";

export default async function VendorClientsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const vendorVenue = await getVendorVenue(user.id);
  if (!vendorVenue) return null;
  if (vendorVenue.kind !== "salon") redirect("/vendor/dashboard");

  const clients = await getTopClientsForSalon(vendorVenue.venue.id);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{clients.length} clients</p>
      <ClientList clients={clients} />
    </div>
  );
}

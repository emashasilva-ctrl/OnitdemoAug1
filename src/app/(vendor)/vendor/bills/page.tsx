import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { getVendorVenue, getBillsForSalon } from "@/lib/data/vendor";
import { BillsHistoryList } from "@/components/vendor/bills-history-list";

export default async function VendorBillsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const vendorVenue = await getVendorVenue(user.id);
  if (!vendorVenue) return null;
  if (vendorVenue.kind !== "salon") redirect("/vendor/dashboard");

  const bills = await getBillsForSalon(vendorVenue.venue.id);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{bills.length} bills generated</p>
      <BillsHistoryList bills={bills} salon={vendorVenue.venue} />
    </div>
  );
}

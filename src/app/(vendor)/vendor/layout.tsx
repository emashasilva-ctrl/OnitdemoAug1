import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { getVendorVenue } from "@/lib/data/vendor";
import { VendorNav } from "@/components/vendor/vendor-nav";
import { Button } from "@/components/ui/button";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/vendor/dashboard");
  if (!user.isVendor) redirect("/");

  const vendorVenue = await getVendorVenue(user.id);
  if (!vendorVenue) redirect("/vendor/setup");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Vendor dashboard</p>
          <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
            {vendorVenue.venue.name}
          </h1>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/beauty/salons/${vendorVenue.venue.slug}`}>View public page</Link>
        </Button>
      </div>

      <VendorNav servicesLabel="Services" kind={vendorVenue.kind} />
      <div className="pt-6">{children}</div>
    </div>
  );
}

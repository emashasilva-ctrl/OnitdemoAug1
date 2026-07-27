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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Vendor dashboard</p>
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
          {vendorVenue ? vendorVenue.venue.name : "No venue yet"}
        </h1>
      </div>

      {vendorVenue ? (
        <>
          <VendorNav
            servicesLabel={vendorVenue.kind === "salon" ? "Services" : "Menu"}
            kind={vendorVenue.kind}
          />
          <div className="pt-6">{children}</div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">
            Your account is marked as a vendor, but isn&apos;t linked to a salon or
            restaurant listing yet.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/beauty/partner">List Your Salon</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dining/partner">List Your Restaurant</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

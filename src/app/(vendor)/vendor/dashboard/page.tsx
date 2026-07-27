import Link from "next/link";
import { Calendar, Clock, ListChecks, Phone } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { getVendorVenue, getUpcomingAppointmentsForVenue } from "@/lib/data/vendor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ManualBookingDialog } from "@/components/vendor/manual-booking-dialog";
import { VendorCancelButton } from "@/components/vendor/vendor-cancel-button";

export default async function VendorDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const vendorVenue = await getVendorVenue(user.id);
  if (!vendorVenue) return null;

  const { kind, venue } = vendorVenue;
  const appointments = await getUpcomingAppointmentsForVenue(kind, venue.id);
  const itemCount = kind === "salon" ? venue.services.length : venue.menuHighlights.length;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            {kind === "salon" ? "Services" : "Menu items"}
          </p>
          <p className="mt-1 font-heading text-2xl font-semibold text-foreground">{itemCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Upcoming bookings</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-foreground">
            {appointments.length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Rating</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-foreground">
            {venue.rating} <span className="text-sm text-muted-foreground">({venue.reviewCount})</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/vendor/services">
            <ListChecks className="size-4" />
            Manage {kind === "salon" ? "services" : "menu"}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/vendor/hours">
            <Clock className="size-4" />
            Manage hours
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={kind === "salon" ? `/beauty/salons/${venue.slug}` : `/dining/restaurants/${venue.slug}`}>
            View public page
          </Link>
        </Button>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
            <Calendar className="size-4" />
            Upcoming bookings
          </h2>
          {kind === "salon" ? (
            <ManualBookingDialog kind="salon" venue={venue} />
          ) : (
            <ManualBookingDialog kind="restaurant" venue={venue} />
          )}
        </div>
        {appointments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No upcoming bookings yet.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {appointments.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{a.label}</p>
                    {a.isManual && (
                      <Badge variant="outline">Added manually</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {a.date} at {a.time} &middot; {a.customerName}
                  </p>
                  {a.notes && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`tel:${a.customerPhone.replace(/\s/g, "")}`}
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Phone className="size-3.5" />
                    {a.customerPhone}
                  </a>
                  <VendorCancelButton id={a.id} kind={kind} venueId={venue.id} isManual={a.isManual} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

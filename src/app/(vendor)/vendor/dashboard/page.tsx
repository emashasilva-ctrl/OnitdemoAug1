import { Calendar, Phone } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { getVendorVenue, getUpcomingAppointmentsForVenue, getTeamMembersForSalon } from "@/lib/data/vendor";
import { getSalonAnalytics } from "@/lib/data/vendor-analytics";
import { toLocalISODate } from "@/lib/time";
import { Badge } from "@/components/ui/badge";
import { ManualBookingDialog } from "@/components/vendor/manual-booking-dialog";
import { VendorCancelButton } from "@/components/vendor/vendor-cancel-button";
import { DashboardAnalytics } from "@/components/vendor/dashboard-analytics";

export default async function VendorDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const vendorVenue = await getVendorVenue(user.id);
  if (!vendorVenue) return null;

  const { kind, venue } = vendorVenue;
  const appointments = await getUpcomingAppointmentsForVenue(kind, venue.id);
  const teamMembers = await getTeamMembersForSalon(venue.id);
  const itemCount = venue.services.length;

  const todayISO = toLocalISODate(new Date());
  const analytics = await getSalonAnalytics(venue.id, "30d", todayISO);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
            <Calendar className="size-4" />
            Upcoming bookings
          </h2>
          <ManualBookingDialog kind={kind} venue={venue} teamMembers={teamMembers} />
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Services</p>
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

      <DashboardAnalytics salonId={venue.id} initialAnalytics={analytics} />
    </div>
  );
}

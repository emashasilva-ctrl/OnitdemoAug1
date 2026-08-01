import Link from "next/link";
import { CalendarX2, Clock, MapPin, Scissors, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CancelButton } from "@/components/bookings/cancel-button";
import { getMyAppointments, type AppointmentListItem } from "@/lib/actions/bookings";

function AppointmentCard({ appointment }: { appointment: AppointmentListItem }) {
  const viewHref = `/beauty/salons/${appointment.venueSlug}`;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Scissors className="size-3" />
            </span>
            <p className="font-heading font-semibold text-foreground">
              {appointment.serviceName}
            </p>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {appointment.salonName} &middot; {appointment.salonArea}
          </p>
        </div>
        {appointment.status === "cancelled" && (
          <Badge variant="destructive">Cancelled</Badge>
        )}
        {appointment.status === "upcoming" && (
          <Badge variant="secondary">Upcoming</Badge>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/80">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {appointment.date} at {appointment.time}
        </span>
        <span>LKR {appointment.priceLKR.toLocaleString()} &middot; pay at salon</span>
      </div>

      {appointment.notes && (
        <p className="mt-2 text-sm text-muted-foreground">Note: {appointment.notes}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {appointment.venueSlug && (
          <Button variant="outline" size="sm" asChild>
            <Link href={viewHref}>View salon</Link>
          </Button>
        )}
        {appointment.status === "upcoming" && <CancelButton id={appointment.id} />}
      </div>
    </div>
  );
}

export default async function BookingsPage() {
  const appointments = await getMyAppointments();

  const todayISO = new Date().toISOString().slice(0, 10);
  const upcoming = appointments.filter(
    (a) => a.status === "upcoming" && a.date >= todayISO
  );
  const past = appointments.filter(
    (a) => a.status !== "cancelled" && a.date < todayISO
  );
  const cancelled = appointments.filter((a) => a.status === "cancelled");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        My Bookings
      </h1>
      <p className="mt-2 text-muted-foreground">
        Salon appointments, tied to your account.
      </p>

      {appointments.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-muted">
            <Ticket className="size-6 text-muted-foreground" />
          </span>
          <p className="font-heading text-lg font-semibold text-foreground">
            No bookings yet
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Book a salon appointment, and it will show up here.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/beauty/salons">Browse Salons</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          {upcoming.length > 0 && (
            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Upcoming
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                {upcoming.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Past
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                {past.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} />
                ))}
              </div>
            </section>
          )}

          {cancelled.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
                <CalendarX2 className="size-4" />
                Cancelled
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                {cancelled.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

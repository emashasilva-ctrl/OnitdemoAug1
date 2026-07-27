"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { cancelVendorAppointment } from "@/lib/actions/vendor-bookings";
import type { VendorCalendarAppointment } from "@/lib/data/vendor";

export function CalendarAppointmentDetails({
  appointment,
  open,
  onOpenChange,
  kind,
  venueId,
  onCancelled,
}: {
  appointment: VendorCalendarAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "salon" | "restaurant";
  venueId: string;
  onCancelled: (id: string) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (!appointment) return null;

  async function handleCancel() {
    if (!appointment) return;
    const message = appointment.isManual
      ? "Remove this manually-added booking?"
      : "Cancel this customer's booking? They will not be notified automatically.";
    if (!confirm(message)) return;

    setPending(true);
    const result = await cancelVendorAppointment(appointment.id, kind, venueId);
    setPending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast(appointment.isManual ? "Booking removed" : "Booking cancelled");
    onCancelled(appointment.id);
    router.refresh();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {appointment.label}
            {appointment.isManual && <Badge variant="outline">Added manually</Badge>}
            {appointment.status === "CANCELLED" && <Badge variant="destructive">Cancelled</Badge>}
          </SheetTitle>
          <SheetDescription>
            {appointment.date} at {appointment.time} &middot; {appointment.durationMins} min
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4">
          <div>
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="font-medium text-foreground">{appointment.customerName}</p>
          </div>
          <a
            href={`tel:${appointment.customerPhone.replace(/\s/g, "")}`}
            className="flex w-fit items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Phone className="size-3.5" />
            {appointment.customerPhone}
          </a>
          {appointment.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm text-foreground">{appointment.notes}</p>
            </div>
          )}
        </div>

        {appointment.status === "UPCOMING" && (
          <SheetFooter>
            <Button
              variant="outline"
              disabled={pending}
              onClick={handleCancel}
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {pending ? "Cancelling…" : "Cancel booking"}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

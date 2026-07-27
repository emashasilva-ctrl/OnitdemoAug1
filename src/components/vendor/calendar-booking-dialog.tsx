"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createManualSalonBooking, createManualRestaurantBooking } from "@/lib/actions/vendor-bookings";
import { minutesToLabel, minutesToTimeValue, timeValueToMinutes } from "@/lib/time";
import type { VendorCalendarAppointment, RawOpenHours } from "@/lib/data/vendor";
import type { Salon, Restaurant } from "@/lib/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = (
  | { kind: "salon"; venue: Salon }
  | { kind: "restaurant"; venue: Restaurant }
) & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openHours: RawOpenHours[];
  existingAppointments: VendorCalendarAppointment[];
  initialDate: string;
  initialMinutes: number;
  onCreated: () => void;
};

export function CalendarBookingDialog({
  kind,
  venue,
  open,
  onOpenChange,
  openHours,
  existingAppointments,
  initialDate,
  initialMinutes,
  onCreated,
}: Props) {
  const [date, setDate] = useState(initialDate);
  const [timeValue, setTimeValue] = useState(minutesToTimeValue(initialMinutes));
  const [serviceId, setServiceId] = useState<string | null>(
    kind === "salon" ? (venue.services[0]?.id ?? null) : null
  );
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const durationMins =
    kind === "salon" ? venue.services.find((s) => s.id === serviceId)?.durationMins ?? 60 : 90;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !phone) return;
    if (kind === "salon" && !serviceId) return;

    const startMinutes = timeValueToMinutes(timeValue);
    const endMinutes = startMinutes + durationMins;
    const dayLabel = DAY_LABELS[new Date(`${date}T00:00:00`).getDay()];
    const ranges = openHours.filter((r) => r.day === dayLabel);
    const withinHours = ranges.some((r) => startMinutes >= r.openMinutes && endMinutes <= r.closeMinutes);

    if (!withinHours) {
      const proceed = confirm("Adding an appointment outside of working hours. Do you wish to proceed?");
      if (!proceed) return;
    }

    const overlaps = existingAppointments.some(
      (a) =>
        a.date === date &&
        a.status !== "CANCELLED" &&
        startMinutes < a.startMinutes + a.durationMins &&
        a.startMinutes < endMinutes
    );
    if (overlaps) {
      const proceed = confirm("This overlaps with an existing booking on this date. Do you wish to proceed?");
      if (!proceed) return;
    }

    setSubmitting(true);
    const time = minutesToLabel(startMinutes);
    const result =
      kind === "salon"
        ? await createManualSalonBooking({
            salonId: venue.id,
            serviceId: serviceId!,
            date,
            startMinutes,
            time,
            customerName: name,
            customerPhone: phone,
            notes: notes || undefined,
          })
        : await createManualRestaurantBooking({
            restaurantId: venue.id,
            partySize,
            date,
            startMinutes,
            time,
            customerName: name,
            customerPhone: phone,
            notes: notes || undefined,
          });
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Booking added");
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a booking</DialogTitle>
          <DialogDescription>For a customer who called or booked in person.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {kind === "salon" ? (
            <div className="flex flex-col gap-1.5">
              <Label>Service</Label>
              <Select value={serviceId ?? undefined} onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {venue.services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.durationMins} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cb-party">Party size</Label>
              <Input
                id="cb-party"
                type="number"
                min={1}
                required
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cb-date">Date</Label>
              <Input id="cb-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cb-time">Time</Label>
              <Input
                id="cb-time"
                type="time"
                required
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cb-name">Customer name</Label>
            <Input id="cb-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cb-phone">Customer phone</Label>
            <Input id="cb-phone" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cb-notes">Notes (optional)</Label>
            <Textarea id="cb-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <DialogFooter className="px-0 pb-0">
            <Button type="submit" disabled={!name || !phone || submitting} className="w-full">
              {submitting ? "Adding…" : "Add booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

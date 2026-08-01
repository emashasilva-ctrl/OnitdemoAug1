"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
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
import { getSalonAvailability, type TimeSlot } from "@/lib/actions/availability";
import { createManualSalonBooking } from "@/lib/actions/vendor-bookings";
import { buildDateOptions } from "@/lib/time";
import type { Salon } from "@/lib/types";
import type { VendorTeamMember } from "@/lib/data/vendor";

type Props = {
  kind: "salon";
  venue: Salon;
  teamMembers?: VendorTeamMember[];
};

export function ManualBookingDialog(props: Props) {
  const { venue, teamMembers = [] } = props;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState<string | null>(venue.services[0]?.id ?? null);
  const [teamMemberId, setTeamMemberId] = useState<string | null>(null);
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const [date, setDate] = useState(dateOptions[0].iso);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [checkingSlots, setCheckingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const durationMins = venue.services.find((s) => s.id === serviceId)?.durationMins ?? 60;

  async function loadSlots(dateForCheck: string, durationForCheck: number) {
    setSelectedSlot(null);
    setCheckingSlots(true);
    try {
      const result = await getSalonAvailability(venue.id, durationForCheck, dateForCheck);
      setSlots(result);
    } finally {
      setCheckingSlots(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      loadSlots(date, durationMins);
    } else {
      setDate(dateOptions[0].iso);
      setSlots([]);
      setSelectedSlot(null);
      setName("");
      setPhone("");
      setNotes("");
      setTeamMemberId(null);
      setServiceId(venue.services[0]?.id ?? null);
    }
  }

  function handleDateChange(iso: string) {
    setDate(iso);
    loadSlots(iso, durationMins);
  }

  function handleServiceChange(id: string) {
    setServiceId(id);
    setTeamMemberId(null);
    const service = venue.services.find((s) => s.id === id);
    loadSlots(date, service?.durationMins ?? 60);
  }

  const eligibleTeamMembers = teamMembers.filter((m) => !serviceId || m.serviceIds.includes(serviceId));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !name || !phone || !serviceId) return;

    setSubmitting(true);
    const result = await createManualSalonBooking({
      salonId: venue.id,
      serviceId,
      date,
      startMinutes: selectedSlot.minutes,
      time: selectedSlot.label,
      customerName: name,
      customerPhone: phone,
      notes: notes || undefined,
      teamMemberId,
    });
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Booking added");
    handleOpenChange(false);
    router.refresh();
  }

  if (venue.services.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add a service before you can add a booking.
      </p>
    );
  }

  return (
    <>
      <Button size="sm" onClick={() => handleOpenChange(true)}>
        <Plus className="size-4" />
        Add booking
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a booking</DialogTitle>
            <DialogDescription>For a customer who called or booked in person.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Service</Label>
              <Select value={serviceId ?? undefined} onValueChange={handleServiceChange}>
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

            {teamMembers.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label>Team member (optional)</Label>
                <Select
                  value={teamMemberId ?? "__unassigned__"}
                  onValueChange={(v) => setTeamMemberId(v === "__unassigned__" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unassigned__">Unassigned</SelectItem>
                    {eligibleTeamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {eligibleTeamMembers.length === 0 && (
                  <p className="text-xs text-muted-foreground">No team member is assigned to this service yet.</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>Date</Label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {dateOptions.map((d) => (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => handleDateChange(d.iso)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      date === d.iso
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Time</Label>
              {checkingSlots ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Checking availability&hellip;
                </div>
              ) : slots.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">No availability this day.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((slot) => (
                    <button
                      key={slot.minutes}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground/50 ${
                        selectedSlot?.minutes === slot.minutes
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:enabled:bg-muted"
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mb-name">Customer name</Label>
              <Input id="mb-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mb-phone">Customer phone</Label>
              <Input
                id="mb-phone"
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mb-notes">Notes (optional)</Label>
              <Textarea id="mb-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <DialogFooter className="px-0 pb-0">
              <Button type="submit" disabled={!selectedSlot || !name || !phone || submitting} className="w-full">
                {submitting ? "Adding…" : "Add booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

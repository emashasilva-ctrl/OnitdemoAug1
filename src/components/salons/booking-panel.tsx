"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  Check,
  ChevronLeft,
  Clock,
  Loader2,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getSalonAvailability, type TimeSlot } from "@/lib/actions/availability";
import { createSalonBooking } from "@/lib/actions/bookings";
import { buildDateOptions } from "@/lib/time";
import type { Salon, Service } from "@/lib/types";

type Step = "service" | "datetime" | "details" | "success";
type CurrentUser = { name: string; phone: string | null } | null;

export function BookingPanel({
  salon,
  currentUser,
}: {
  salon: Salon;
  currentUser: CurrentUser;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const [date, setDate] = useState(dateOptions[0].iso);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [checkingSlots, setCheckingSlots] = useState(false);
  const [name, setName] = useState(currentUser?.name ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastBookingSummary, setLastBookingSummary] = useState<{
    service: Service;
    date: string;
    time: string;
  } | null>(null);

  const selectedService = salon.services.find((s) => s.id === serviceId) ?? null;

  async function loadSlots(serviceForCheck: Service, dateForCheck: string) {
    setTime(null);
    setCheckingSlots(true);
    try {
      const result = await getSalonAvailability(salon.id, serviceForCheck.durationMins, dateForCheck);
      setSlots(result);
    } finally {
      setCheckingSlots(false);
    }
  }

  function reset() {
    setStep("service");
    setServiceId(null);
    setDate(dateOptions[0].iso);
    setTime(null);
    setSlots([]);
    setName(currentUser?.name ?? "");
    setPhone(currentUser?.phone ?? "");
    setNotes("");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setTimeout(() => {
        if (step === "success") reset();
      }, 200);
    }
  }

  function startBooking(preselectServiceId?: string) {
    if (preselectServiceId) {
      const service = salon.services.find((s) => s.id === preselectServiceId);
      setServiceId(preselectServiceId);
      setStep("datetime");
      if (service) loadSlots(service, date);
    } else {
      setStep("service");
    }
    setOpen(true);
  }

  async function handleConfirm() {
    if (!selectedService || !time || !name || !phone) return;
    const dateLabel = dateOptions.find((d) => d.iso === date)?.label ?? date;
    const slot = slots.find((s) => s.label === time);
    if (!slot) return;

    setSubmitting(true);
    const result = await createSalonBooking({
      salonId: salon.id,
      serviceId: selectedService.id,
      priceLKR: selectedService.priceLKR,
      durationMins: selectedService.durationMins,
      date,
      time,
      startMinutes: slot.minutes,
      customerName: name,
      customerPhone: phone,
      notes: notes || undefined,
    });
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setLastBookingSummary({ service: selectedService, date: dateLabel, time });
    setStep("success");
    toast.success("Booking confirmed", {
      description: `${selectedService.name} on ${dateLabel} at ${time}`,
    });
  }

  const lowestPrice = Math.min(...salon.services.map((s) => s.priceLKR));
  const loginNext = `${pathname}`;

  return (
    <>
      {/* Services list */}
      <div className="flex flex-col gap-3">
        {salon.services.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="min-w-0">
              <p className="font-heading font-semibold text-foreground">
                {service.name}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {service.description}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-3.5" />
                {service.durationMins} min
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <p className="font-heading font-semibold text-foreground">
                LKR {service.priceLKR.toLocaleString()}
              </p>
              <Button size="sm" onClick={() => startBooking(service.id)}>
                Book
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop sidebar CTA */}
      <div className="mt-6 hidden rounded-2xl border border-border bg-card p-5 lg:block">
        <p className="text-sm text-muted-foreground">Starting from</p>
        <p className="font-heading text-2xl font-semibold text-foreground">
          LKR {lowestPrice.toLocaleString()}
        </p>
        <Button size="lg" className="mt-4 w-full gap-2" onClick={() => startBooking()}>
          <CalendarCheck className="size-4" />
          Check availability
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          No booking fee &middot; Pay at the salon
        </p>
      </div>

      {/* Mobile sticky bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        <div>
          <p className="text-xs text-muted-foreground">From</p>
          <p className="font-heading font-semibold text-foreground">
            LKR {lowestPrice.toLocaleString()}
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => startBooking()}>
          <CalendarCheck className="size-4" />
          Check Availability
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          {step === "service" && (
            <>
              <DialogHeader>
                <DialogTitle>Choose a service</DialogTitle>
                <DialogDescription>
                  Booking at {salon.name}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                {salon.services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setServiceId(service.id)}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                      serviceId === service.id
                        ? "border-primary bg-accent"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-foreground">{service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.durationMins} min
                      </p>
                    </div>
                    <p className="shrink-0 font-medium text-foreground">
                      LKR {service.priceLKR.toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
              <DialogFooter>
                <Button
                  disabled={!serviceId}
                  className="w-full"
                  onClick={() => {
                    setStep("datetime");
                    if (selectedService) loadSlots(selectedService, date);
                  }}
                >
                  Continue
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "datetime" && selectedService && (
            <>
              <DialogHeader>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 w-fit gap-1 text-muted-foreground"
                  onClick={() => setStep("service")}
                >
                  <ChevronLeft className="size-4" />
                  Back
                </Button>
                <DialogTitle>Pick a date & time</DialogTitle>
                <DialogDescription>
                  {selectedService.name} &middot; {selectedService.durationMins} min
                </DialogDescription>
              </DialogHeader>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {dateOptions.map((d) => (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => {
                      setDate(d.iso);
                      loadSlots(selectedService, d.iso);
                    }}
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

              {checkingSlots ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Checking availability&hellip;
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((slot) => (
                    <button
                      key={slot.minutes}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setTime(slot.label)}
                      className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground/50 ${
                        time === slot.label
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:enabled:bg-muted"
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}

              <DialogFooter>
                <Button
                  disabled={!time}
                  className="w-full"
                  onClick={() => setStep("details")}
                >
                  Continue
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "details" && selectedService && time && (
            <>
              <DialogHeader>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 w-fit gap-1 text-muted-foreground"
                  onClick={() => setStep("datetime")}
                >
                  <ChevronLeft className="size-4" />
                  Back
                </Button>
                <DialogTitle>Your details</DialogTitle>
                <DialogDescription>One last step to confirm.</DialogDescription>
              </DialogHeader>

              <div className="rounded-xl bg-muted p-3 text-sm">
                <p className="font-medium text-foreground">{selectedService.name}</p>
                <p className="text-muted-foreground">
                  {dateOptions.find((d) => d.iso === date)?.label} at {time} &middot;{" "}
                  {salon.name}
                </p>
                <p className="mt-1 font-medium text-foreground">
                  LKR {selectedService.priceLKR.toLocaleString()} &middot; pay at salon
                </p>
              </div>

              {!currentUser ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-6 text-center">
                  <span className="flex size-11 items-center justify-center rounded-full bg-muted">
                    <LogIn className="size-5 text-muted-foreground" />
                  </span>
                  <p className="font-medium text-foreground">Log in to confirm</p>
                  <p className="text-sm text-muted-foreground">
                    Your bookings are saved to your account so you can find them later.
                  </p>
                  <div className="flex w-full flex-col gap-2 sm:flex-row">
                    <Button asChild className="w-full">
                      <Link href={`/login?next=${encodeURIComponent(loginNext)}`}>
                        Log in
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link href={`/signup?next=${encodeURIComponent(loginNext)}`}>
                        Sign up
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleConfirm();
                  }}
                >
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="booking-name">Full name</Label>
                    <Input
                      id="booking-name"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Amaya Silva"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="booking-phone">Phone number</Label>
                    <Input
                      id="booking-phone"
                      required
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="booking-notes">Notes (optional)</Label>
                    <Textarea
                      id="booking-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Anything the salon should know"
                      rows={2}
                    />
                  </div>
                  <DialogFooter className="px-0 pb-0 -mb-0 border-t-0 bg-transparent">
                    <Button
                      type="submit"
                      disabled={!name || !phone || submitting}
                      className="w-full"
                    >
                      {submitting ? "Confirming…" : "Confirm Booking"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </>
          )}

          {step === "success" && lastBookingSummary && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-7" />
              </span>
              <div>
                <DialogTitle className="text-lg">Booking confirmed!</DialogTitle>
                <DialogDescription className="mt-1">
                  See you at {salon.name}
                </DialogDescription>
              </div>
              <div className="w-full rounded-xl bg-muted p-4 text-left text-sm">
                <p className="font-medium text-foreground">
                  {lastBookingSummary.service.name}
                </p>
                <p className="text-muted-foreground">
                  {lastBookingSummary.date} at {lastBookingSummary.time}
                </p>
                <p className="mt-1 font-medium text-foreground">
                  LKR {lastBookingSummary.service.priceLKR.toLocaleString()} &middot; pay
                  at salon
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOpenChange(false)}
                >
                  Done
                </Button>
                <Button asChild className="w-full">
                  <Link href="/bookings">View My Bookings</Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

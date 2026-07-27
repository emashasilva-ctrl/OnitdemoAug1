"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  Check,
  ChevronLeft,
  CreditCard,
  Loader2,
  LogIn,
  ShieldCheck,
  Users,
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
import { getRestaurantAvailability, type TimeSlot } from "@/lib/actions/availability";
import { createRestaurantReservation } from "@/lib/actions/bookings";
import { buildDateOptions } from "@/lib/time";
import type { Restaurant } from "@/lib/types";

type Step = "party" | "datetime" | "details" | "success";
type CurrentUser = { name: string; phone: string | null } | null;

const RESERVATION_DURATION_MINS = 90;

export function ReservationPanel({
  restaurant,
  currentUser,
}: {
  restaurant: Restaurant;
  currentUser: CurrentUser;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("party");
  const [partySize, setPartySize] = useState<number | null>(null);
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const [date, setDate] = useState(dateOptions[0].iso);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [checkingSlots, setCheckingSlots] = useState(false);
  const [name, setName] = useState(currentUser?.name ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [notes, setNotes] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastReservationSummary, setLastReservationSummary] = useState<{
    partySize: number;
    date: string;
    time: string;
  } | null>(null);

  async function loadSlots(dateForCheck: string) {
    setTime(null);
    setCheckingSlots(true);
    try {
      const result = await getRestaurantAvailability(
        restaurant.id,
        RESERVATION_DURATION_MINS,
        dateForCheck
      );
      setSlots(result);
    } finally {
      setCheckingSlots(false);
    }
  }

  function reset() {
    setStep("party");
    setPartySize(null);
    setDate(dateOptions[0].iso);
    setTime(null);
    setSlots([]);
    setName(currentUser?.name ?? "");
    setPhone(currentUser?.phone ?? "");
    setNotes("");
    setCardNumber("");
    setExpiry("");
    setCvc("");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setTimeout(() => {
        if (step === "success") reset();
      }, 200);
    }
  }

  function startReservation() {
    setStep("party");
    setOpen(true);
  }

  const cardLast4 = cardNumber.replace(/\s/g, "").slice(-4);
  const canConfirm =
    !!partySize && !!time && !!name && !!phone && cardLast4.length === 4 && !!expiry && !!cvc;

  async function handleConfirm() {
    if (!canConfirm || !partySize || !time) return;
    const dateLabel = dateOptions.find((d) => d.iso === date)?.label ?? date;
    const slot = slots.find((s) => s.label === time);
    if (!slot) return;

    setSubmitting(true);
    const result = await createRestaurantReservation({
      restaurantId: restaurant.id,
      partySize,
      date,
      time,
      startMinutes: slot.minutes,
      customerName: name,
      customerPhone: phone,
      notes: notes || undefined,
      cardLast4,
    });
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setLastReservationSummary({ partySize, date: dateLabel, time });
    setStep("success");
    toast.success("Reservation confirmed", {
      description: `Table for ${partySize} on ${dateLabel} at ${time}`,
    });
  }

  const loginNext = `${pathname}`;

  return (
    <>
      {/* Desktop sidebar CTA */}
      <div className="hidden rounded-2xl border border-border bg-card p-5 lg:block">
        <p className="text-sm text-muted-foreground">Party size</p>
        <p className="font-heading text-2xl font-semibold text-foreground">
          {restaurant.partySizes[0]}–{restaurant.partySizes[restaurant.partySizes.length - 1]} guests
        </p>
        <Button size="lg" className="mt-4 w-full gap-2" onClick={startReservation}>
          <CalendarCheck className="size-4" />
          Find a table
        </Button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          Card on file &middot; no charge unless no-show
        </p>
      </div>

      {/* Mobile sticky bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        <div>
          <p className="text-xs text-muted-foreground">Party size</p>
          <p className="font-heading font-semibold text-foreground">
            {restaurant.partySizes[0]}–{restaurant.partySizes[restaurant.partySizes.length - 1]} guests
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={startReservation}>
          <CalendarCheck className="size-4" />
          Find a Table
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          {step === "party" && (
            <>
              <DialogHeader>
                <DialogTitle>Party size</DialogTitle>
                <DialogDescription>Reserving at {restaurant.name}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {restaurant.partySizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPartySize(size)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-3 text-sm font-medium transition-colors ${
                      partySize === size
                        ? "border-primary bg-accent"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <Users className="size-3.5" />
                    {size}
                  </button>
                ))}
              </div>
              <DialogFooter>
                <Button
                  disabled={!partySize}
                  className="w-full"
                  onClick={() => {
                    setStep("datetime");
                    loadSlots(date);
                  }}
                >
                  Continue
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "datetime" && partySize && (
            <>
              <DialogHeader>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 w-fit gap-1 text-muted-foreground"
                  onClick={() => setStep("party")}
                >
                  <ChevronLeft className="size-4" />
                  Back
                </Button>
                <DialogTitle>Pick a date & time</DialogTitle>
                <DialogDescription>Table for {partySize}</DialogDescription>
              </DialogHeader>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {dateOptions.map((d) => (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => {
                      setDate(d.iso);
                      loadSlots(d.iso);
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
                  Checking tables&hellip;
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

          {step === "details" && partySize && time && (
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
                <p className="font-medium text-foreground">Table for {partySize}</p>
                <p className="text-muted-foreground">
                  {dateOptions.find((d) => d.iso === date)?.label} at {time} &middot;{" "}
                  {restaurant.name}
                </p>
              </div>

              {!currentUser ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-6 text-center">
                  <span className="flex size-11 items-center justify-center rounded-full bg-muted">
                    <LogIn className="size-5 text-muted-foreground" />
                  </span>
                  <p className="font-medium text-foreground">Log in to confirm</p>
                  <p className="text-sm text-muted-foreground">
                    Your reservations are saved to your account so you can find them later.
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
                    <Label htmlFor="res-name">Full name</Label>
                    <Input
                      id="res-name"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Amaya Silva"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="res-phone">Phone number</Label>
                    <Input
                      id="res-phone"
                      required
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="res-notes">Occasion or notes (optional)</Label>
                    <Textarea
                      id="res-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Birthday, dietary needs, seating preference"
                      rows={2}
                    />
                  </div>

                  <div className="rounded-xl border border-border p-3">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                      <CreditCard className="size-4" />
                      Card on file
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="res-card">Card number</Label>
                        <Input
                          id="res-card"
                          required
                          inputMode="numeric"
                          autoComplete="cc-number"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 4242 4242 4242"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="res-expiry">Expiry</Label>
                          <Input
                            id="res-expiry"
                            required
                            autoComplete="cc-exp"
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            placeholder="MM/YY"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="res-cvc">CVC</Label>
                          <Input
                            id="res-cvc"
                            required
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            value={cvc}
                            onChange={(e) => setCvc(e.target.value)}
                            placeholder="123"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                      We won&apos;t charge your card unless you don&apos;t show up for
                      your reservation.
                    </p>
                  </div>

                  <DialogFooter className="-mb-0 border-t-0 bg-transparent px-0 pb-0">
                    <Button type="submit" disabled={!canConfirm || submitting} className="w-full">
                      {submitting ? "Confirming…" : "Confirm Reservation"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </>
          )}

          {step === "success" && lastReservationSummary && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-7" />
              </span>
              <div>
                <DialogTitle className="text-lg">Reservation confirmed!</DialogTitle>
                <DialogDescription className="mt-1">
                  See you at {restaurant.name}
                </DialogDescription>
              </div>
              <div className="w-full rounded-xl bg-muted p-4 text-left text-sm">
                <p className="font-medium text-foreground">
                  Table for {lastReservationSummary.partySize}
                </p>
                <p className="text-muted-foreground">
                  {lastReservationSummary.date} at {lastReservationSummary.time}
                </p>
                <p className="mt-1 flex items-center gap-1.5 font-medium text-foreground">
                  <ShieldCheck className="size-3.5" />
                  No charge unless no-show
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

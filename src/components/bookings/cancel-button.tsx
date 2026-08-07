"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cancelAppointmentAction } from "@/lib/actions/bookings";

export function CancelButton({
  id,
  priceLKR,
  cancellationFeeEnabled,
  cancellationFeePercent,
}: {
  id: string;
  priceLKR: number;
  cancellationFeeEnabled: boolean;
  cancellationFeePercent: number;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const feeLKR = Math.round((priceLKR * cancellationFeePercent) / 100);

  function doCancel() {
    startTransition(async () => {
      const result = await cancelAppointmentAction(id);
      setOpen(false);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast("Booking cancelled");
    });
  }

  function handleClick() {
    if (cancellationFeeEnabled) {
      setOpen(true);
      return;
    }
    doCancel();
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleClick}
      >
        {pending ? "Cancelling…" : "Cancel"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              This salon charges a {cancellationFeePercent}% cancellation fee — you&apos;ll owe LKR{" "}
              {feeLKR.toLocaleString()}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Keep booking
            </Button>
            <Button
              variant="destructive"
              onClick={doCancel}
              disabled={pending}
            >
              {pending ? "Cancelling…" : "Cancel anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

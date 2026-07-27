"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelVendorAppointment } from "@/lib/actions/vendor-bookings";

export function VendorCancelButton({
  id,
  kind,
  venueId,
  isManual,
}: {
  id: string;
  kind: "salon" | "restaurant";
  venueId: string;
  isManual: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleCancel() {
    const message = isManual
      ? "Remove this manually-added booking?"
      : "Cancel this customer's booking? They will not be notified automatically.";
    if (!confirm(message)) return;

    startTransition(async () => {
      const result = await cancelVendorAppointment(id, kind, venueId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast(isManual ? "Booking removed" : "Booking cancelled");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={handleCancel}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      {pending ? "Cancelling…" : "Cancel"}
    </Button>
  );
}

"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelAppointmentAction } from "@/lib/actions/bookings";

export function CancelButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelAppointmentAction(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast("Booking cancelled");
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={handleCancel}
    >
      {pending ? "Cancelling…" : "Cancel"}
    </Button>
  );
}

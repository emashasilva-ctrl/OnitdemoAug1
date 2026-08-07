"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markCheckedIn, markNoShow } from "@/lib/actions/billing";
import { BillDialog } from "@/components/vendor/bill-dialog";
import type { VendorTodayAppointment } from "@/lib/data/vendor";
import type { Salon } from "@/lib/types";

export function TodayAppointmentActions({
  appointment,
  salon,
}: {
  appointment: VendorTodayAppointment;
  salon: Salon;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleCheckIn() {
    startTransition(async () => {
      const result = await markCheckedIn(appointment.id, salon.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast("Client checked in");
      router.refresh();
    });
  }

  function handleNoShow() {
    if (!confirm(`Mark ${appointment.customerName} as a no-show?`)) return;
    startTransition(async () => {
      const result = await markNoShow(appointment.id, salon.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast("Marked as no-show");
      router.refresh();
    });
  }

  if (appointment.status === "UPCOMING") {
    return (
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={handleCheckIn}>
          Check in
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={handleNoShow}>
          No-show
        </Button>
      </div>
    );
  }

  if (appointment.status === "CHECKED_IN" || appointment.status === "NO_SHOW") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {appointment.status === "CHECKED_IN" ? "Checked in" : "No-show"}
        </Badge>
        <BillDialog
          mode="create"
          salon={salon}
          appointment={{
            id: appointment.id,
            label: appointment.label,
            customerName: appointment.customerName,
            customerPhone: appointment.customerPhone,
            priceLKR: appointment.priceLKR,
            basePriceLKR: appointment.basePriceLKR,
            appliedRuleLabel: appointment.appliedRuleLabel,
            status: appointment.status,
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary">Billed</Badge>
      {appointment.billId && <BillDialog mode="view" salon={salon} billId={appointment.billId} />}
    </div>
  );
}

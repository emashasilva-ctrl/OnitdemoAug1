import { Mail, MessageCircle } from "lucide-react";
import { BillDialog } from "@/components/vendor/bill-dialog";
import type { VendorBillListItem } from "@/lib/data/vendor";
import type { Salon } from "@/lib/types";

export function BillsHistoryList({
  bills,
  salon,
}: {
  bills: VendorBillListItem[];
  salon: Salon;
}) {
  if (bills.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No bills yet — generate one from a checked-in booking on the dashboard.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {bills.map((bill) => (
        <div
          key={bill.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4"
        >
          <div className="min-w-0">
            <p className="font-heading font-semibold text-foreground">{bill.customerName}</p>
            <p className="text-sm text-muted-foreground">
              {bill.serviceLabel} &middot; {bill.appointmentDate}
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              {bill.emailSentAt && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3" />
                  Emailed
                </span>
              )}
              {bill.whatsappSentAt && (
                <span className="flex items-center gap-1">
                  <MessageCircle className="size-3" />
                  WhatsApp sent
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <p className="font-heading font-semibold text-foreground">
              LKR {bill.totalLKR.toLocaleString()}
            </p>
            <BillDialog mode="view" billId={bill.id} salon={salon} />
          </div>
        </div>
      ))}
    </div>
  );
}

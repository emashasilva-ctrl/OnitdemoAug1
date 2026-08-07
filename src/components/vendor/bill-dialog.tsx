"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Receipt, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  generateBill,
  markBillEmailSent,
  markBillWhatsAppSent,
  getBillDetail,
} from "@/lib/actions/billing";
import type { VendorBillDetail } from "@/lib/data/vendor";
import type { BillLineItemKind } from "@/lib/billing";
import { isValidIntlPhone, toWhatsAppDigits } from "@/lib/phone";

interface DraftLineItem {
  label: string;
  amountLKR: string;
  kind: BillLineItemKind;
}

type BillDialogSalon = {
  id: string;
  name: string;
  address: string;
  phone: string;
  noShowFeeEnabled: boolean;
  noShowFeePercent: number;
};

type BillDialogProps =
  | {
      mode: "create";
      salon: BillDialogSalon;
      appointment: {
        id: string;
        label: string;
        customerName: string;
        customerPhone: string;
        priceLKR: number | null;
        basePriceLKR: number | null;
        appliedRuleLabel: string | null;
        status: "CHECKED_IN" | "NO_SHOW";
      };
    }
  | {
      mode: "view";
      salon: BillDialogSalon;
      billId: string;
    };

function buildInitialLineItems(
  appointment: Extract<BillDialogProps, { mode: "create" }>["appointment"],
  salon: BillDialogSalon
): DraftLineItem[] {
  if (appointment.status === "NO_SHOW") {
    const fee =
      salon.noShowFeeEnabled && appointment.priceLKR != null
        ? Math.round((appointment.priceLKR * salon.noShowFeePercent) / 100)
        : 0;
    return [{ label: "No-show fee", amountLKR: String(fee), kind: "noShowFee" }];
  }

  const items: DraftLineItem[] = [
    {
      label: appointment.label,
      amountLKR: String(appointment.basePriceLKR ?? appointment.priceLKR ?? 0),
      kind: "service",
    },
  ];
  if (
    appointment.appliedRuleLabel &&
    appointment.basePriceLKR != null &&
    appointment.priceLKR != null
  ) {
    items.push({
      label: appointment.appliedRuleLabel,
      amountLKR: String(appointment.priceLKR - appointment.basePriceLKR),
      kind: "pricingRule",
    });
  }
  return items;
}

function ReceiptView({
  bill,
  salon,
  onSent,
}: {
  bill: VendorBillDetail;
  salon: BillDialogSalon;
  onSent: (next: VendorBillDetail) => void;
}) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const canEmail = bill.customerEmail != null;
  const canWhatsApp = isValidIntlPhone(bill.customerPhone);

  async function handleEmail() {
    setSendingEmail(true);
    const result = await markBillEmailSent(bill.id, salon.id);
    setSendingEmail(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Bill emailed to customer");
    onSent({ ...bill, emailSentAt: new Date().toISOString() });
  }

  async function handleWhatsApp() {
    const total = `LKR ${bill.totalLKR.toLocaleString()}`;
    const message = encodeURIComponent(
      `Hi ${bill.customerName}, here's your bill from ${salon.name} for ${bill.serviceLabel} — ${total}. Thank you!`
    );
    window.open(`https://wa.me/${toWhatsAppDigits(bill.customerPhone)}?text=${message}`, "_blank");

    setSendingWhatsApp(true);
    const result = await markBillWhatsAppSent(bill.id, salon.id);
    setSendingWhatsApp(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    onSent({ ...bill, whatsappSentAt: new Date().toISOString() });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 font-mono text-sm">
        <div className="text-center">
          <p className="font-heading text-base font-semibold not-italic text-foreground">
            {salon.name}
          </p>
          <p className="text-xs text-muted-foreground">{salon.address}</p>
          <p className="text-xs text-muted-foreground">{salon.phone}</p>
        </div>
        <div className="my-3 border-t border-dashed border-border" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{bill.customerName}</span>
          <span>{bill.appointmentDate} · {bill.appointmentTime}</span>
        </div>
        <div className="my-3 border-t border-dashed border-border" />
        <div className="flex flex-col gap-1.5">
          {bill.lineItems.map((item, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3">
              <span className="text-foreground">{item.label}</span>
              <span className="shrink-0 tabular-nums text-foreground">
                {item.amountLKR.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <div className="my-3 border-t border-dashed border-border" />
        <div className="flex items-baseline justify-between font-semibold text-foreground">
          <span>Total</span>
          <span className="tabular-nums">LKR {bill.totalLKR.toLocaleString()}</span>
        </div>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Generated {new Date(bill.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {canEmail ? (
          <Button type="button" variant="outline" disabled={sendingEmail} onClick={handleEmail}>
            {bill.emailSentAt
              ? `Sent by email on ${new Date(bill.emailSentAt).toLocaleDateString()} — resend`
              : sendingEmail
                ? "Sending…"
                : "Send via Email"}
          </Button>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            No email on file — walk-in booking
          </p>
        )}
        {canWhatsApp ? (
          <Button type="button" variant="outline" disabled={sendingWhatsApp} onClick={handleWhatsApp}>
            {bill.whatsappSentAt
              ? `Sent via WhatsApp on ${new Date(bill.whatsappSentAt).toLocaleDateString()} — resend`
              : "Send via WhatsApp"}
          </Button>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            No WhatsApp-formatted number on file
          </p>
        )}
      </div>
    </div>
  );
}

export function BillDialog(props: BillDialogProps) {
  const { salon } = props;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"edit" | "receipt">(
    props.mode === "view" ? "receipt" : "edit"
  );
  const [lineItems, setLineItems] = useState<DraftLineItem[]>(
    props.mode === "create" ? buildInitialLineItems(props.appointment, salon) : []
  );
  const [bill, setBill] = useState<VendorBillDetail | null>(null);
  const [loadingBill, setLoadingBill] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const total = lineItems.reduce((sum, item) => sum + (Number(item.amountLKR) || 0), 0);
  const canGenerate =
    lineItems.length > 0 && lineItems.every((item) => item.label.trim().length > 0);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;

    if (props.mode === "view") {
      setLoadingBill(true);
      const detail = await getBillDetail(props.billId, salon.id);
      setLoadingBill(false);
      setBill(detail);
      setPhase("receipt");
    } else {
      setLineItems(buildInitialLineItems(props.appointment, salon));
      setPhase("edit");
      setBill(null);
    }
  }

  function updateLineItem(index: number, patch: Partial<DraftLineItem>) {
    setLineItems((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeLineItem(index: number) {
    setLineItems((items) => items.filter((_, i) => i !== index));
  }

  function addLineItem() {
    setLineItems((items) => [...items, { label: "", amountLKR: "0", kind: "custom" }]);
  }

  async function handleGenerate() {
    if (props.mode !== "create") return;
    setSubmitting(true);
    const result = await generateBill({
      appointmentId: props.appointment.id,
      salonId: salon.id,
      lineItems: lineItems.map((item) => ({
        label: item.label.trim(),
        amountLKR: Math.round(Number(item.amountLKR) || 0),
        kind: item.kind,
      })),
    });
    setSubmitting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Bill generated");
    if (result.bill) {
      setBill(result.bill);
      setPhase("receipt");
    }
    router.refresh();
  }

  const triggerLabel = props.mode === "view" ? "View bill" : "Create bill";

  return (
    <>
      <Button type="button" size="sm" variant={props.mode === "view" ? "outline" : "default"} onClick={() => handleOpenChange(true)}>
        <Receipt className="size-4" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{phase === "edit" ? "Review bill" : "Bill"}</DialogTitle>
            {phase === "edit" && (
              <DialogDescription>
                Confirm the line items before generating the final bill.
              </DialogDescription>
            )}
          </DialogHeader>

          {loadingBill ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading bill…</p>
          ) : phase === "edit" ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                {lineItems.map((item, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex flex-1 flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Item</Label>
                      <Input
                        value={item.label}
                        onChange={(e) => updateLineItem(i, { label: e.target.value })}
                      />
                    </div>
                    <div className="flex w-28 flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">LKR</Label>
                      <Input
                        type="number"
                        value={item.amountLKR}
                        onChange={(e) => updateLineItem(i, { amountLKR: e.target.value })}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(i)}
                      aria-label="Remove line item"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="w-fit">
                <Plus className="size-4" />
                Add line item
              </Button>
              <div className="flex items-baseline justify-between border-t border-border pt-3 font-semibold text-foreground">
                <span>Total</span>
                <span className="tabular-nums">LKR {total.toLocaleString()}</span>
              </div>
              <DialogFooter className="px-0 pb-0">
                <Button
                  type="button"
                  disabled={!canGenerate || submitting}
                  onClick={handleGenerate}
                  className="w-full"
                >
                  {submitting ? "Generating…" : "Generate Bill"}
                </Button>
              </DialogFooter>
            </div>
          ) : bill ? (
            <ReceiptView bill={bill} salon={salon} onSent={setBill} />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Bill not found.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

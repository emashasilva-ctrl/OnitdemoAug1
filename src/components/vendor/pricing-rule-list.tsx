"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createPricingRule,
  deletePricingRule,
  updatePricingRule,
  type PricingRuleInput,
} from "@/lib/actions/pricing";
import { DAYS_OF_WEEK, minutesToLabel, minutesToTimeValue, timeValueToMinutes } from "@/lib/time";
import type { PricingRule, Service } from "@/lib/types";

type FormState = {
  label: string;
  type: PricingRuleInput["type"];
  amountType: PricingRuleInput["amountType"];
  amount: string;
  days: string[];
  startTime: string;
  endTime: string;
  appliesToAllServices: boolean;
  serviceIds: string[];
  enabled: boolean;
};

const emptyForm: FormState = {
  label: "",
  type: "DISCOUNT",
  amountType: "PERCENT",
  amount: "",
  days: [],
  startTime: "09:00",
  endTime: "17:00",
  appliesToAllServices: true,
  serviceIds: [],
  enabled: true,
};

function formatAmount(rule: PricingRule): string {
  const sign = rule.type === "DISCOUNT" ? "-" : "+";
  const amount = rule.amountType === "PERCENT" ? `${rule.amount}%` : `LKR ${rule.amount.toLocaleString()}`;
  return `${sign}${amount}`;
}

function toggleButtonClass(active: boolean): string {
  return `rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border text-foreground hover:bg-muted"
  }`;
}

export function PricingRuleList({
  salonId,
  rules,
  services,
}: {
  salonId: string;
  rules: PricingRule[];
  services: Service[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PricingRule | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(rule: PricingRule) {
    setEditing(rule);
    setForm({
      label: rule.label,
      type: rule.type,
      amountType: rule.amountType,
      amount: String(rule.amount),
      days: rule.days,
      startTime: minutesToTimeValue(rule.startMinutes),
      endTime: minutesToTimeValue(rule.endMinutes),
      appliesToAllServices: rule.appliesToAllServices,
      serviceIds: rule.serviceIds,
      enabled: rule.enabled,
    });
    setOpen(true);
  }

  function toggleDay(day: string) {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
    }));
  }

  function toggleService(id: string) {
    setForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(id)
        ? prev.serviceIds.filter((s) => s !== id)
        : [...prev.serviceIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const input: PricingRuleInput = {
      label: form.label,
      type: form.type,
      amountType: form.amountType,
      amount: Number(form.amount),
      days: form.days,
      startMinutes: timeValueToMinutes(form.startTime),
      endMinutes: timeValueToMinutes(form.endTime),
      appliesToAllServices: form.appliesToAllServices,
      serviceIds: form.appliesToAllServices ? [] : form.serviceIds,
      enabled: form.enabled,
    };
    const result = editing
      ? await updatePricingRule(editing.id, salonId, input)
      : await createPricingRule(salonId, input);
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? "Pricing rule updated" : "Pricing rule added");
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(rule: PricingRule) {
    if (!confirm(`Remove "${rule.label}"?`)) return;
    const result = await deletePricingRule(rule.id, salonId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast("Pricing rule removed");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div>
        <p className="font-heading font-semibold text-foreground">Pricing rules</p>
        <p className="text-sm text-muted-foreground">
          Discount quiet hours or add a surcharge for your busiest times — recurring by day and time.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rules.length} rules</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Add pricing rule
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-heading font-semibold text-foreground">{rule.label}</p>
                <Badge variant={rule.type === "DISCOUNT" ? "default" : "destructive"}>
                  {formatAmount(rule)}
                </Badge>
                {!rule.enabled && <Badge variant="secondary">Disabled</Badge>}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {rule.days.join(", ")} · {minutesToLabel(rule.startMinutes)} – {minutesToLabel(rule.endMinutes)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {rule.appliesToAllServices
                  ? "All services"
                  : `${rule.serviceIds.length} service${rule.serviceIds.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => openEdit(rule)} aria-label="Edit">
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(rule)}
                aria-label="Delete"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit pricing rule" : "Add pricing rule"}</DialogTitle>
            <DialogDescription>
              Applies automatically to bookings that fall in this day/time window.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rule-label">Name</Label>
              <Input
                id="rule-label"
                required
                placeholder="Weekday Afternoon Special"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={toggleButtonClass(form.type === "DISCOUNT")}
                  onClick={() => setForm({ ...form, type: "DISCOUNT" })}
                >
                  Discount (off-peak)
                </button>
                <button
                  type="button"
                  className={toggleButtonClass(form.type === "SURCHARGE")}
                  onClick={() => setForm({ ...form, type: "SURCHARGE" })}
                >
                  Surcharge (peak)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Amount type</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={toggleButtonClass(form.amountType === "PERCENT")}
                    onClick={() => setForm({ ...form, amountType: "PERCENT" })}
                  >
                    Percent
                  </button>
                  <button
                    type="button"
                    className={toggleButtonClass(form.amountType === "FLAT")}
                    onClick={() => setForm({ ...form, amountType: "FLAT" })}
                  >
                    Flat LKR
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rule-amount">
                  {form.amountType === "PERCENT" ? "Percent (1-100)" : "Amount (LKR)"}
                </Label>
                <Input
                  id="rule-amount"
                  required
                  type="number"
                  min={1}
                  max={form.amountType === "PERCENT" ? 100 : undefined}
                  placeholder={form.amountType === "PERCENT" ? "15" : "500"}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={toggleButtonClass(form.days.includes(day))}
                    onClick={() => toggleDay(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rule-start">Start time</Label>
                <input
                  id="rule-start"
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rule-end">End time</Label>
                <input
                  id="rule-end"
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rule-all-services"
                  checked={form.appliesToAllServices}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, appliesToAllServices: checked === true })
                  }
                />
                <Label htmlFor="rule-all-services" className="font-normal">
                  Apply to all services
                </Label>
              </div>
              {!form.appliesToAllServices && (
                <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-border p-3">
                  {services.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Add a service first.</p>
                  ) : (
                    services.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={toggleButtonClass(form.serviceIds.includes(s.id))}
                        onClick={() => toggleService(s.id)}
                      >
                        {s.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="rule-enabled"
                checked={form.enabled}
                onCheckedChange={(checked) => setForm({ ...form, enabled: checked === true })}
              />
              <Label htmlFor="rule-enabled" className="font-normal">
                Enabled
              </Label>
            </div>

            <DialogFooter className="px-0 pb-0">
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Saving…" : editing ? "Save changes" : "Add pricing rule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

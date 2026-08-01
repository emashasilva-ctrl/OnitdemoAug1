"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createPromotion, deletePromotion, updatePromotion } from "@/lib/actions/promotions";
import { toLocalISODate } from "@/lib/time";
import type { VendorPromotion } from "@/lib/data/vendor";

const emptyForm = { title: "", description: "", startDate: "", endDate: "" };

function statusFor(promo: VendorPromotion, today: string): { label: string; variant: "default" | "outline" | "secondary" } {
  if (promo.startDate && promo.startDate > today) return { label: "Scheduled", variant: "outline" };
  if (promo.endDate && promo.endDate < today) return { label: "Ended", variant: "secondary" };
  return { label: "Active now", variant: "default" };
}

export function PromotionList({
  venueKind,
  venueId,
  promotions,
}: {
  venueKind: "salon";
  venueId: string;
  promotions: VendorPromotion[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VendorPromotion | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const today = toLocalISODate(new Date());

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(promo: VendorPromotion) {
    setEditing(promo);
    setForm({
      title: promo.title,
      description: promo.description,
      startDate: promo.startDate ?? "",
      endDate: promo.endDate ?? "",
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const input = {
      venueKind,
      venueId,
      title: form.title,
      description: form.description,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };
    const result = editing ? await updatePromotion(editing.id, input) : await createPromotion(input);
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? "Promotion updated" : "Promotion added");
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(promo: VendorPromotion) {
    if (!confirm(`Remove "${promo.title}"?`)) return;
    const result = await deletePromotion(promo.id, venueKind, venueId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast("Promotion removed");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{promotions.length} promotions</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Add promotion
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {promotions.map((promo) => {
          const status = statusFor(promo, today);
          return (
            <div
              key={promo.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-heading font-semibold text-foreground">{promo.title}</p>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{promo.description}</p>
                {(promo.startDate || promo.endDate) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {promo.startDate ?? "Anytime"} &rarr; {promo.endDate ?? "No end date"}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => openEdit(promo)} aria-label="Edit">
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(promo)}
                  aria-label="Delete"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit promotion" : "Add promotion"}</DialogTitle>
            <DialogDescription>
              Shows at the top of your public page while active. Leave dates blank to run indefinitely.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promo-title">Title</Label>
              <Input
                id="promo-title"
                required
                placeholder="20% off haircuts this week!"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promo-desc">Description</Label>
              <Textarea
                id="promo-desc"
                rows={2}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="promo-start">Start date (optional)</Label>
                <Input
                  id="promo-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="promo-end">End date (optional)</Label>
                <Input
                  id="promo-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="px-0 pb-0">
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Saving…" : editing ? "Save changes" : "Add promotion"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

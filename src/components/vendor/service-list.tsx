"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getCategory } from "@/lib/data/categories";
import { createService, deleteService, updateService } from "@/lib/actions/vendor";
import type { CategorySlug, Service } from "@/lib/types";

const CUSTOM = "__custom__";

interface ServiceGroup {
  key: string;
  label: string;
  services: Service[];
}

function groupServices(services: Service[], salonCategories: CategorySlug[]): ServiceGroup[] {
  const byCategory = new Map<string, Service[]>();
  for (const s of services) {
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category)!.push(s);
  }

  const known = salonCategories.filter((c) => byCategory.has(c));
  const custom = [...byCategory.keys()].filter((c) => !salonCategories.includes(c as CategorySlug));

  return [...known, ...custom].map((key) => ({
    key,
    label: getCategory(key)?.label ?? key,
    services: byCategory.get(key)!,
  }));
}

interface FormState {
  name: string;
  categoryChoice: string;
  customCategory: string;
  durationMins: number;
  priceLKR: number;
  description: string;
}

function buildEmptyForm(salonCategories: CategorySlug[]): FormState {
  return {
    name: "",
    categoryChoice: salonCategories[0] ?? CUSTOM,
    customCategory: "",
    durationMins: 60,
    priceLKR: 0,
    description: "",
  };
}

function buildEditForm(service: Service, salonCategories: CategorySlug[]): FormState {
  const isKnown = salonCategories.includes(service.category as CategorySlug);
  return {
    name: service.name,
    categoryChoice: isKnown ? service.category : CUSTOM,
    customCategory: isKnown ? "" : service.category,
    durationMins: service.durationMins,
    priceLKR: service.priceLKR,
    description: service.description,
  };
}

export function ServiceList({
  salonId,
  services,
  salonCategories,
}: {
  salonId: string;
  services: Service[];
  salonCategories: CategorySlug[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<FormState>(() => buildEmptyForm(salonCategories));
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(buildEmptyForm(salonCategories));
    setOpen(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setForm(buildEditForm(service, salonCategories));
    setOpen(true);
  }

  const isCustom = form.categoryChoice === CUSTOM;
  const finalCategory = isCustom ? form.customCategory.trim() : form.categoryChoice;
  const canSubmit = form.name.trim().length > 0 && finalCategory.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const input = {
      salonId,
      name: form.name,
      category: finalCategory,
      durationMins: form.durationMins,
      priceLKR: form.priceLKR,
      description: form.description,
    };
    const result = editing ? await updateService(editing.id, input) : await createService(input);
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? "Service updated" : "Service added");
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(service: Service) {
    if (!confirm(`Remove "${service.name}"?`)) return;
    const result = await deleteService(service.id, salonId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast("Service removed");
    router.refresh();
  }

  const groups = groupServices(services, salonCategories);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{services.length} services</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Add service
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.key} className="flex flex-col gap-3">
            <h3 className="font-heading text-base font-semibold text-foreground">{group.label}</h3>
            <div className="flex flex-col gap-3">
              {group.services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="min-w-0">
                    <p className="font-heading font-semibold text-foreground">{service.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{service.description}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{service.durationMins} min</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="font-heading font-semibold text-foreground">
                      LKR {service.priceLKR.toLocaleString()}
                    </p>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(service)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(service)}
                      aria-label="Delete"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit service" : "Add service"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-name">Name</Label>
              <Input
                id="svc-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select
                value={form.categoryChoice}
                onValueChange={(v) => setForm({ ...form, categoryChoice: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {salonCategories.map((slug) => (
                    <SelectItem key={slug} value={slug}>
                      {getCategory(slug)?.label ?? slug}
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM}>Custom…</SelectItem>
                </SelectContent>
              </Select>
              {isCustom && (
                <Input
                  className="mt-1.5"
                  placeholder="e.g. Keratin Treatments"
                  required
                  value={form.customCategory}
                  onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-duration">Duration (min)</Label>
                <Input
                  id="svc-duration"
                  type="number"
                  required
                  min={5}
                  value={form.durationMins}
                  onChange={(e) => setForm({ ...form, durationMins: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="svc-price">Price (LKR)</Label>
                <Input
                  id="svc-price"
                  type="number"
                  required
                  min={0}
                  value={form.priceLKR}
                  onChange={(e) => setForm({ ...form, priceLKR: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-desc">Description</Label>
              <Textarea
                id="svc-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <DialogFooter className="px-0 pb-0">
              <Button type="submit" disabled={submitting || !canSubmit} className="w-full">
                {submitting ? "Saving…" : editing ? "Save changes" : "Add service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

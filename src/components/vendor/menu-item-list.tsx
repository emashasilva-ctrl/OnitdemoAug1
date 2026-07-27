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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createMenuHighlight,
  deleteMenuHighlight,
  updateMenuHighlight,
} from "@/lib/actions/vendor";
import type { MenuHighlight } from "@/lib/types";

const emptyForm = { name: "", priceLKR: 0, description: "" };

export function MenuItemList({
  restaurantId,
  menuHighlights,
}: {
  restaurantId: string;
  menuHighlights: MenuHighlight[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuHighlight | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(item: MenuHighlight) {
    setEditing(item);
    setForm({ name: item.name, priceLKR: item.priceLKR, description: item.description });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = editing
      ? await updateMenuHighlight(editing.id, { restaurantId, ...form })
      : await createMenuHighlight({ restaurantId, ...form });
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? "Menu item updated" : "Menu item added");
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(item: MenuHighlight) {
    if (!confirm(`Remove "${item.name}"?`)) return;
    const result = await deleteMenuHighlight(item.id, restaurantId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast("Menu item removed");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{menuHighlights.length} menu items</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Add menu item
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {menuHighlights.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="min-w-0">
              <p className="font-heading font-semibold text-foreground">{item.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <p className="font-heading font-semibold text-foreground">
                LKR {item.priceLKR.toLocaleString()}
              </p>
              <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label="Edit">
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(item)}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit menu item" : "Add menu item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="menu-name">Name</Label>
              <Input
                id="menu-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="menu-price">Price (LKR)</Label>
              <Input
                id="menu-price"
                type="number"
                required
                min={0}
                value={form.priceLKR}
                onChange={(e) => setForm({ ...form, priceLKR: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="menu-desc">Description</Label>
              <Textarea
                id="menu-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <DialogFooter className="px-0 pb-0">
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Saving…" : editing ? "Save changes" : "Add menu item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

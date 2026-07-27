"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/data/categories";
import { updateSalonCategories } from "@/lib/actions/vendor";
import type { CategorySlug } from "@/lib/types";

export function SalonCategoriesEditor({
  salonId,
  initial,
}: {
  salonId: string;
  initial: CategorySlug[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<CategorySlug[]>(initial);
  const [saving, setSaving] = useState(false);

  function toggle(slug: CategorySlug) {
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateSalonCategories(salonId, selected);
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Categories updated");
    router.refresh();
  }

  const isDirty =
    selected.length !== initial.length || selected.some((s) => !initial.includes(s));

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div>
        <p className="font-heading font-semibold text-foreground">Categories</p>
        <p className="text-sm text-muted-foreground">
          Pick every category your salon offers — customers can find you under any of them.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => toggle(c.slug)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              selected.includes(c.slug)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-foreground hover:bg-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <Button onClick={handleSave} disabled={saving || !isDirty} className="w-fit">
        {saving ? "Saving…" : "Save categories"}
      </Button>
    </div>
  );
}

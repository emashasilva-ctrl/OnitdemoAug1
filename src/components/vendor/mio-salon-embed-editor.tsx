"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateMioSalonEmbedCode } from "@/lib/actions/vendor";

export function MioSalonEmbedEditor({
  salonId,
  initial,
}: {
  salonId: string;
  initial: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateMioSalonEmbedCode(salonId, value);
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("MioSalon booking widget updated");
    router.refresh();
  }

  const isDirty = value !== (initial ?? "");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div>
        <p className="font-heading font-semibold text-foreground">MioSalon booking widget</p>
        <p className="text-sm text-muted-foreground">
          Paste your MioSalon branch&apos;s booking-link embed code to let customers book
          through MioSalon instead of On It!&apos;s built-in booking. Leave blank to use On
          It!&apos;s booking.
        </p>
      </div>
      <Textarea
        rows={4}
        placeholder="Paste your MioSalon embed code here…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="font-mono text-xs"
      />
      <Button onClick={handleSave} disabled={saving || !isDirty} className="w-fit">
        {saving ? "Saving…" : "Save booking widget"}
      </Button>
    </div>
  );
}

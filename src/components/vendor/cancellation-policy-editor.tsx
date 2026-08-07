"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCancellationPolicy } from "@/lib/actions/pricing";

export function CancellationPolicyEditor({
  salonId,
  initialEnabled,
  initialPercent,
}: {
  salonId: string;
  initialEnabled: boolean;
  initialPercent: number;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [percent, setPercent] = useState(String(initialPercent));
  const [saving, setSaving] = useState(false);

  const isDirty = enabled !== initialEnabled || percent !== String(initialPercent);

  async function handleSave() {
    setSaving(true);
    const result = await updateCancellationPolicy(salonId, { enabled, percent: Number(percent) });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Cancellation policy updated");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div>
        <p className="font-heading font-semibold text-foreground">Cancellation policy</p>
        <p className="text-sm text-muted-foreground">
          Customers see this fee before they book, and it&apos;s charged if they cancel.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="cancellation-enabled"
          checked={enabled}
          onCheckedChange={(checked) => setEnabled(checked === true)}
        />
        <Label htmlFor="cancellation-enabled" className="font-normal">
          Charge a cancellation fee when customers cancel
        </Label>
      </div>
      {enabled && (
        <div className="flex flex-col gap-1.5 sm:w-48">
          <Label htmlFor="cancellation-percent">Fee (% of booking price)</Label>
          <Input
            id="cancellation-percent"
            type="number"
            min={1}
            max={100}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
          />
        </div>
      )}
      <Button onClick={handleSave} disabled={saving || !isDirty} className="w-fit">
        {saving ? "Saving…" : "Save cancellation policy"}
      </Button>
    </div>
  );
}

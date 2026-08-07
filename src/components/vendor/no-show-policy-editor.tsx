"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateNoShowPolicy } from "@/lib/actions/pricing";

export function NoShowPolicyEditor({
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
    const result = await updateNoShowPolicy(salonId, { enabled, percent: Number(percent) });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("No-show policy updated");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div>
        <p className="font-heading font-semibold text-foreground">No-show policy</p>
        <p className="text-sm text-muted-foreground">
          Applied automatically when you mark a client a no-show, so it&apos;s pre-filled on
          their bill.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="no-show-enabled"
          checked={enabled}
          onCheckedChange={(checked) => setEnabled(checked === true)}
        />
        <Label htmlFor="no-show-enabled" className="font-normal">
          Charge a no-show fee when clients don&apos;t show up
        </Label>
      </div>
      {enabled && (
        <div className="flex flex-col gap-1.5 sm:w-48">
          <Label htmlFor="no-show-percent">Fee (% of booking price)</Label>
          <Input
            id="no-show-percent"
            type="number"
            min={1}
            max={100}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
          />
        </div>
      )}
      <Button onClick={handleSave} disabled={saving || !isDirty} className="w-fit">
        {saving ? "Saving…" : "Save no-show policy"}
      </Button>
    </div>
  );
}

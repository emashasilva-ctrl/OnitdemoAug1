"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePersonalDetails } from "@/lib/actions/account";

export function AccountDetailsForm({
  email,
  initial,
}: {
  email: string;
  initial: { name: string; phone: string; whatsappNumber: string };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(
    initial.whatsappNumber === initial.phone && initial.whatsappNumber !== ""
  );
  const [whatsappNumber, setWhatsappNumber] = useState(initial.whatsappNumber);
  const [saving, setSaving] = useState(false);

  const currentWhatsapp = whatsappSameAsPhone ? phone : whatsappNumber;
  const isDirty =
    name !== initial.name || phone !== initial.phone || currentWhatsapp !== initial.whatsappNumber;

  async function handleSave() {
    setSaving(true);
    const result = await updatePersonalDetails(name, phone, currentWhatsapp);
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Personal details updated");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div>
        <p className="font-heading font-semibold text-foreground">Personal details</p>
        <p className="text-sm text-muted-foreground">
          This is how On It! and salons you book with will reach you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="account-name">Name</Label>
          <Input id="account-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="account-email">Email</Label>
          <Input id="account-email" value={email} disabled />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="account-phone">Phone number</Label>
          <Input
            id="account-phone"
            type="tel"
            placeholder="+94 771234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="account-whatsapp">WhatsApp number</Label>
        <Input
          id="account-whatsapp"
          type="tel"
          placeholder="+94 771234567"
          value={whatsappSameAsPhone ? phone : whatsappNumber}
          disabled={whatsappSameAsPhone}
          onChange={(e) => setWhatsappNumber(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Checkbox
            id="account-whatsapp-same"
            checked={whatsappSameAsPhone}
            onCheckedChange={(checked) => setWhatsappSameAsPhone(checked === true)}
          />
          <Label htmlFor="account-whatsapp-same" className="font-normal text-muted-foreground">
            Same as phone number
          </Label>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving || !isDirty} className="w-fit">
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

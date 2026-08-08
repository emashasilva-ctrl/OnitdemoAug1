"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/actions/account";

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const isDirty = newPassword.length > 0 || confirmPassword.length > 0;

  async function handleSave() {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setSaving(true);
    const result = await changePassword(currentPassword, newPassword);
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(hasPassword ? "Password updated" : "Password set");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div>
        <p className="font-heading font-semibold text-foreground">
          {hasPassword ? "Change password" : "Set a password"}
        </p>
        <p className="text-sm text-muted-foreground">
          {hasPassword
            ? "Update the password used to sign in with your email."
            : "Your account currently only signs in with Google. Set a password to also sign in with your email directly."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {hasPassword && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-current-password">Current password</Label>
            <Input
              id="account-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="account-new-password">New password</Label>
          <Input
            id="account-new-password"
            type="password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="account-confirm-password">Confirm new password</Label>
          <Input
            id="account-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving || !isDirty} className="w-fit">
        {saving ? "Saving…" : hasPassword ? "Update password" : "Set password"}
      </Button>
    </div>
  );
}

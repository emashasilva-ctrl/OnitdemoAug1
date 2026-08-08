"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { deleteAccount } from "@/lib/actions/account";

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

  async function handleDelete() {
    setDeleting(true);
    await deleteAccount();
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-card p-4 sm:p-6">
      <div>
        <p className="font-heading font-semibold text-foreground">Delete account</p>
        <p className="text-sm text-muted-foreground">
          Permanently deletes your On It! account. Your past booking history is kept for the
          salons you visited, but is no longer tied to your name.
        </p>
      </div>
      <Button
        variant="destructive"
        className="w-fit"
        onClick={() => setOpen(true)}
      >
        Delete my account
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This can&apos;t be undone. Type DELETE to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="delete-confirm">Confirm</Label>
            <Input
              id="delete-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!canDelete || deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

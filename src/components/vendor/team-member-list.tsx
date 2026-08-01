"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createTeamMember,
  deleteTeamMember,
  updateTeamMember,
  updateTeamMemberHours,
} from "@/lib/actions/team-members";
import { HoursEditor } from "@/components/vendor/hours-editor";
import type { VendorTeamMember, RawOpenHours } from "@/lib/data/vendor";
import type { Service } from "@/lib/types";

interface FormState {
  name: string;
  role: string;
  serviceIds: string[];
}

const emptyForm: FormState = { name: "", role: "", serviceIds: [] };

export function TeamMemberList({
  salonId,
  teamMembers,
  services,
  hoursByMember,
}: {
  salonId: string;
  teamMembers: VendorTeamMember[];
  services: Service[];
  hoursByMember: Record<string, RawOpenHours[]>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VendorTeamMember | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [hoursFor, setHoursFor] = useState<VendorTeamMember | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(member: VendorTeamMember) {
    setEditing(member);
    setForm({ name: member.name, role: member.role ?? "", serviceIds: member.serviceIds });
    setOpen(true);
  }

  function toggleService(id: string) {
    setForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(id)
        ? prev.serviceIds.filter((s) => s !== id)
        : [...prev.serviceIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    const input = { salonId, name: form.name, role: form.role || undefined, serviceIds: form.serviceIds };
    const result = editing ? await updateTeamMember(editing.id, input) : await createTeamMember(input);
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(editing ? "Team member updated" : "Team member added");
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(member: VendorTeamMember) {
    if (!confirm(`Remove ${member.name} from the team? Any appointments assigned to them will become unassigned, not deleted.`)) return;
    const result = await deleteTeamMember(member.id, salonId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast("Team member removed");
    router.refresh();
  }

  function serviceName(id: string) {
    return services.find((s) => s.id === id)?.name ?? "Unknown service";
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{teamMembers.length} team members</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Add team member
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {teamMembers.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No team members yet. Add your first beautician to start assigning bookings to them.
          </p>
        )}
        {teamMembers.map((member) => (
          <div key={member.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-heading font-semibold text-foreground">{member.name}</p>
                {member.role && <p className="text-sm text-muted-foreground">{member.role}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setHoursFor(member)}>
                  <Clock className="size-3.5" />
                  Hours
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(member)} aria-label="Edit">
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(member)}
                  aria-label="Delete"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {member.serviceIds.length === 0 ? (
                <span className="text-xs text-muted-foreground">No services assigned</span>
              ) : (
                member.serviceIds.map((id) => (
                  <Badge key={id} variant="secondary">
                    {serviceName(id)}
                  </Badge>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit team member" : "Add team member"}</DialogTitle>
            <DialogDescription>Pick which of your services they can perform.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tm-name">Name</Label>
              <Input
                id="tm-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tm-role">Role (optional)</Label>
              <Input
                id="tm-role"
                placeholder="e.g. Senior Stylist"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Services</Label>
              <div className="flex flex-wrap gap-2">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      form.serviceIds.includes(s.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
                {services.length === 0 && (
                  <p className="text-sm text-muted-foreground">Add services on the Services tab first.</p>
                )}
              </div>
            </div>
            <DialogFooter className="px-0 pb-0">
              <Button type="submit" disabled={submitting || !form.name.trim()} className="w-full">
                {submitting ? "Saving…" : editing ? "Save changes" : "Add team member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!hoursFor} onOpenChange={(o) => !o && setHoursFor(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{hoursFor?.name}&apos;s hours</DialogTitle>
            <DialogDescription>
              Separate from the salon&apos;s overall hours — used to shade their calendar view.
            </DialogDescription>
          </DialogHeader>
          {hoursFor && (
            <HoursEditor
              key={hoursFor.id}
              initialHours={hoursByMember[hoursFor.id] ?? []}
              onSave={(hours) => updateTeamMemberHours(hoursFor.id, salonId, hours)}
              onSaved={() => setHoursFor(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

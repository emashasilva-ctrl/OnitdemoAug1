"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PartnerForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast.success("Application received");
    }, 600);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-7" />
        </span>
        <p className="font-heading text-xl font-semibold text-foreground">
          Thanks — we&apos;ll be in touch
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Our partnerships team reviews every application and typically
          responds within 2 business days.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="salon-name">Salon name</Label>
          <Input id="salon-name" required placeholder="e.g. The Parlour" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="owner-name">Your name</Label>
          <Input id="owner-name" required placeholder="Owner or manager" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" required type="tel" placeholder="+94 77 123 4567" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" required type="email" placeholder="you@salon.lk" />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="area">Area in Colombo</Label>
          <Input id="area" required placeholder="e.g. Bambalapitiya, Colombo 4" />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="message">Tell us about your salon (optional)</Label>
          <Textarea
            id="message"
            rows={3}
            placeholder="Services you offer, chair count, opening hours..."
          />
        </div>
      </div>
      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-fit">
        {submitting ? "Submitting..." : "Request to Join"}
      </Button>
    </form>
  );
}
